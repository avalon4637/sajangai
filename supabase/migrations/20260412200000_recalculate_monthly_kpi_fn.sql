-- Atomic KPI recalculation with advisory lock to prevent race conditions.
-- Replaces the previous 5-query-then-upsert pattern in kpi-sync.ts.

CREATE OR REPLACE FUNCTION recalculate_monthly_kpi(
  p_business_id UUID,
  p_year_month TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_month_start DATE;
  v_month_end   DATE;
  v_total_revenue       NUMERIC(12,0) := 0;
  v_total_expense       NUMERIC(12,0) := 0;
  v_total_fixed_expense NUMERIC(12,0) := 0;
  v_total_fixed_cost    NUMERIC(12,0) := 0;
  v_total_labor_cost    NUMERIC(12,0) := 0;
  v_combined_fixed      NUMERIC(12,0) := 0;
  v_gross_profit        NUMERIC(12,0) := 0;
  v_net_profit          NUMERIC(12,0) := 0;
  v_gross_margin        NUMERIC(5,2)  := 0;
  v_labor_ratio         NUMERIC(5,2)  := 0;
  v_fixed_cost_ratio    NUMERIC(5,2)  := 0;
  v_survival_score      NUMERIC(5,1)  := 0;
  v_score               NUMERIC       := 0;
  v_profit_margin       NUMERIC;
BEGIN
  -- Advisory lock keyed on (business_id, year_month) to serialize concurrent calls
  PERFORM pg_advisory_xact_lock(
    hashtext(p_business_id::text || p_year_month)
  );

  -- Compute date boundaries
  v_month_start := (p_year_month || '-01')::DATE;
  v_month_end   := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- 1. Total revenue
  SELECT COALESCE(SUM(amount), 0)
    INTO v_total_revenue
    FROM revenues
   WHERE business_id = p_business_id
     AND date >= v_month_start
     AND date <= v_month_end;

  -- 2. Total variable expenses (type = 'variable')
  SELECT COALESCE(SUM(amount), 0)
    INTO v_total_expense
    FROM expenses
   WHERE business_id = p_business_id
     AND type = 'variable'
     AND date >= v_month_start
     AND date <= v_month_end;

  -- 3. Fixed expenses from expenses table (type = 'fixed')
  SELECT COALESCE(SUM(amount), 0)
    INTO v_total_fixed_expense
    FROM expenses
   WHERE business_id = p_business_id
     AND type = 'fixed'
     AND date >= v_month_start
     AND date <= v_month_end;

  -- 4. Fixed costs from fixed_costs table (active during this month)
  SELECT COALESCE(SUM(amount), 0)
    INTO v_total_fixed_cost
    FROM fixed_costs
   WHERE business_id = p_business_id
     AND (start_date IS NULL OR start_date <= v_month_end)
     AND (end_date   IS NULL OR end_date   >= v_month_start);

  -- Labor cost subset of fixed_costs
  SELECT COALESCE(SUM(amount), 0)
    INTO v_total_labor_cost
    FROM fixed_costs
   WHERE business_id = p_business_id
     AND is_labor = true
     AND (start_date IS NULL OR start_date <= v_month_end)
     AND (end_date   IS NULL OR end_date   >= v_month_start);

  -- Combined fixed = fixed_costs table + fixed type expenses
  v_combined_fixed := v_total_fixed_cost + v_total_fixed_expense;

  -- 5. KPI calculation (mirrors src/lib/kpi/calculator.ts)
  v_gross_profit := v_total_revenue - v_total_expense;
  v_net_profit   := v_gross_profit - v_combined_fixed;

  IF v_total_revenue > 0 THEN
    v_gross_margin    := ROUND((v_gross_profit::NUMERIC  / v_total_revenue) * 100, 2);
    v_labor_ratio     := ROUND((v_total_labor_cost::NUMERIC / v_total_revenue) * 100, 2);
    v_fixed_cost_ratio := ROUND((v_combined_fixed::NUMERIC  / v_total_revenue) * 100, 2);
  END IF;

  -- 6. Survival score (mirrors calculateSurvivalScore in calculator.ts)
  v_score := 0;
  IF v_total_revenue > 0 THEN
    -- Net profit score (30 pts)
    IF v_net_profit > 0 THEN
      v_profit_margin := (v_net_profit::NUMERIC / v_total_revenue) * 100;
      v_score := v_score + LEAST(30, v_profit_margin * 3);
    END IF;

    -- Gross margin score (25 pts)
    IF v_gross_margin >= 60 THEN v_score := v_score + 25;
    ELSIF v_gross_margin >= 40 THEN v_score := v_score + 20;
    ELSIF v_gross_margin >= 20 THEN v_score := v_score + 12;
    ELSIF v_gross_margin >= 10 THEN v_score := v_score + 5;
    END IF;

    -- Labor ratio score (20 pts) - lower is better
    IF v_labor_ratio <= 20 THEN v_score := v_score + 20;
    ELSIF v_labor_ratio <= 30 THEN v_score := v_score + 15;
    ELSIF v_labor_ratio <= 40 THEN v_score := v_score + 8;
    ELSIF v_labor_ratio <= 50 THEN v_score := v_score + 3;
    END IF;

    -- Fixed cost ratio score (25 pts) - lower is better
    IF v_fixed_cost_ratio <= 30 THEN v_score := v_score + 25;
    ELSIF v_fixed_cost_ratio <= 50 THEN v_score := v_score + 18;
    ELSIF v_fixed_cost_ratio <= 70 THEN v_score := v_score + 10;
    ELSIF v_fixed_cost_ratio <= 85 THEN v_score := v_score + 4;
    END IF;
  END IF;

  v_survival_score := ROUND(LEAST(100, GREATEST(0, v_score)), 1);

  -- 7. Upsert monthly summary
  INSERT INTO monthly_summaries (
    business_id, year_month,
    total_revenue, total_expense, total_fixed_cost, total_labor_cost,
    gross_profit, net_profit, gross_margin, labor_ratio, fixed_cost_ratio,
    survival_score, calculated_at
  ) VALUES (
    p_business_id, p_year_month,
    v_total_revenue, v_total_expense, v_combined_fixed, v_total_labor_cost,
    v_gross_profit, v_net_profit, v_gross_margin, v_labor_ratio, v_fixed_cost_ratio,
    v_survival_score, now()
  )
  ON CONFLICT (business_id, year_month)
  DO UPDATE SET
    total_revenue    = EXCLUDED.total_revenue,
    total_expense    = EXCLUDED.total_expense,
    total_fixed_cost = EXCLUDED.total_fixed_cost,
    total_labor_cost = EXCLUDED.total_labor_cost,
    gross_profit     = EXCLUDED.gross_profit,
    net_profit       = EXCLUDED.net_profit,
    gross_margin     = EXCLUDED.gross_margin,
    labor_ratio      = EXCLUDED.labor_ratio,
    fixed_cost_ratio = EXCLUDED.fixed_cost_ratio,
    survival_score   = EXCLUDED.survival_score,
    calculated_at    = now();
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION recalculate_monthly_kpi(UUID, TEXT) TO authenticated;

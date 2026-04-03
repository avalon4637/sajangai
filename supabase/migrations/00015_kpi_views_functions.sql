-- SPEC-FINANCE-001 M2: KPI Views and Functions
-- Unified views over existing revenues/expenses/fixed_costs tables

-- ============================================================
-- 1. Unified monthly summary view
-- ============================================================

CREATE OR REPLACE VIEW v_monthly_unified AS
SELECT
  r.business_id,
  DATE_TRUNC('month', r.date)::DATE AS month,
  COALESCE(SUM(r.amount), 0) AS total_revenue,
  0::NUMERIC AS total_expense,
  'revenue' AS type
FROM revenues r
GROUP BY r.business_id, DATE_TRUNC('month', r.date)
UNION ALL
SELECT
  e.business_id,
  DATE_TRUNC('month', e.date)::DATE AS month,
  0::NUMERIC AS total_revenue,
  COALESCE(SUM(e.amount), 0) AS total_expense,
  'expense' AS type
FROM expenses e
GROUP BY e.business_id, DATE_TRUNC('month', e.date);

-- ============================================================
-- 2. Category monthly breakdown
-- ============================================================

CREATE OR REPLACE VIEW v_category_monthly AS
SELECT
  business_id,
  DATE_TRUNC('month', date)::DATE AS month,
  'revenue' AS type,
  channel AS major_category,
  category AS minor_category,
  SUM(amount) AS amount
FROM revenues
WHERE channel IS NOT NULL
GROUP BY business_id, DATE_TRUNC('month', date), channel, category
UNION ALL
SELECT
  business_id,
  DATE_TRUNC('month', date)::DATE AS month,
  'expense' AS type,
  category AS major_category,
  category AS minor_category,
  SUM(amount) AS amount
FROM expenses
GROUP BY business_id, DATE_TRUNC('month', date), category;

-- ============================================================
-- 3. Budget vs actual comparison view
-- ============================================================

CREATE OR REPLACE VIEW v_budget_vs_actual AS
SELECT
  b.business_id,
  b.year,
  b.month,
  b.category,
  b.target_amount,
  COALESCE(actual.amount, 0) AS actual_amount,
  b.target_amount - COALESCE(actual.amount, 0) AS variance,
  CASE
    WHEN b.target_amount > 0
    THEN ROUND(COALESCE(actual.amount, 0)::NUMERIC / b.target_amount * 100, 1)
    ELSE 0
  END AS achievement_rate
FROM budgets b
LEFT JOIN (
  -- Revenue actuals
  SELECT
    business_id,
    EXTRACT(YEAR FROM date)::INT AS year,
    EXTRACT(MONTH FROM date)::INT AS month,
    'revenue' AS category,
    SUM(amount) AS amount
  FROM revenues
  GROUP BY business_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
  UNION ALL
  -- Expense actuals by category
  SELECT
    business_id,
    EXTRACT(YEAR FROM date)::INT AS year,
    EXTRACT(MONTH FROM date)::INT AS month,
    category,
    SUM(amount) AS amount
  FROM expenses
  GROUP BY business_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), category
  UNION ALL
  -- Fixed cost actuals by category
  SELECT
    business_id,
    EXTRACT(YEAR FROM start_date)::INT AS year,
    EXTRACT(MONTH FROM start_date)::INT AS month,
    category,
    SUM(amount) AS amount
  FROM fixed_costs
  WHERE start_date IS NOT NULL
  GROUP BY business_id, EXTRACT(YEAR FROM start_date), EXTRACT(MONTH FROM start_date), category
) actual ON
  actual.business_id = b.business_id
  AND actual.year = b.year
  AND actual.month = b.month
  AND actual.category = b.category;

-- ============================================================
-- 4. Category ranking function
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_category_ranking(
  p_business_id UUID,
  p_year INT,
  p_month INT,
  p_type TEXT  -- 'revenue' or 'expense'
)
RETURNS JSONB AS $$
BEGIN
  IF p_type = 'revenue' THEN
    RETURN (
      SELECT COALESCE(jsonb_agg(row_data ORDER BY rank_num), '[]'::jsonb)
      FROM (
        SELECT
          jsonb_build_object(
            'rank', RANK() OVER (ORDER BY total DESC),
            'category', cat,
            'amount', total,
            'percentage', ROUND(total::NUMERIC / NULLIF(SUM(total) OVER(), 0) * 100, 1)
          ) AS row_data,
          RANK() OVER (ORDER BY total DESC) AS rank_num
        FROM (
          SELECT
            COALESCE(channel, category, 'other') AS cat,
            SUM(amount) AS total
          FROM revenues
          WHERE business_id = p_business_id
            AND EXTRACT(YEAR FROM date) = p_year
            AND EXTRACT(MONTH FROM date) = p_month
          GROUP BY COALESCE(channel, category, 'other')
          HAVING SUM(amount) > 0
        ) sub
      ) ranked
    );
  ELSE
    RETURN (
      SELECT COALESCE(jsonb_agg(row_data ORDER BY rank_num), '[]'::jsonb)
      FROM (
        SELECT
          jsonb_build_object(
            'rank', RANK() OVER (ORDER BY total DESC),
            'category', cat,
            'amount', total,
            'percentage', ROUND(total::NUMERIC / NULLIF(SUM(total) OVER(), 0) * 100, 1)
          ) AS row_data,
          RANK() OVER (ORDER BY total DESC) AS rank_num
        FROM (
          SELECT category AS cat, SUM(amount) AS total
          FROM expenses
          WHERE business_id = p_business_id
            AND EXTRACT(YEAR FROM date) = p_year
            AND EXTRACT(MONTH FROM date) = p_month
          GROUP BY category
          HAVING SUM(amount) > 0
          UNION ALL
          SELECT category AS cat, SUM(amount) AS total
          FROM fixed_costs
          WHERE business_id = p_business_id
            AND start_date IS NOT NULL
            AND EXTRACT(YEAR FROM start_date) = p_year
            AND EXTRACT(MONTH FROM start_date) = p_month
          GROUP BY category
          HAVING SUM(amount) > 0
        ) sub
      ) ranked
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. Daily cumulative + 7-day moving average
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_daily_cumulative(
  p_business_id UUID,
  p_year INT,
  p_month INT
)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(row_data ORDER BY day), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
        'date', d.day::TEXT,
        'dailyRevenue', COALESCE(t.daily_rev, 0),
        'movingAvg7d', ROUND(AVG(COALESCE(t.daily_rev, 0)) OVER (
          ORDER BY d.day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        )),
        'cumulativeRevenue', SUM(COALESCE(t.daily_rev, 0)) OVER (ORDER BY d.day)
      ) AS row_data,
      d.day
      FROM generate_series(
        make_date(p_year, p_month, 1),
        LEAST(
          (make_date(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::DATE,
          CURRENT_DATE
        ),
        '1 day'
      ) AS d(day)
      LEFT JOIN (
        SELECT date, SUM(amount) AS daily_rev
        FROM revenues
        WHERE business_id = p_business_id
        GROUP BY date
      ) t ON t.date = d.day
    ) sub
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

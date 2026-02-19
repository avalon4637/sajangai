"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateKpi } from "@/lib/kpi/calculator";

/**
 * Recalculate monthly KPI summary for a given business and month.
 * Aggregates revenues, variable expenses, and fixed costs,
 * then upserts the monthly_summaries table.
 */
export async function recalculateMonthlyKpi(
  businessId: string,
  yearMonth: string
): Promise<void> {
  const supabase = await createClient();

  // 1. Total revenue for the month
  const { data: revenueData } = await supabase
    .from("revenues")
    .select("amount")
    .eq("business_id", businessId)
    .gte("date", `${yearMonth}-01`)
    .lte("date", `${yearMonth}-31`);

  const totalRevenue =
    revenueData?.reduce((sum, r) => sum + r.amount, 0) ?? 0;

  // 2. Total variable expenses for the month
  const { data: expenseData } = await supabase
    .from("expenses")
    .select("amount")
    .eq("business_id", businessId)
    .eq("type", "variable")
    .gte("date", `${yearMonth}-01`)
    .lte("date", `${yearMonth}-31`);

  const totalExpense =
    expenseData?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  // 3. Fixed expenses for the month (type='fixed' in expenses table)
  const { data: fixedExpenseData } = await supabase
    .from("expenses")
    .select("amount")
    .eq("business_id", businessId)
    .eq("type", "fixed")
    .gte("date", `${yearMonth}-01`)
    .lte("date", `${yearMonth}-31`);

  const totalFixedExpense =
    fixedExpenseData?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  // 4. Fixed costs from fixed_costs table (all entries)
  const { data: fixedCostData } = await supabase
    .from("fixed_costs")
    .select("amount, is_labor")
    .eq("business_id", businessId);

  const totalFixedCostFromTable =
    fixedCostData?.reduce((sum, f) => sum + f.amount, 0) ?? 0;
  const totalLaborCost =
    fixedCostData
      ?.filter((f) => f.is_labor)
      .reduce((sum, f) => sum + f.amount, 0) ?? 0;

  // Combined fixed costs = fixed_costs table + fixed type expenses
  const totalFixedCost = totalFixedCostFromTable + totalFixedExpense;

  // 5. Calculate KPI
  const kpi = calculateKpi({
    totalRevenue,
    totalExpense,
    totalFixedCost,
    totalLaborCost,
  });

  // 6. Upsert monthly summary
  await supabase.from("monthly_summaries").upsert(
    {
      business_id: businessId,
      year_month: yearMonth,
      total_revenue: totalRevenue,
      total_expense: totalExpense,
      total_fixed_cost: totalFixedCost,
      total_labor_cost: totalLaborCost,
      gross_profit: kpi.grossProfit,
      net_profit: kpi.netProfit,
      gross_margin: kpi.grossMargin,
      labor_ratio: kpi.laborRatio,
      fixed_cost_ratio: kpi.fixedCostRatio,
      survival_score: kpi.survivalScore,
    },
    { onConflict: "business_id,year_month" }
  );
}

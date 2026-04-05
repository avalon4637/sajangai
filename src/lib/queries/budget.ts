import { createClient } from "@/lib/supabase/server";

export interface BudgetVsActual {
  category: string;
  targetAmount: number;
  actualAmount: number;
  variance: number;
  achievementRate: number;
}

/** 3-month category average for reference display */
export interface CategoryAverage {
  category: string;
  avgAmount: number;
}

/** Aggregated data for the budget dashboard page */
export interface BudgetPageData {
  comparison: BudgetVsActual[];
  categoryAverages: CategoryAverage[];
  prevMonthTotalRevenue: number;
  prevMonthTotalExpense: number;
  currentMonthTotalRevenue: number;
  currentMonthTotalExpense: number;
}

export async function getBudgetComparison(
  businessId: string,
  year: number,
  month: number
): Promise<BudgetVsActual[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  const { data, error } = await supabase
    .from("v_budget_vs_actual")
    .select("*")
    .eq("business_id", businessId)
    .eq("year", year)
    .eq("month", month);

  if (error) throw error;

  return (data ?? []).map((r: Record<string, unknown>) => ({
    category: r.category as string,
    targetAmount: Number(r.target_amount),
    actualAmount: Number(r.actual_amount),
    variance: Number(r.variance),
    achievementRate: Number(r.achievement_rate),
  }));
}

/**
 * Fetch all data needed for the budget dashboard page in a single call.
 * Includes budget comparison, 3-month category averages, and month-over-month totals.
 */
export async function getBudgetPageData(
  businessId: string,
  year: number,
  month: number
): Promise<BudgetPageData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  // Calculate date ranges for 3-month average
  const threeMonthsAgo = new Date(year, month - 4, 1);
  const currentMonthEnd = new Date(year, month, 0);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevYearMonth = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
  const currentYearMonth = `${year}-${String(month).padStart(2, "0")}`;

  // Run all queries in parallel
  const [comparisonResult, expenseAvgResult, revenueAvgResult, summariesResult] =
    await Promise.all([
      // 1. Budget vs actual comparison
      supabase
        .from("v_budget_vs_actual")
        .select("*")
        .eq("business_id", businessId)
        .eq("year", year)
        .eq("month", month),

      // 2. Expense averages by category (last 3 months)
      supabase
        .from("expenses")
        .select("category, amount")
        .eq("business_id", businessId)
        .gte("date", threeMonthsAgo.toISOString().slice(0, 10))
        .lte("date", currentMonthEnd.toISOString().slice(0, 10)),

      // 3. Revenue totals (last 3 months for average)
      supabase
        .from("revenues")
        .select("category, amount, date")
        .eq("business_id", businessId)
        .gte("date", threeMonthsAgo.toISOString().slice(0, 10))
        .lte("date", currentMonthEnd.toISOString().slice(0, 10)),

      // 4. Monthly summaries for prev and current month
      supabase
        .from("monthly_summaries")
        .select("year_month, total_revenue, total_expense")
        .eq("business_id", businessId)
        .in("year_month", [prevYearMonth, currentYearMonth]),
    ]);

  // Parse comparison
  const comparison: BudgetVsActual[] = (comparisonResult.data ?? []).map(
    (r: Record<string, unknown>) => ({
      category: r.category as string,
      targetAmount: Number(r.target_amount),
      actualAmount: Number(r.actual_amount),
      variance: Number(r.variance),
      achievementRate: Number(r.achievement_rate),
    })
  );

  // Compute 3-month category averages from expenses
  const expenseByCategory: Record<string, number[]> = {};
  for (const row of expenseAvgResult.data ?? []) {
    const cat = row.category as string;
    if (!expenseByCategory[cat]) expenseByCategory[cat] = [];
    expenseByCategory[cat].push(Number(row.amount));
  }

  // Revenue average (grouped as single "매출" category)
  const revenueAmounts: number[] = (revenueAvgResult.data ?? []).map(
    (r: Record<string, unknown>) => Number(r.amount)
  );
  const revenueTotal = revenueAmounts.reduce((s, v) => s + v, 0);

  const categoryAverages: CategoryAverage[] = [];
  // Revenue average (divide by 3 for 3-month average)
  if (revenueTotal > 0) {
    categoryAverages.push({ category: "매출", avgAmount: Math.round(revenueTotal / 3) });
  }
  // Expense category averages
  for (const [cat, amounts] of Object.entries(expenseByCategory)) {
    const total = amounts.reduce((s, v) => s + v, 0);
    categoryAverages.push({ category: cat, avgAmount: Math.round(total / 3) });
  }

  // Parse monthly summaries
  let prevMonthTotalRevenue = 0;
  let prevMonthTotalExpense = 0;
  let currentMonthTotalRevenue = 0;
  let currentMonthTotalExpense = 0;

  for (const row of summariesResult.data ?? []) {
    if (row.year_month === prevYearMonth) {
      prevMonthTotalRevenue = Number(row.total_revenue);
      prevMonthTotalExpense = Number(row.total_expense);
    }
    if (row.year_month === currentYearMonth) {
      currentMonthTotalRevenue = Number(row.total_revenue);
      currentMonthTotalExpense = Number(row.total_expense);
    }
  }

  return {
    comparison,
    categoryAverages,
    prevMonthTotalRevenue,
    prevMonthTotalExpense,
    currentMonthTotalRevenue,
    currentMonthTotalExpense,
  };
}

export async function upsertBudget(
  businessId: string,
  year: number,
  month: number,
  category: string,
  targetAmount: number
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  const { error } = await supabase.from("budgets").upsert(
    {
      business_id: businessId,
      year,
      month,
      category,
      target_amount: targetAmount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id,year,month,category" }
  );

  if (error) throw error;
}

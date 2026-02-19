import { createClient } from "@/lib/supabase/server";
import type { MonthlySummary } from "@/types/data-entry";

/**
 * Get monthly KPI summary for a specific business and month.
 */
export async function getMonthlyKpi(
  businessId: string,
  yearMonth: string
): Promise<MonthlySummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("monthly_summaries")
    .select("*")
    .eq("business_id", businessId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (error) {
    throw new Error(`월간 KPI 조회 실패: ${error.message}`);
  }

  return data;
}

/**
 * Get trend data for last N months, ordered ascending by year_month.
 */
export async function getMonthlyTrend(
  businessId: string,
  months: number
): Promise<MonthlySummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("monthly_summaries")
    .select("*")
    .eq("business_id", businessId)
    .order("year_month", { ascending: false })
    .limit(months);

  if (error) {
    throw new Error(`월간 추이 데이터 조회 실패: ${error.message}`);
  }

  // Return in ascending order for chart display
  return (data ?? []).reverse();
}

/**
 * Get revenue breakdown by channel for a specific month.
 */
export async function getRevenueByChannel(
  businessId: string,
  yearMonth: string
): Promise<{ channel: string; total: number }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("revenues")
    .select("channel, amount")
    .eq("business_id", businessId)
    .gte("date", `${yearMonth}-01`)
    .lte("date", `${yearMonth}-31`);

  if (error) {
    throw new Error(`채널별 매출 조회 실패: ${error.message}`);
  }

  // Aggregate by channel
  const channelMap = new Map<string, number>();
  for (const row of data ?? []) {
    const channel = row.channel ?? "기타";
    channelMap.set(channel, (channelMap.get(channel) ?? 0) + row.amount);
  }

  return Array.from(channelMap.entries())
    .map(([channel, total]) => ({ channel, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Get expense breakdown: variable costs, fixed costs, and labor costs.
 */
export async function getExpenseBreakdown(
  businessId: string,
  yearMonth: string
): Promise<{ variable: number; fixed: number; labor: number }> {
  const supabase = await createClient();

  // Variable expenses for the month
  const { data: variableData, error: varError } = await supabase
    .from("expenses")
    .select("amount")
    .eq("business_id", businessId)
    .eq("type", "variable")
    .gte("date", `${yearMonth}-01`)
    .lte("date", `${yearMonth}-31`);

  if (varError) {
    throw new Error(`변동비 조회 실패: ${varError.message}`);
  }

  // Fixed expenses from expenses table for the month
  const { data: fixedExpenseData, error: fixedExpError } = await supabase
    .from("expenses")
    .select("amount")
    .eq("business_id", businessId)
    .eq("type", "fixed")
    .gte("date", `${yearMonth}-01`)
    .lte("date", `${yearMonth}-31`);

  if (fixedExpError) {
    throw new Error(`고정 비용 조회 실패: ${fixedExpError.message}`);
  }

  // Fixed costs from fixed_costs table (recurring costs)
  const { data: fixedCostData, error: fcError } = await supabase
    .from("fixed_costs")
    .select("amount, is_labor")
    .eq("business_id", businessId);

  if (fcError) {
    throw new Error(`고정비 조회 실패: ${fcError.message}`);
  }

  const variable =
    variableData?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
  const fixedExpense =
    fixedExpenseData?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
  const fixedCostTotal =
    fixedCostData?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
  const labor =
    fixedCostData
      ?.filter((r) => r.is_labor)
      .reduce((sum, r) => sum + r.amount, 0) ?? 0;

  // Fixed = all fixed costs minus labor (to show labor separately)
  const fixed = fixedExpense + fixedCostTotal - labor;

  return { variable, fixed, labor };
}

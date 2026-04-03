// ROI Calculator - Conservative estimation of AI 점장 value
// Based on WBS v2 F3.4: 6 ROI categories with conservative attribution

import { createClient } from "@/lib/supabase/server";

export interface RoiBreakdown {
  feeSavings: number; // Channel mix optimization savings
  anomalyPrevention: number; // Early detection preventing losses
  costSavings: number; // Expense reduction from accepted recommendations
  customerRetention: number; // Re-engagement message conversions
  timeSavings: number; // Hours saved (converted to KRW)
  totalValue: number;
  subscriptionCost: number; // 9,900 KRW
  roiMultiple: number; // totalValue / subscriptionCost
  period: string; // YYYY-MM
}

const SUBSCRIPTION_COST = 9900;
const TIME_VALUE_PER_HOUR = 15000; // KRW per hour (minimum wage proxy)
const REPLY_MINUTES = 3; // Minutes saved per auto-reply
const REPORT_MINUTES = 10; // Minutes saved per daily report

/**
 * Calculate monthly ROI for a business.
 * Uses action_results + insight_events + daily_reports for conservative estimation.
 */
export async function calculateMonthlyRoi(
  businessId: string,
  yearMonth: string // YYYY-MM
): Promise<RoiBreakdown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  const monthStart = `${yearMonth}-01`;
  const nextMonth = getNextMonth(yearMonth);
  const monthEnd = `${nextMonth}-01`;

  // 1. Fee savings: from B1 scenarios acted on
  const { data: feeActions } = await supabase
    .from("action_results")
    .select("result_data")
    .eq("business_id", businessId)
    .eq("action_type", "run_simulation")
    .gte("executed_at", monthStart)
    .lt("executed_at", monthEnd);

  const feeSavings = (feeActions ?? []).reduce(
    (sum: number, a: { result_data: Record<string, unknown> | null }) =>
      sum + (Number(a.result_data?.estimatedSavings) || 0),
    0
  );

  // 2. Anomaly prevention: from critical/warning insights acted on
  const { data: actedInsights } = await supabase
    .from("insight_events")
    .select("solution, severity")
    .eq("business_id", businessId)
    .eq("status", "acted")
    .in("severity", ["critical", "warning"])
    .gte("created_at", monthStart)
    .lt("created_at", monthEnd);

  // Conservative: attribute 50% of estimated value for acted insights
  const anomalyPrevention = (actedInsights ?? []).reduce(
    (sum: number, i: { solution: { estimatedValue?: number } }) =>
      sum + ((i.solution?.estimatedValue ?? 0) * 0.5),
    0
  );

  // 3. Cost savings: from B2-B7 insights acted on
  const { data: costInsights } = await supabase
    .from("insight_events")
    .select("solution")
    .eq("business_id", businessId)
    .eq("status", "acted")
    .eq("category", "cost")
    .gte("created_at", monthStart)
    .lt("created_at", monthEnd);

  const costSavings = (costInsights ?? []).reduce(
    (sum: number, i: { solution: { estimatedValue?: number } }) =>
      sum + ((i.solution?.estimatedValue ?? 0) * 0.3),
    0
  );

  // 4. Customer retention: viral messages sent → re-orders
  const { data: messageActions } = await supabase
    .from("action_results")
    .select("result_data")
    .eq("business_id", businessId)
    .eq("action_type", "send_message")
    .gte("executed_at", monthStart)
    .lt("executed_at", monthEnd);

  // Conservative: assume 10% conversion at avg 15,000 KRW order
  const messagesSent = (messageActions ?? []).length;
  const customerRetention = messagesSent * 0.1 * 15000;

  // 5. Time savings: daily reports + review replies
  const { count: reportCount } = await supabase
    .from("daily_reports")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("report_date", monthStart)
    .lt("report_date", monthEnd);

  const { count: replyCount } = await supabase
    .from("action_results")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("action_type", "reply_reviews")
    .gte("executed_at", monthStart)
    .lt("executed_at", monthEnd);

  const hoursSaved =
    ((reportCount ?? 0) * REPORT_MINUTES + (replyCount ?? 0) * REPLY_MINUTES) / 60;
  const timeSavings = Math.round(hoursSaved * TIME_VALUE_PER_HOUR);

  const totalValue = Math.round(
    feeSavings + anomalyPrevention + costSavings + customerRetention + timeSavings
  );

  return {
    feeSavings: Math.round(feeSavings),
    anomalyPrevention: Math.round(anomalyPrevention),
    costSavings: Math.round(costSavings),
    customerRetention: Math.round(customerRetention),
    timeSavings,
    totalValue,
    subscriptionCost: SUBSCRIPTION_COST,
    roiMultiple: SUBSCRIPTION_COST > 0 ? Math.round(totalValue / SUBSCRIPTION_COST) : 0,
    period: yearMonth,
  };
}

function getNextMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const date = new Date(y, m, 1); // month is 0-indexed, so m = next month
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

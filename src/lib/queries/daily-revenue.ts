import { createClient } from "@/lib/supabase/server";
import { getLastDayOfMonth } from "@/lib/utils";

export interface DailyRevenueSummary {
  date: string;
  totalAmount: number;
  transactionCount: number;
  channels: Record<string, number>;
}

export interface MonthlyAnalysisSummary {
  totalRevenue: number;
  totalTransactions: number;
  avgDailyRevenue: number;
  avgTransactionAmount: number;
  channelBreakdown: { channel: string; amount: number; count: number }[];
  dayOfWeekAverage: { day: number; label: string; avgAmount: number; avgCount: number }[];
  daysWithRevenue: number;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * Get daily revenue data for a specific month, aggregated by date.
 */
export async function getDailyRevenues(
  businessId: string,
  yearMonth: string
): Promise<DailyRevenueSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("revenues")
    .select("date, amount, channel")
    .eq("business_id", businessId)
    .gte("date", `${yearMonth}-01`)
    .lte("date", getLastDayOfMonth(yearMonth))
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`일별 매출 조회 실패: ${error.message}`);
  }

  // Aggregate by date
  const dateMap = new Map<string, DailyRevenueSummary>();

  for (const row of data ?? []) {
    const existing = dateMap.get(row.date);
    const channel = row.channel ?? "기타";

    if (existing) {
      existing.totalAmount += row.amount;
      existing.transactionCount += 1;
      existing.channels[channel] = (existing.channels[channel] ?? 0) + row.amount;
    } else {
      dateMap.set(row.date, {
        date: row.date,
        totalAmount: row.amount,
        transactionCount: 1,
        channels: { [channel]: row.amount },
      });
    }
  }

  return Array.from(dateMap.values());
}

/**
 * Get previous month's daily revenue for comparison.
 */
export async function getPreviousMonthRevenues(
  businessId: string,
  yearMonth: string
): Promise<DailyRevenueSummary[]> {
  const [year, month] = yearMonth.split("-").map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevYearMonth = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  return getDailyRevenues(businessId, prevYearMonth);
}

/**
 * Calculate monthly analysis summary from daily data.
 */
export function calculateMonthlyAnalysis(
  dailyData: DailyRevenueSummary[],
  yearMonth: string
): MonthlyAnalysisSummary {
  const totalRevenue = dailyData.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalTransactions = dailyData.reduce((sum, d) => sum + d.transactionCount, 0);
  const daysWithRevenue = dailyData.length;

  // Channel breakdown
  const channelMap = new Map<string, { amount: number; count: number }>();
  for (const day of dailyData) {
    for (const [channel, amount] of Object.entries(day.channels)) {
      const existing = channelMap.get(channel);
      if (existing) {
        existing.amount += amount;
        existing.count += 1;
      } else {
        channelMap.set(channel, { amount, count: 1 });
      }
    }
  }
  const channelBreakdown = Array.from(channelMap.entries())
    .map(([channel, data]) => ({ channel, ...data }))
    .sort((a, b) => b.amount - a.amount);

  // Day of week averages
  const [year, month] = yearMonth.split("-").map(Number);
  const dayOfWeekTotals = new Map<number, { totalAmount: number; totalCount: number; days: number }>();

  // Initialize all days of week
  for (let d = 0; d < 7; d++) {
    dayOfWeekTotals.set(d, { totalAmount: 0, totalCount: 0, days: 0 });
  }

  // Count actual days in month for each day of week
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayCountInMonth = new Map<number, number>();
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    dayCountInMonth.set(dow, (dayCountInMonth.get(dow) ?? 0) + 1);
  }

  for (const day of dailyData) {
    const dow = new Date(day.date).getDay();
    const existing = dayOfWeekTotals.get(dow)!;
    existing.totalAmount += day.totalAmount;
    existing.totalCount += day.transactionCount;
    existing.days += 1;
  }

  const dayOfWeekAverage = Array.from(dayOfWeekTotals.entries())
    .sort(([a], [b]) => {
      // Reorder: Mon(1) to Sun(0) -> 1,2,3,4,5,6,0
      const orderA = a === 0 ? 7 : a;
      const orderB = b === 0 ? 7 : b;
      return orderA - orderB;
    })
    .map(([day, data]) => ({
      day,
      label: DAY_LABELS[day],
      avgAmount: data.days > 0 ? Math.round(data.totalAmount / data.days) : 0,
      avgCount: data.days > 0 ? Math.round((data.totalCount / data.days) * 10) / 10 : 0,
    }));

  return {
    totalRevenue,
    totalTransactions,
    avgDailyRevenue: daysWithRevenue > 0 ? Math.round(totalRevenue / daysWithRevenue) : 0,
    avgTransactionAmount: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0,
    channelBreakdown,
    dayOfWeekAverage,
    daysWithRevenue,
  };
}

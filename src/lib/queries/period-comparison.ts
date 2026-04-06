// Period comparison data builder for enhanced 점장 briefing
// Calculates daily, weekly, monthly comparisons and same-day-last-month delta

import { createClient } from "@/lib/supabase/server";

export interface PeriodData {
  revenue: number;
  expense: number;
  profit: number;
}

export interface PeriodDataWithAvg extends PeriodData {
  avgDaily: number;
}

export interface PeriodComparison {
  // Daily
  yesterday: PeriodData;
  dayBeforeYesterday: PeriodData;
  dayChange: number | null; // percentage

  // Weekly
  thisWeek: PeriodDataWithAvg;
  lastWeek: PeriodDataWithAvg;
  weekChange: number | null; // percentage

  // Monthly
  thisMonth: PeriodData & { daysElapsed: number };
  lastMonth: PeriodData;
  monthChange: number | null; // percentage
  monthProjection: number; // projected month-end revenue based on current pace

  // Same weekday last month comparison
  sameDayLastMonth: { revenue: number } | null;
  sameDayChange: number | null; // percentage
}

// Date helper: format Date to YYYY-MM-DD string
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Calculate percentage change, null if previous is 0
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

// Sum amounts from query result rows
function sumAmounts(rows: { amount: number }[] | null): number {
  return (rows ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

/**
 * Build period comparison data for a business.
 * Queries revenues and expenses tables with date ranges for
 * daily, weekly, monthly, and same-weekday-last-month comparisons.
 */
export async function buildPeriodComparison(
  businessId: string
): Promise<PeriodComparison> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Yesterday and day before
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(dayBefore.getDate() - 2);

  // This week: Monday to yesterday
  const dayOfWeek = yesterday.getDay(); // 0=Sun, 1=Mon...
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisWeekStart = new Date(yesterday);
  thisWeekStart.setDate(thisWeekStart.getDate() - daysFromMonday);
  const thisWeekEnd = yesterday;
  const thisWeekDays = daysFromMonday + 1;

  // Last week: full Mon-Sun
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  const lastWeekStart = new Date(lastWeekEnd);
  lastWeekStart.setDate(lastWeekStart.getDate() - 6);
  const lastWeekDays = 7;

  // This month: 1st to yesterday
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysElapsed = yesterday.getDate();
  const totalDaysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  // Last month: full month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Same weekday last month (e.g., if yesterday was Wednesday, find last month's closest Wednesday)
  const sameDayLastMonth = new Date(yesterday);
  sameDayLastMonth.setMonth(sameDayLastMonth.getMonth() - 1);
  // Adjust to same weekday
  const diff = yesterday.getDay() - sameDayLastMonth.getDay();
  if (diff !== 0) {
    // Find the closest matching weekday
    sameDayLastMonth.setDate(sameDayLastMonth.getDate() + diff);
  }

  // Build all queries in parallel
  const [
    // Daily revenue/expense
    yesterdayRev,
    yesterdayExp,
    dayBeforeRev,
    dayBeforeExp,
    // Weekly revenue/expense
    thisWeekRev,
    thisWeekExp,
    lastWeekRev,
    lastWeekExp,
    // Monthly revenue/expense
    thisMonthRev,
    thisMonthExp,
    lastMonthRev,
    lastMonthExp,
    // Same weekday last month
    sameDayRev,
  ] = await Promise.all([
    // Yesterday
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .eq("date", fmt(yesterday))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),
    sb
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .eq("date", fmt(yesterday))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),

    // Day before yesterday
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .eq("date", fmt(dayBefore))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),
    sb
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .eq("date", fmt(dayBefore))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),

    // This week
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", fmt(thisWeekStart))
      .lte("date", fmt(thisWeekEnd))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),
    sb
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", fmt(thisWeekStart))
      .lte("date", fmt(thisWeekEnd))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),

    // Last week
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", fmt(lastWeekStart))
      .lte("date", fmt(lastWeekEnd))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),
    sb
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", fmt(lastWeekStart))
      .lte("date", fmt(lastWeekEnd))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),

    // This month (up to yesterday)
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", fmt(thisMonthStart))
      .lte("date", fmt(yesterday))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),
    sb
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", fmt(thisMonthStart))
      .lte("date", fmt(yesterday))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),

    // Last month (full)
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", fmt(lastMonthStart))
      .lte("date", fmt(lastMonthEnd))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),
    sb
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", fmt(lastMonthStart))
      .lte("date", fmt(lastMonthEnd))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),

    // Same weekday last month revenue
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .eq("date", fmt(sameDayLastMonth))
      .then((r: { data: { amount: number }[] | null }) => sumAmounts(r.data)),
  ]);

  // Calculate projections
  const dailyAvgThisMonth =
    daysElapsed > 0 ? thisMonthRev / daysElapsed : 0;
  const monthProjection = Math.round(dailyAvgThisMonth * totalDaysInMonth);

  return {
    yesterday: {
      revenue: yesterdayRev,
      expense: yesterdayExp,
      profit: yesterdayRev - yesterdayExp,
    },
    dayBeforeYesterday: {
      revenue: dayBeforeRev,
      expense: dayBeforeExp,
      profit: dayBeforeRev - dayBeforeExp,
    },
    dayChange: pctChange(yesterdayRev, dayBeforeRev),

    thisWeek: {
      revenue: thisWeekRev,
      expense: thisWeekExp,
      profit: thisWeekRev - thisWeekExp,
      avgDaily: thisWeekDays > 0 ? Math.round(thisWeekRev / thisWeekDays) : 0,
    },
    lastWeek: {
      revenue: lastWeekRev,
      expense: lastWeekExp,
      profit: lastWeekRev - lastWeekExp,
      avgDaily: lastWeekDays > 0 ? Math.round(lastWeekRev / lastWeekDays) : 0,
    },
    weekChange: pctChange(thisWeekRev, lastWeekRev),

    thisMonth: {
      revenue: thisMonthRev,
      expense: thisMonthExp,
      profit: thisMonthRev - thisMonthExp,
      daysElapsed,
    },
    lastMonth: {
      revenue: lastMonthRev,
      expense: lastMonthExp,
      profit: lastMonthRev - lastMonthExp,
    },
    monthChange: pctChange(thisMonthRev, lastMonthRev),
    monthProjection,

    sameDayLastMonth:
      sameDayRev > 0 ? { revenue: sameDayRev } : null,
    sameDayChange:
      sameDayRev > 0
        ? pctChange(yesterdayRev, sameDayRev)
        : null,
  };
}

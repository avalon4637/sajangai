// Daily briefing data layer
// Fetches all data needed for the dashboard briefing card in parallel
// Sources: revenues, delivery_reviews, expenses, budgets tables

import { createClient } from "@/lib/supabase/server";

export interface DailyBriefingData {
  revenue: {
    yesterday: number;
    dayBeforeYesterday: number;
    sameWeekdayLastWeek: number;
    monthTotal: number;
    monthTarget: number | null;
  };
  reviews: {
    unansweredCount: number;
    recentNegative: {
      author: string;
      content: string;
      rating: number;
    } | null;
    totalThisMonth: number;
    avgRating: number;
  };
  anomalies: AnomalyItem[];
  hasAnyData: boolean;
}

export interface AnomalyItem {
  type: "revenue_drop" | "revenue_spike" | "expense_spike";
  title: string;
  detail: string;
  severity: "warning" | "critical";
}

// Date helper: format Date to YYYY-MM-DD string in KST
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Get the same weekday from last week
function getSameWeekdayLastWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 7);
  return result;
}

/**
 * Fetch all data needed for the daily briefing card.
 * All queries run in parallel for optimal performance.
 * Gracefully returns defaults if tables have no data.
 */
export async function getDailyBriefingData(
  businessId: string
): Promise<DailyBriefingData> {
  const supabase = await createClient();

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date(now);
  dayBefore.setDate(dayBefore.getDate() - 2);
  const lastWeekSameDay = getSameWeekdayLastWeek(yesterday);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(new Date(currentYear, currentMonth, 0).getDate()).padStart(2, "0")}`;

  // 7 days ago for rolling average
  const sevenDaysAgo = new Date(yesterday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  // Previous month range for expense comparison
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
  const prevMonthEnd = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(new Date(prevYear, prevMonth, 0).getDate()).padStart(2, "0")}`;

  const yesterdayStr = toDateStr(yesterday);
  const dayBeforeStr = toDateStr(dayBefore);
  const lastWeekStr = toDateStr(lastWeekSameDay);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [
    yesterdayRevResult,
    dayBeforeRevResult,
    lastWeekRevResult,
    monthRevResult,
    budgetResult,
    unansweredResult,
    negativeReviewResult,
    monthReviewResult,
    last7DaysRevResult,
    currentMonthExpResult,
    prevMonthExpResult,
    hasDataResult,
  ] = await Promise.all([
    // Yesterday revenue
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .eq("date", yesterdayStr)
      .then((r: { data: { amount: number }[] | null }) =>
        (r.data ?? []).reduce((sum: number, row: { amount: number }) => sum + Number(row.amount), 0)
      ),

    // Day before yesterday revenue
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .eq("date", dayBeforeStr)
      .then((r: { data: { amount: number }[] | null }) =>
        (r.data ?? []).reduce((sum: number, row: { amount: number }) => sum + Number(row.amount), 0)
      ),

    // Same weekday last week revenue
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .eq("date", lastWeekStr)
      .then((r: { data: { amount: number }[] | null }) =>
        (r.data ?? []).reduce((sum: number, row: { amount: number }) => sum + Number(row.amount), 0)
      ),

    // Current month total revenue
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .then((r: { data: { amount: number }[] | null }) =>
        (r.data ?? []).reduce((sum: number, row: { amount: number }) => sum + Number(row.amount), 0)
      ),

    // Budget target for current month (category='매출')
    sb
      .from("budgets")
      .select("target_amount")
      .eq("business_id", businessId)
      .eq("year", currentYear)
      .eq("month", currentMonth)
      .eq("category", "매출")
      .maybeSingle()
      .then((r: { data: { target_amount: number } | null }) =>
        r.data ? Number(r.data.target_amount) : null
      ),

    // Unanswered review count
    sb
      .from("delivery_reviews")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("reply_status", "pending")
      .then((r: { count: number | null }) => r.count ?? 0),

    // Recent negative review (rating <= 2)
    sb
      .from("delivery_reviews")
      .select("customer_name, content, rating")
      .eq("business_id", businessId)
      .lte("rating", 2)
      .order("review_date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(
        (r: {
          data: {
            customer_name: string | null;
            content: string | null;
            rating: number;
          } | null;
        }) =>
          r.data
            ? {
                author: r.data.customer_name ?? "익명",
                content: r.data.content ?? "",
                rating: r.data.rating,
              }
            : null
      ),

    // Month review stats
    sb
      .from("delivery_reviews")
      .select("rating")
      .eq("business_id", businessId)
      .gte("review_date", monthStart)
      .lte("review_date", monthEnd)
      .then((r: { data: { rating: number }[] | null }) => {
        const data = r.data ?? [];
        return {
          total: data.length,
          avg:
            data.length > 0
              ? data.reduce((sum: number, row: { rating: number }) => sum + row.rating, 0) /
                data.length
              : 0,
        };
      }),

    // Last 7 days revenue for anomaly detection
    sb
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", toDateStr(sevenDaysAgo))
      .lte("date", yesterdayStr)
      .then((r: { data: { amount: number }[] | null }) => {
        const amounts = (r.data ?? []).map((row: { amount: number }) => Number(row.amount));
        const total = amounts.reduce((s: number, v: number) => s + v, 0);
        return { total, count: amounts.length };
      }),

    // Current month expense total
    sb
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .then((r: { data: { amount: number }[] | null }) =>
        (r.data ?? []).reduce((sum: number, row: { amount: number }) => sum + Number(row.amount), 0)
      ),

    // Previous month expense total
    sb
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", prevMonthStart)
      .lte("date", prevMonthEnd)
      .then((r: { data: { amount: number }[] | null }) =>
        (r.data ?? []).reduce((sum: number, row: { amount: number }) => sum + Number(row.amount), 0)
      ),

    // Check if business has any revenue data at all
    sb
      .from("revenues")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .then((r: { count: number | null }) => (r.count ?? 0) > 0),
  ]);

  // Anomaly detection
  const anomalies: AnomalyItem[] = [];

  // Revenue drop: yesterday < 7-day avg * 0.7
  if (last7DaysRevResult.count > 0 && yesterdayRevResult > 0) {
    const avg7Day = last7DaysRevResult.total / last7DaysRevResult.count;
    if (avg7Day > 0 && yesterdayRevResult < avg7Day * 0.7) {
      const dropPct = Math.round((1 - yesterdayRevResult / avg7Day) * 100);
      anomalies.push({
        type: "revenue_drop",
        title: "어제 매출 급감",
        detail: `7일 평균 대비 ${dropPct}% 하락`,
        severity: dropPct > 50 ? "critical" : "warning",
      });
    }
  }

  // Revenue spike: yesterday > 7-day avg * 1.5
  if (last7DaysRevResult.count > 0 && yesterdayRevResult > 0) {
    const avg7Day = last7DaysRevResult.total / last7DaysRevResult.count;
    if (avg7Day > 0 && yesterdayRevResult > avg7Day * 1.5) {
      const spikePct = Math.round((yesterdayRevResult / avg7Day - 1) * 100);
      anomalies.push({
        type: "revenue_spike",
        title: "어제 매출 급증",
        detail: `7일 평균 대비 +${spikePct}% 상승`,
        severity: "warning",
      });
    }
  }

  // Expense spike: current month > previous month * 1.5
  if (prevMonthExpResult > 0 && currentMonthExpResult > prevMonthExpResult * 1.5) {
    const expPct = Math.round((currentMonthExpResult / prevMonthExpResult - 1) * 100);
    anomalies.push({
      type: "expense_spike",
      title: "이번 달 비용 급증",
      detail: `전월 대비 +${expPct}% 증가`,
      severity: expPct > 100 ? "critical" : "warning",
    });
  }

  return {
    revenue: {
      yesterday: yesterdayRevResult,
      dayBeforeYesterday: dayBeforeRevResult,
      sameWeekdayLastWeek: lastWeekRevResult,
      monthTotal: monthRevResult,
      monthTarget: budgetResult,
    },
    reviews: {
      unansweredCount: unansweredResult,
      recentNegative: negativeReviewResult,
      totalThisMonth: monthReviewResult.total,
      avgRating: monthReviewResult.avg,
    },
    anomalies,
    hasAnyData: hasDataResult,
  };
}

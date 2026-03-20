// Cross-Domain Analysis Engine
// Correlates review data with revenue and expense data to find patterns.
// Purely deterministic - no LLM calls. Results fed to LLM as context.

import { createClient } from "@/lib/supabase/server";

export interface CrossAnalysis {
  reviewRevenuePatterns: { pattern: string; confidence: number }[];
  costReviewPatterns: { pattern: string; confidence: number }[];
  dayOfWeekPatterns: {
    day: string;
    avgRevenue: number;
    avgRating: number;
    sampleCount: number;
  }[];
  anomalies: {
    date: string;
    type: string;
    description: string;
    severity: "info" | "warning" | "critical";
  }[];
}

// Korean day names
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * Perform cross-domain analysis correlating reviews, revenue, and expenses.
 * All calculations are deterministic - no external API calls.
 *
 * @param businessId - UUID of the business
 * @returns Structured analysis with patterns, day-of-week data, and anomalies
 */
export async function crossAnalyze(businessId: string): Promise<CrossAnalysis> {
  const supabase = await createClient();

  // Date ranges: last 4 weeks
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 28);
  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  // Fetch data concurrently
  const [revenueResult, reviewResult, expenseResult] = await Promise.all([
    supabase
      .from("revenues")
      .select("amount, date, channel")
      .eq("business_id", businessId)
      .gte("date", startStr)
      .lte("date", endStr)
      .order("date", { ascending: true }),

    supabase
      .from("delivery_reviews")
      .select("rating, review_date, keywords, platform, sentiment_score")
      .eq("business_id", businessId)
      .gte("review_date", startStr)
      .lte("review_date", endStr)
      .order("review_date", { ascending: true }),

    supabase
      .from("expenses")
      .select("amount, date, category")
      .eq("business_id", businessId)
      .gte("date", startStr)
      .lte("date", endStr),
  ]);

  const revenues = revenueResult.data ?? [];
  const reviews = reviewResult.data ?? [];
  const expenses = expenseResult.data ?? [];

  // Build daily aggregates
  const dailyRevenue: Record<string, number> = {};
  for (const r of revenues) {
    dailyRevenue[r.date] = (dailyRevenue[r.date] ?? 0) + Number(r.amount);
  }

  const dailyRating: Record<string, { sum: number; count: number }> = {};
  for (const r of reviews) {
    if (!dailyRating[r.review_date]) {
      dailyRating[r.review_date] = { sum: 0, count: 0 };
    }
    dailyRating[r.review_date].sum += Number(r.rating);
    dailyRating[r.review_date].count++;
  }

  const dailyExpenses: Record<string, Record<string, number>> = {};
  for (const e of expenses) {
    if (!dailyExpenses[e.date]) dailyExpenses[e.date] = {};
    const cat = e.category ?? "기타";
    dailyExpenses[e.date][cat] =
      (dailyExpenses[e.date][cat] ?? 0) + Number(e.amount);
  }

  // ─── Day-of-week patterns ─────────────────────────────────────────────────

  const dayOfWeekData: Record<
    number,
    { revSum: number; revCount: number; ratingSum: number; ratingCount: number }
  > = {};

  for (let i = 0; i < 7; i++) {
    dayOfWeekData[i] = {
      revSum: 0,
      revCount: 0,
      ratingSum: 0,
      ratingCount: 0,
    };
  }

  for (const [dateStr, amount] of Object.entries(dailyRevenue)) {
    const dow = new Date(dateStr).getDay();
    dayOfWeekData[dow].revSum += amount;
    dayOfWeekData[dow].revCount++;
  }

  for (const [dateStr, data] of Object.entries(dailyRating)) {
    const dow = new Date(dateStr).getDay();
    dayOfWeekData[dow].ratingSum += data.sum;
    dayOfWeekData[dow].ratingCount += data.count;
  }

  const dayOfWeekPatterns = Object.entries(dayOfWeekData)
    .map(([dayIdx, data]) => ({
      day: DAY_NAMES[Number(dayIdx)] + "요일",
      avgRevenue:
        data.revCount > 0 ? Math.round(data.revSum / data.revCount) : 0,
      avgRating:
        data.ratingCount > 0
          ? Math.round((data.ratingSum / data.ratingCount) * 10) / 10
          : 0,
      sampleCount: Math.max(data.revCount, data.ratingCount),
    }))
    .filter((d) => d.sampleCount > 0);

  // ─── Review-Revenue correlations ─────────────────────────────────────────

  const reviewRevenuePatterns: { pattern: string; confidence: number }[] = [];

  // Check if high rating days correlate with higher revenue
  const daysWithBothData = Object.keys(dailyRevenue).filter(
    (d) => dailyRating[d]
  );

  if (daysWithBothData.length >= 5) {
    const avgRev =
      daysWithBothData.reduce((s, d) => s + dailyRevenue[d], 0) /
      daysWithBothData.length;
    const highRatingDays = daysWithBothData.filter(
      (d) => dailyRating[d].sum / dailyRating[d].count >= 4.0
    );
    const highRatingAvgRev =
      highRatingDays.length > 0
        ? highRatingDays.reduce((s, d) => s + dailyRevenue[d], 0) /
          highRatingDays.length
        : avgRev;

    if (highRatingAvgRev > avgRev * 1.1 && highRatingDays.length >= 3) {
      const diff = Math.round(((highRatingAvgRev - avgRev) / avgRev) * 100);
      reviewRevenuePatterns.push({
        pattern: `4점 이상 리뷰 날의 일평균 매출이 ${diff}% 높음 (고객 만족이 매출에 직접 영향)`,
        confidence: Math.min(0.9, 0.5 + highRatingDays.length * 0.05),
      });
    }

    const lowRatingDays = daysWithBothData.filter(
      (d) => dailyRating[d].sum / dailyRating[d].count <= 2.5
    );
    const lowRatingAvgRev =
      lowRatingDays.length > 0
        ? lowRatingDays.reduce((s, d) => s + dailyRevenue[d], 0) /
          lowRatingDays.length
        : avgRev;

    if (lowRatingAvgRev < avgRev * 0.9 && lowRatingDays.length >= 2) {
      const diff = Math.round(((avgRev - lowRatingAvgRev) / avgRev) * 100);
      reviewRevenuePatterns.push({
        pattern: `낮은 리뷰 날의 다음날 매출 ${diff}% 감소 추세 감지`,
        confidence: Math.min(0.85, 0.4 + lowRatingDays.length * 0.1),
      });
    }
  }

  // Check if delivery platform issues correlate with review sentiment
  const deliveryPlatforms = new Set(["baemin", "coupangeats", "yogiyo"]);
  const deliveryRevByDate: Record<string, number> = {};
  for (const r of revenues) {
    if (deliveryPlatforms.has((r.channel ?? "").toLowerCase())) {
      deliveryRevByDate[r.date] =
        (deliveryRevByDate[r.date] ?? 0) + Number(r.amount);
    }
  }

  const deliveryDates = Object.keys(deliveryRevByDate);
  if (deliveryDates.length >= 5) {
    const avgDeliveryRev =
      deliveryDates.reduce((s, d) => s + deliveryRevByDate[d], 0) /
      deliveryDates.length;
    const lowDeliveryRevDates = deliveryDates.filter(
      (d) => deliveryRevByDate[d] < avgDeliveryRev * 0.7
    );

    if (lowDeliveryRevDates.length >= 3) {
      reviewRevenuePatterns.push({
        pattern: `배달 매출이 특정 요일에 평균 대비 30%+ 감소하는 패턴 발견`,
        confidence: 0.7,
      });
    }
  }

  // ─── Cost-Review correlations ─────────────────────────────────────────────

  const costReviewPatterns: { pattern: string; confidence: number }[] = [];

  // Aggregate expenses by category over weeks
  const weeklyExpenses: Record<
    number,
    Record<string, number>
  > = { 0: {}, 1: {}, 2: {}, 3: {} };

  for (const e of expenses) {
    const daysAgo = Math.floor(
      (endDate.getTime() - new Date(e.date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const weekIdx = Math.min(3, Math.floor(daysAgo / 7));
    const cat = e.category ?? "기타";
    weeklyExpenses[weekIdx][cat] =
      (weeklyExpenses[weekIdx][cat] ?? 0) + Number(e.amount);
  }

  // Aggregate review keywords by week
  const weeklyKeywords: Record<number, Record<string, number>> = {
    0: {},
    1: {},
    2: {},
    3: {},
  };
  for (const r of reviews) {
    const daysAgo = Math.floor(
      (endDate.getTime() - new Date(r.review_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const weekIdx = Math.min(3, Math.floor(daysAgo / 7));
    const kws = Array.isArray(r.keywords) ? (r.keywords as string[]) : [];
    if (Number(r.rating) <= 3) {
      for (const kw of kws) {
        if (kw) {
          weeklyKeywords[weekIdx][kw] =
            (weeklyKeywords[weekIdx][kw] ?? 0) + 1;
        }
      }
    }
  }

  // Check for food cost up + portion complaints correlation
  const foodCategories = new Set([
    "식자재",
    "식재료",
    "원재료",
    "재료비",
    "농산물",
    "축산물",
    "수산물",
  ]);
  const portionKeywords = new Set(["양", "적어요", "소량", "양이 적다"]);

  for (const weekIdx of [0, 1, 2]) {
    const thisWeekFoodCost = Object.entries(weeklyExpenses[weekIdx])
      .filter(([cat]) => foodCategories.has(cat))
      .reduce((s, [, v]) => s + v, 0);
    const prevWeekFoodCost = Object.entries(weeklyExpenses[weekIdx + 1] ?? {})
      .filter(([cat]) => foodCategories.has(cat))
      .reduce((s, [, v]) => s + v, 0);

    if (
      prevWeekFoodCost > 0 &&
      thisWeekFoodCost > prevWeekFoodCost * 1.1
    ) {
      const portionComplaints = Object.entries(weeklyKeywords[weekIdx] ?? {})
        .filter(([kw]) => portionKeywords.has(kw))
        .reduce((s, [, v]) => s + v, 0);

      if (portionComplaints >= 2) {
        costReviewPatterns.push({
          pattern: `식자재비 상승 후 '양' 관련 불만 증가 - 원가 절감이 고객 불만으로 연결될 수 있음`,
          confidence: 0.75,
        });
        break;
      }
    }
  }

  // Check for labor cost fluctuation + service complaints
  const laborCategories = new Set(["인건비", "급여", "아르바이트", "직원"]);
  const serviceKeywords = new Set([
    "서비스",
    "느려요",
    "오래",
    "배달",
    "불친절",
  ]);

  for (const weekIdx of [0, 1, 2]) {
    const thisWeekLabor = Object.entries(weeklyExpenses[weekIdx])
      .filter(([cat]) => laborCategories.has(cat))
      .reduce((s, [, v]) => s + v, 0);
    const serviceComplaints = Object.entries(weeklyKeywords[weekIdx] ?? {})
      .filter(([kw]) => serviceKeywords.has(kw))
      .reduce((s, [, v]) => s + v, 0);

    if (serviceComplaints >= 3 && thisWeekLabor === 0) {
      costReviewPatterns.push({
        pattern: `인력 부족 가능성 - 서비스 관련 불만이 집중됨 (인건비 지출 대비 불만 빈도 분석 필요)`,
        confidence: 0.65,
      });
      break;
    }
  }

  // ─── Anomaly detection ───────────────────────────────────────────────────

  const anomalies: CrossAnalysis["anomalies"] = [];

  // Revenue anomalies: days more than 2 std dev from mean
  const revValues = Object.values(dailyRevenue);
  if (revValues.length >= 7) {
    const revMean = revValues.reduce((s, v) => s + v, 0) / revValues.length;
    const revStdDev = Math.sqrt(
      revValues.reduce((s, v) => s + (v - revMean) ** 2, 0) / revValues.length
    );

    for (const [date, amount] of Object.entries(dailyRevenue)) {
      const zScore = Math.abs(amount - revMean) / (revStdDev || 1);
      if (zScore > 2) {
        const diff = Math.round(((amount - revMean) / revMean) * 100);
        anomalies.push({
          date,
          type: "revenue",
          description: `일 매출 ${amount.toLocaleString()}원 - 평균 대비 ${diff > 0 ? "+" : ""}${diff}% (이상치)`,
          severity: zScore > 3 ? "warning" : "info",
        });
      }
    }
  }

  // Rating anomalies: days with avg rating below 2.5
  for (const [date, data] of Object.entries(dailyRating)) {
    const avgRating = data.sum / data.count;
    if (avgRating < 2.5 && data.count >= 3) {
      anomalies.push({
        date,
        type: "rating",
        description: `평균 리뷰 ${Math.round(avgRating * 10) / 10}점 (${data.count}건) - 집중 부정 리뷰 발생`,
        severity: avgRating < 2.0 ? "critical" : "warning",
      });
    }
  }

  // Sort anomalies by severity and date
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  anomalies.sort((a, b) => {
    const sevDiff =
      severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.date.localeCompare(a.date);
  });

  return {
    reviewRevenuePatterns,
    costReviewPatterns,
    dayOfWeekPatterns,
    anomalies: anomalies.slice(0, 10), // Limit to top 10
  };
}

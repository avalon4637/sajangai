// A1: Revenue drop + negative review correlation
// Trigger: weekly revenue -15%+ AND negative reviews increased

import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const a1RevenueReview: InsightScenario = {
  id: "A1",
  name: "매출 급락 + 리뷰 연관",
  category: "revenue",

  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    // Need at least 2 weeks of data
    if (ctx.revenues.length < 7) return null;

    // Split into this week vs previous weeks
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 86_400_000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000);

    const thisWeek = ctx.revenues.filter(
      (r) => new Date(r.date) >= oneWeekAgo
    );
    const prevWeeks = ctx.revenues.filter(
      (r) => new Date(r.date) >= twoWeeksAgo && new Date(r.date) < oneWeekAgo
    );

    if (thisWeek.length === 0 || prevWeeks.length === 0) return null;

    const thisWeekAvg = sum(thisWeek.map((r) => r.amount)) / thisWeek.length;
    const prevWeekAvg = sum(prevWeeks.map((r) => r.amount)) / prevWeeks.length;

    if (prevWeekAvg === 0) return null;

    const revenueDelta = ((thisWeekAvg - prevWeekAvg) / prevWeekAvg) * 100;

    // Check: revenue drop >= 15%
    if (revenueDelta > -15) return null;

    // Check: negative review increase
    const recentReviews = ctx.reviews.filter(
      (r) => new Date(r.date) >= oneWeekAgo
    );
    const prevReviews = ctx.reviews.filter(
      (r) => new Date(r.date) >= twoWeeksAgo && new Date(r.date) < oneWeekAgo
    );

    const recentNeg = recentReviews.filter((r) => r.rating <= 3).length;
    const prevNeg = prevReviews.filter((r) => r.rating <= 3).length;

    const hasReviewCorrelation = recentNeg > prevNeg && recentNeg >= 2;

    if (!hasReviewCorrelation) return null;

    // Count unreplied reviews
    const unreplied = recentReviews.filter(
      (r) => r.replyStatus === "none" || r.replyStatus === "draft"
    ).length;

    const avgRatingRecent =
      recentReviews.length > 0
        ? recentReviews.reduce((s, r) => s + r.rating, 0) /
          recentReviews.length
        : 0;
    const avgRatingPrev =
      prevReviews.length > 0
        ? prevReviews.reduce((s, r) => s + r.rating, 0) / prevReviews.length
        : 0;

    return {
      scenarioId: "A1",
      category: "revenue",
      severity: revenueDelta <= -25 ? "critical" : "warning",
      detection: {
        title: `매출이 전주 대비 ${Math.abs(Math.round(revenueDelta))}% 하락했어요`,
        metric: `${Math.round(revenueDelta)}%`,
        comparedTo: "전주 평균",
      },
      cause: {
        summary: `부정 리뷰 ${recentNeg - prevNeg}건 증가와 동시에 매출 하락 발생`,
        signals: [
          `리뷰 평점 ${avgRatingPrev.toFixed(1)}→${avgRatingRecent.toFixed(1)}`,
          `부정 리뷰 ${prevNeg}건→${recentNeg}건`,
          unreplied > 0 ? `미답변 리뷰 ${unreplied}건` : "",
        ].filter(Boolean),
        confidence: 0.7,
      },
      solution: {
        recommendation:
          unreplied > 0
            ? `미답변 리뷰 ${unreplied}건에 답글을 등록하세요`
            : "부정 리뷰에 진심 어린 답글로 고객 신뢰를 회복하세요",
        expectedEffect: "평점 회복 시 주문 약 10~15% 증가 예상",
        estimatedValue: Math.round(Math.abs(revenueDelta) * prevWeekAvg * 0.01),
      },
      action: unreplied > 0
        ? {
            type: "reply_reviews",
            label: "답글 등록하기",
            payload: { unrepliedCount: unreplied },
          }
        : {
            type: "view_detail",
            label: "리뷰 상세 보기",
            payload: {},
          },
    };
  },
};

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

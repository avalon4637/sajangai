// C1: Repeated negative keywords in reviews
// Trigger: same keyword appears 3+ times in 2 weeks
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const c1RepeatKeywords: InsightScenario = {
  id: "C1",
  name: "반복 부정 키워드",
  category: "review",
  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    const negReviews = ctx.reviews.filter((r) => r.rating <= 3);
    if (negReviews.length < 3) return null;

    // Count keyword frequency
    const keywordCount: Record<string, number> = {};
    for (const r of negReviews) {
      for (const kw of r.keywords) {
        const normalized = kw.trim().toLowerCase();
        if (normalized.length < 2) continue;
        keywordCount[normalized] = (keywordCount[normalized] ?? 0) + 1;
      }
    }

    // Find keywords with 3+ occurrences
    const repeated = Object.entries(keywordCount)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a);

    if (repeated.length === 0) return null;

    const topKeyword = repeated[0][0];
    const topCount = repeated[0][1];

    return {
      scenarioId: "C1",
      category: "review",
      severity: topCount >= 5 ? "warning" : "info",
      detection: {
        title: `"${topKeyword}" 불만이 ${topCount}회 반복되고 있어요`,
        metric: `${topCount}회`,
        comparedTo: "최근 4주 부정 리뷰",
      },
      cause: {
        summary: `고객들이 "${topKeyword}"에 대해 반복적으로 불만을 제기`,
        signals: repeated.slice(0, 3).map(([kw, c]) => `"${kw}": ${c}회`),
        confidence: 0.75,
      },
      solution: {
        recommendation: `"${topKeyword}" 관련 운영을 개선하고 사과 답글을 등록하세요`,
        expectedEffect: "개선 후 해당 키워드 불만 감소 예상",
      },
      action: { type: "reply_reviews", label: "답글 등록하기", payload: { keyword: topKeyword } },
    };
  },
};

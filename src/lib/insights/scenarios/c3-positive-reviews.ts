// C3: Leverage positive reviews for marketing
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const c3PositiveReviews: InsightScenario = {
  id: "C3", name: "긍정 리뷰 활용", category: "review",
  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    const recent = ctx.reviews.filter((r) => {
      const d = new Date(r.date);
      return d.getTime() > Date.now() - 7 * 86_400_000;
    });
    const fiveStars = recent.filter((r) => r.rating >= 5);
    if (fiveStars.length < 5) return null;

    const keywords = fiveStars.flatMap((r) => r.keywords).filter(Boolean);
    const topKeyword = mostFrequent(keywords) ?? "맛";

    return {
      scenarioId: "C3", category: "review", severity: "opportunity",
      detection: {
        title: `이번 주 5점 리뷰가 ${fiveStars.length}건이에요!`,
        metric: `${fiveStars.length}건`,
        comparedTo: "이번 주",
      },
      cause: {
        summary: `"${topKeyword}" 등 호평 키워드가 반복됨`,
        signals: [`5점 리뷰 ${fiveStars.length}건`, `인기 키워드: "${topKeyword}"`],
        confidence: 0.8,
      },
      solution: {
        recommendation: "긍정 리뷰를 SNS나 매장 소개에 활용해보세요",
        expectedEffect: "긍정 리뷰 활용 시 신규 고객 유입 증가",
      },
      action: { type: "view_detail", label: "리뷰 카드 만들기", payload: {} },
    };
  },
};

function mostFrequent(arr: string[]): string | null {
  const freq: Record<string, number> = {};
  for (const s of arr) { const k = s.toLowerCase(); freq[k] = (freq[k] ?? 0) + 1; }
  const sorted = Object.entries(freq).sort(([, a], [, b]) => b - a);
  return sorted[0]?.[0] ?? null;
}

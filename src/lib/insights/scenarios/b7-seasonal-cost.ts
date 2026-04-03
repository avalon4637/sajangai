// B7: Seasonal cost spike warning (utility bills)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const b7SeasonalCost: InsightScenario = {
  id: "B7",
  name: "계절 비용 경고",
  category: "cost",
  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    if (ctx.fixedCosts.length < 4) return null;

    const utilityCats = ["전기", "가스", "수도", "냉난방"];
    const utilities = ctx.fixedCosts.filter((f) =>
      utilityCats.some((u) => f.category.includes(u))
    );

    if (utilities.length < 2) return null;

    const months = [...new Set(utilities.map((u) => u.month))].sort((a, b) => b.localeCompare(a));
    if (months.length < 2) return null;

    const current = utilities.filter((u) => u.month === months[0]).reduce((s, u) => s + u.amount, 0);
    const previous = utilities.filter((u) => u.month === months[1]).reduce((s, u) => s + u.amount, 0);

    if (previous === 0) return null;
    const delta = ((current - previous) / previous) * 100;

    if (delta < 15) return null;

    return {
      scenarioId: "B7",
      category: "cost",
      severity: "info",
      detection: {
        title: `공과금이 전월 대비 ${Math.round(delta)}% 올랐어요`,
        metric: `+${Math.round(delta)}%`,
        comparedTo: "전월",
      },
      cause: {
        summary: "계절 변화에 따른 냉난방비 증가 가능성",
        signals: [`공과금 ${fmt(previous)} → ${fmt(current)}`],
        confidence: 0.6,
      },
      solution: {
        recommendation: "가격에 계절 비용을 반영하거나 에너지 절감을 검토하세요",
        expectedEffect: "가격 반영 시 수익성 유지",
        estimatedValue: current - previous,
      },
      action: { type: "run_simulation", label: "시뮬레이션 보기", payload: {} },
    };
  },
};

function fmt(n: number): string {
  return n >= 10000 ? `${Math.round(n / 10000)}만원` : `${Math.round(n / 1000)}천원`;
}

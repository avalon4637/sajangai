// B3: Labor cost ratio warning
// Trigger: labor costs > 30% of revenue
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const b3LaborRatio: InsightScenario = {
  id: "B3",
  name: "인건비 비율 경고",
  category: "cost",
  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    if (ctx.revenues.length < 7 || ctx.fixedCosts.length === 0) return null;

    const totalRevenue = ctx.revenues.reduce((s, r) => s + r.amount, 0);
    const laborCosts = ctx.fixedCosts
      .filter((f) => f.category.includes("인건") || f.category.includes("급여"))
      .reduce((s, f) => s + f.amount, 0);

    if (totalRevenue === 0 || laborCosts === 0) return null;

    const ratio = (laborCosts / totalRevenue) * 100;
    if (ratio < 30) return null;

    return {
      scenarioId: "B3",
      category: "cost",
      severity: ratio >= 40 ? "warning" : "info",
      detection: {
        title: `인건비가 매출의 ${Math.round(ratio)}%를 차지해요`,
        metric: `${Math.round(ratio)}%`,
        comparedTo: "업종 평균 25~30%",
      },
      cause: {
        summary: `인건비 ${fmt(laborCosts)} / 매출 ${fmt(totalRevenue)}`,
        signals: [`인건비 비율 ${ratio.toFixed(1)}%`, "업종 평균 대비 높은 수준"],
        confidence: 0.8,
      },
      solution: {
        recommendation: "시간대별 매출 대비 인력 배치를 점검하세요",
        expectedEffect: "5%p 개선 시 월 " + fmt(totalRevenue * 0.05) + " 절감",
        estimatedValue: Math.round(totalRevenue * 0.05),
      },
      action: { type: "run_simulation", label: "시뮬레이션 보기", payload: {} },
    };
  },
};

function fmt(n: number): string {
  return n >= 10000 ? `${Math.round(n / 10000)}만원` : `${Math.round(n / 1000)}천원`;
}

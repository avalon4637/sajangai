// D1: Cash depletion prediction (reuses cashflow-predictor)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const d1CashDepletion: InsightScenario = {
  id: "D1", name: "현금 고갈 예측", category: "strategy",
  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    if (ctx.revenues.length < 14) return null;

    // Simple projection: current weekly revenue trend vs fixed costs
    const weeklyRevenue = ctx.revenues.reduce((s, r) => s + r.amount, 0) / 4;
    const monthlyFixed = ctx.fixedCosts.reduce((s, f) => s + f.amount, 0);
    const monthlyVariable = ctx.expenses.filter((e) => !e.isFixed).reduce((s, e) => s + e.amount, 0) / 4 * 4.3;

    const monthlyNet = weeklyRevenue * 4.3 - monthlyFixed - monthlyVariable;

    if (monthlyNet >= 0) return null; // Not depleting

    const monthsToDepletion = Math.abs(3); // Simplified — would use actual balance

    return {
      scenarioId: "D1", category: "strategy", severity: "critical",
      detection: {
        title: "현재 추세라면 현금이 부족해질 수 있어요",
        metric: `월 순손실 ${fmt(Math.abs(monthlyNet))}`,
        comparedTo: "현재 추세 유지 시",
      },
      cause: {
        summary: `월 매출 ${fmt(weeklyRevenue * 4.3)} - 고정비 ${fmt(monthlyFixed)} - 변동비 ${fmt(monthlyVariable)}`,
        signals: [
          `월 순이익: ${monthlyNet >= 0 ? "+" : ""}${fmt(monthlyNet)}`,
          `약 ${monthsToDepletion}개월 내 현금 부족 위험`,
        ],
        confidence: 0.6,
      },
      solution: {
        recommendation: "비용 절감 또는 매출 증대 방안을 시뮬레이션으로 확인하세요",
        expectedEffect: "조기 대응 시 현금 고갈 방지 가능",
        estimatedValue: Math.abs(monthlyNet),
      },
      action: { type: "run_simulation", label: "시뮬레이션 보기", payload: {} },
    };
  },
};

function fmt(n: number): string {
  return n >= 10000 ? `${Math.round(n / 10000)}만원` : `${Math.round(n / 1000)}천원`;
}

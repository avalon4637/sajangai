// B4: Variable cost ratio increase
// Trigger: variable cost ratio up 5%p vs previous period
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const b4CostRatio: InsightScenario = {
  id: "B4",
  name: "원가율 상승",
  category: "cost",
  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    if (ctx.revenues.length < 14 || ctx.expenses.length < 7) return null;

    const now = new Date();
    const oneWeek = new Date(now.getTime() - 7 * 86_400_000);
    const twoWeeks = new Date(now.getTime() - 14 * 86_400_000);

    const recentRev = ctx.revenues.filter((r) => new Date(r.date) >= oneWeek).reduce((s, r) => s + r.amount, 0);
    const prevRev = ctx.revenues.filter((r) => new Date(r.date) >= twoWeeks && new Date(r.date) < oneWeek).reduce((s, r) => s + r.amount, 0);

    const recentVar = ctx.expenses.filter((e) => !e.isFixed && new Date(e.date) >= oneWeek).reduce((s, e) => s + e.amount, 0);
    const prevVar = ctx.expenses.filter((e) => !e.isFixed && new Date(e.date) >= twoWeeks && new Date(e.date) < oneWeek).reduce((s, e) => s + e.amount, 0);

    if (recentRev === 0 || prevRev === 0) return null;

    const recentRatio = (recentVar / recentRev) * 100;
    const prevRatio = (prevVar / prevRev) * 100;
    const diff = recentRatio - prevRatio;

    if (diff < 5) return null;

    return {
      scenarioId: "B4",
      category: "cost",
      severity: diff >= 10 ? "warning" : "info",
      detection: {
        title: `원가율이 전주 대비 ${diff.toFixed(1)}%p 올랐어요`,
        metric: `+${diff.toFixed(1)}%p`,
        comparedTo: "전주",
      },
      cause: {
        summary: `원가율 ${prevRatio.toFixed(1)}% → ${recentRatio.toFixed(1)}%`,
        signals: [`변동비 증가 또는 매출 감소 영향`],
        confidence: 0.7,
      },
      solution: {
        recommendation: "식재료 단가 변동을 확인하고 가격 조정을 검토하세요",
        expectedEffect: "원가율 정상화 시 수익성 개선",
      },
      action: { type: "view_detail", label: "비용 분석 보기", payload: {} },
    };
  },
};

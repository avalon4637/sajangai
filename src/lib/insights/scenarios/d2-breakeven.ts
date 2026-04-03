// D2: Real-time break-even tracking
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const d2Breakeven: InsightScenario = {
  id: "D2", name: "손익분기 실시간", category: "strategy",
  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    if (ctx.revenues.length < 7) return null;

    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // This month's revenue so far
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthRevenues = ctx.revenues.filter((r) => r.date.startsWith(thisMonth));
    const totalSoFar = monthRevenues.reduce((s, r) => s + r.amount, 0);

    // Monthly costs (fixed + estimated variable)
    const monthlyFixed = ctx.fixedCosts.reduce((s, f) => s + f.amount, 0);
    const avgDailyVariable = ctx.expenses
      .filter((e) => !e.isFixed)
      .reduce((s, e) => s + e.amount, 0) / Math.max(ctx.expenses.length, 1);
    const projectedVariable = avgDailyVariable * daysInMonth;
    const breakeven = monthlyFixed + projectedVariable;

    if (breakeven === 0) return null;

    const achievementRate = (totalSoFar / breakeven) * 100;
    const expectedRate = (dayOfMonth / daysInMonth) * 100;
    const daysLeft = daysInMonth - dayOfMonth;
    const remainingNeeded = breakeven - totalSoFar;
    const dailyNeeded = daysLeft > 0 ? remainingNeeded / daysLeft : 0;

    // Only alert if behind schedule
    if (achievementRate >= expectedRate - 5) return null;

    return {
      scenarioId: "D2", category: "strategy",
      severity: achievementRate < expectedRate - 15 ? "warning" : "info",
      detection: {
        title: `손익분기 달성률 ${Math.round(achievementRate)}% (목표 ${Math.round(expectedRate)}%)`,
        metric: `${Math.round(achievementRate)}%`,
        comparedTo: `일정 대비 (${dayOfMonth}/${daysInMonth}일)`,
      },
      cause: {
        summary: `이번 달 매출 ${fmt(totalSoFar)} / 손익분기 ${fmt(breakeven)}`,
        signals: [
          `남은 ${daysLeft}일간 하루 ${fmt(dailyNeeded)} 필요`,
          `고정비 ${fmt(monthlyFixed)} + 변동비 ${fmt(projectedVariable)}`,
        ],
        confidence: 0.7,
      },
      solution: {
        recommendation: "매출 부스트 또는 변동비 절감으로 손익분기를 맞추세요",
        expectedEffect: `하루 ${fmt(dailyNeeded)} 추가 매출 필요`,
        estimatedValue: remainingNeeded > 0 ? Math.round(remainingNeeded) : 0,
      },
      action: { type: "view_detail", label: "상세 보기", payload: {} },
    };
  },
};

function fmt(n: number): string {
  return n >= 10000 ? `${Math.round(n / 10000)}만원` : `${Math.round(n / 1000)}천원`;
}

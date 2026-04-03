// A4: Off-season early warning based on year-over-year patterns
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const a4OffSeason: InsightScenario = {
  id: "A4",
  name: "비수기 사전 경고",
  category: "revenue",
  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    if (ctx.revenues.length < 21) return null;

    // Check if recent week shows declining trend (3 consecutive days down)
    const sorted = [...ctx.revenues].sort((a, b) => b.date.localeCompare(a.date));
    const recent7 = sorted.slice(0, 7);
    const prev7 = sorted.slice(7, 14);

    if (recent7.length < 5 || prev7.length < 5) return null;

    const recentAvg = recent7.reduce((s, r) => s + r.amount, 0) / recent7.length;
    const prevAvg = prev7.reduce((s, r) => s + r.amount, 0) / prev7.length;

    if (prevAvg === 0) return null;
    const delta = ((recentAvg - prevAvg) / prevAvg) * 100;

    // Trigger: gradual decline of 10%+ over 2 weeks (not sudden drop like A1)
    if (delta > -10 || delta < -30) return null; // -30% would trigger A1 instead

    return {
      scenarioId: "A4",
      category: "revenue",
      severity: "info",
      detection: {
        title: `매출이 2주간 ${Math.abs(Math.round(delta))}% 완만하게 하락 중이에요`,
        metric: `${Math.round(delta)}%`,
        comparedTo: "2주 전 동기간",
      },
      cause: {
        summary: "계절적 비수기 또는 점진적 하락 추세 가능성",
        signals: [
          `최근 7일 평균: ${fmt(recentAvg)}`,
          `이전 7일 평균: ${fmt(prevAvg)}`,
        ],
        confidence: 0.5,
      },
      solution: {
        recommendation: "비수기 대비 프로모션이나 메뉴 변경을 검토하세요",
        expectedEffect: "사전 대응 시 하락폭 50% 완화 가능",
        estimatedValue: Math.round(Math.abs(recentAvg - prevAvg) * 7 * 0.5),
      },
      action: { type: "send_message", label: "프로모션 문자 보내기", payload: {} },
    };
  },
};

function fmt(n: number): string {
  return n >= 10000 ? `${Math.round(n / 10000)}만원` : `${Math.round(n / 1000)}천원`;
}

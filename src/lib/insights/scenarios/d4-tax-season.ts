// D4: Tax season preparation
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const d4TaxSeason: InsightScenario = {
  id: "D4", name: "세금 시즌 준비", category: "strategy",
  async evaluate(_ctx: ScenarioContext): Promise<InsightResult | null> {
    const now = new Date();
    const month = now.getMonth() + 1;
    // VAT filing: Jan (prev H2), Jul (prev H1). Alert 60 days before.
    // Income tax: May. Alert 60 days before = March.
    const alerts: { deadline: string; type: string }[] = [];

    if (month === 11 || month === 12) alerts.push({ deadline: "1월", type: "부가가치세 (하반기)" });
    if (month === 5 || month === 6) alerts.push({ deadline: "7월", type: "부가가치세 (상반기)" });
    if (month === 3 || month === 4) alerts.push({ deadline: "5월", type: "종합소득세" });

    if (alerts.length === 0) return null;
    const alert = alerts[0];

    return {
      scenarioId: "D4", category: "strategy", severity: "info",
      detection: {
        title: `${alert.type} 신고 시즌이 다가오고 있어요`,
        metric: alert.deadline,
        comparedTo: "신고 기한",
      },
      cause: {
        summary: `${alert.deadline} ${alert.type} 신고 준비가 필요한 시기`,
        signals: ["매입/매출 증빙 정리 필요", "세금계산서 누락 확인 필요"],
        confidence: 0.9,
      },
      solution: {
        recommendation: "매입 증빙을 정리하고 누락된 세금계산서가 없는지 확인하세요",
        expectedEffect: "사전 준비 시 세무사 비용 절감 + 가산세 방지",
      },
      action: { type: "view_detail", label: "누락 항목 보기", payload: {} },
    };
  },
};

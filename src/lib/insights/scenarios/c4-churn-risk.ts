// C4: Customer churn risk (uses revenue patterns as proxy)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const c4ChurnRisk: InsightScenario = {
  id: "C4", name: "단골 이탈 위험", category: "review",
  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    // Use channel activity gaps as proxy for churn
    if (ctx.revenues.length < 21) return null;
    const now = new Date();
    const twoWeeks = new Date(now.getTime() - 14 * 86_400_000);
    const fourWeeks = new Date(now.getTime() - 28 * 86_400_000);

    const channels = new Set(ctx.revenues.map((r) => r.channel));
    const inactive: string[] = [];

    for (const ch of channels) {
      const recentActivity = ctx.revenues.filter(
        (r) => r.channel === ch && new Date(r.date) >= twoWeeks
      );
      const olderActivity = ctx.revenues.filter(
        (r) => r.channel === ch && new Date(r.date) >= fourWeeks && new Date(r.date) < twoWeeks
      );
      if (olderActivity.length >= 3 && recentActivity.length === 0) {
        inactive.push(ch);
      }
    }

    if (inactive.length === 0) return null;

    return {
      scenarioId: "C4", category: "review", severity: "warning",
      detection: {
        title: `${inactive.length}개 채널에서 2주+ 활동이 없어요`,
        metric: `${inactive.length}개`,
        comparedTo: "2주 전",
      },
      cause: {
        summary: `${inactive.join(", ")} 채널에서 최근 주문이 없음`,
        signals: inactive.map((ch) => `${ch}: 2주+ 비활동`),
        confidence: 0.6,
      },
      solution: {
        recommendation: "재방문 유도 문자를 보내보세요",
        expectedEffect: "문자 발송 시 10~15% 복귀율 예상",
      },
      action: { type: "send_message", label: "문자 보내기", payload: { channels: inactive } },
    };
  },
};

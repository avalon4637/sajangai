// A2: Single channel drop while others remain stable
// Trigger: one channel -20%+, others within ±5%

import type { InsightResult, InsightScenario, ScenarioContext } from "../types";
import { formatKRW } from "@/lib/utils/format-currency";

export const a2ChannelDrop: InsightScenario = {
  id: "A2",
  name: "특정 채널만 하락",
  category: "revenue",

  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    if (ctx.revenues.length < 14) return null;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 86_400_000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000);

    // Group by channel × week
    const channels = new Set(ctx.revenues.map((r) => r.channel));
    if (channels.size < 2) return null; // Need multiple channels

    const channelDeltas: {
      channel: string;
      thisWeek: number;
      prevWeek: number;
      delta: number;
    }[] = [];

    for (const ch of channels) {
      const thisWeek = ctx.revenues
        .filter((r) => r.channel === ch && new Date(r.date) >= oneWeekAgo)
        .reduce((s, r) => s + r.amount, 0);
      const prevWeek = ctx.revenues
        .filter(
          (r) =>
            r.channel === ch &&
            new Date(r.date) >= twoWeeksAgo &&
            new Date(r.date) < oneWeekAgo
        )
        .reduce((s, r) => s + r.amount, 0);

      if (prevWeek === 0) continue;

      channelDeltas.push({
        channel: ch,
        thisWeek,
        prevWeek,
        delta: ((thisWeek - prevWeek) / prevWeek) * 100,
      });
    }

    if (channelDeltas.length < 2) return null;

    // Find the one channel that dropped 20%+ while others are stable (±5%)
    const dropped = channelDeltas.filter((c) => c.delta <= -20);
    const stable = channelDeltas.filter(
      (c) => Math.abs(c.delta) <= 10
    );

    if (dropped.length !== 1 || stable.length < 1) return null;

    const problem = dropped[0];
    const lostAmount = problem.prevWeek - problem.thisWeek;

    return {
      scenarioId: "A2",
      category: "revenue",
      severity: problem.delta <= -30 ? "critical" : "warning",
      detection: {
        title: `${problem.channel} 매출이 ${Math.abs(Math.round(problem.delta))}% 하락했어요`,
        metric: `${Math.round(problem.delta)}%`,
        comparedTo: "전주 동일 채널",
      },
      cause: {
        summary: `${problem.channel}만 급락, 다른 채널은 정상 — 채널 특이 이슈 가능성`,
        signals: channelDeltas.map(
          (c) =>
            `${c.channel}: ${c.delta >= 0 ? "+" : ""}${Math.round(c.delta)}%`
        ),
        confidence: 0.65,
      },
      solution: {
        recommendation: `${problem.channel} 평점, 노출 순위, 경쟁 매장 상황을 점검하세요`,
        expectedEffect: `정상화 시 주간 약 ${formatKRW(lostAmount)} 회복 예상`,
        estimatedValue: lostAmount,
      },
      action: {
        type: "view_detail",
        label: "채널 상세 보기",
        payload: { channel: problem.channel },
      },
    };
  },
};


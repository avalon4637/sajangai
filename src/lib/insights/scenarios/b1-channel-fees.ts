// B1: Channel fee optimization
// Trigger: effective commission rate differs by 3%+ across channels

import type { InsightResult, InsightScenario, ScenarioContext } from "../types";
import { formatKRW } from "@/lib/utils/format-currency";

// Default platform fee rates (approximate)
const DEFAULT_FEE_RATES: Record<string, number> = {
  baemin: 0.066, // 배민 중개수수료 6.6%~
  coupangeats: 0.095, // 쿠팡이츠 9.5%~
  yogiyo: 0.125, // 요기요 12.5%~
};

export const b1ChannelFees: InsightScenario = {
  id: "B1",
  name: "채널 수수료 최적화",
  category: "cost",

  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    if (ctx.revenues.length < 7) return null;

    // Group revenue by channel
    const channelRevenues: Record<string, number> = {};
    for (const r of ctx.revenues) {
      const ch = r.channel.toLowerCase();
      channelRevenues[ch] = (channelRevenues[ch] ?? 0) + r.amount;
    }

    const channels = Object.keys(channelRevenues);
    if (channels.length < 2) return null;

    // Calculate fees per channel (use actual if available, else default rates)
    const channelFees: Record<string, number> = {};
    const channelRates: Record<string, number> = {};

    for (const ch of channels) {
      const revenue = channelRevenues[ch];
      // Try to find actual fee data from revenues
      const feesForChannel = ctx.revenues
        .filter(
          (r) => r.channel.toLowerCase() === ch && r.fees !== undefined
        )
        .reduce((s, r) => s + (r.fees ?? 0), 0);

      if (feesForChannel > 0) {
        channelFees[ch] = feesForChannel;
        channelRates[ch] = feesForChannel / revenue;
      } else {
        // Use default rate
        const rate = findDefaultRate(ch);
        channelFees[ch] = revenue * rate;
        channelRates[ch] = rate;
      }
    }

    // Check if rate difference >= 3%p
    const rates = Object.values(channelRates);
    const maxRate = Math.max(...rates);
    const minRate = Math.min(...rates);
    const rateDiff = (maxRate - minRate) * 100;

    if (rateDiff < 3) return null;

    // Find highest and lowest fee channels
    const highFeeChannel = channels.reduce((a, b) =>
      channelRates[a] > channelRates[b] ? a : b
    );
    const lowFeeChannel = channels.reduce((a, b) =>
      channelRates[a] < channelRates[b] ? a : b
    );

    // Estimate monthly savings if we shift 20% from high-fee to low-fee
    const totalRevenue = Object.values(channelRevenues).reduce(
      (a, b) => a + b,
      0
    );
    const shiftAmount = channelRevenues[highFeeChannel] * 0.2;
    const monthlySavings =
      shiftAmount * (channelRates[highFeeChannel] - channelRates[lowFeeChannel]);

    return {
      scenarioId: "B1",
      category: "cost",
      severity: rateDiff >= 5 ? "warning" : "info",
      detection: {
        title: `채널별 수수료 차이가 ${rateDiff.toFixed(1)}%p에요`,
        metric: `${rateDiff.toFixed(1)}%p`,
        comparedTo: "채널 간 비교",
      },
      cause: {
        summary: `${formatChannelName(highFeeChannel)} 수수료 ${(channelRates[highFeeChannel] * 100).toFixed(1)}% vs ${formatChannelName(lowFeeChannel)} ${(channelRates[lowFeeChannel] * 100).toFixed(1)}%`,
        signals: channels.map(
          (ch) =>
            `${formatChannelName(ch)}: 매출 ${formatKRW(channelRevenues[ch])}, 수수료율 ${(channelRates[ch] * 100).toFixed(1)}%`
        ),
        confidence: 0.6,
      },
      solution: {
        recommendation: `${formatChannelName(lowFeeChannel)} 비중을 높이면 수수료를 절감할 수 있어요`,
        expectedEffect: `20% 비중 이동 시 월 약 ${formatKRW(monthlySavings * 4)} 절감 예상`,
        estimatedValue: Math.round(monthlySavings * 4),
      },
      action: {
        type: "run_simulation",
        label: "시뮬레이션 보기",
        payload: { highFeeChannel, lowFeeChannel },
      },
    };
  },
};

function findDefaultRate(channel: string): number {
  const ch = channel.toLowerCase();
  for (const [key, rate] of Object.entries(DEFAULT_FEE_RATES)) {
    if (ch.includes(key)) return rate;
  }
  return 0.1; // default 10% if unknown
}

function formatChannelName(ch: string): string {
  const names: Record<string, string> = {
    baemin: "배민",
    coupangeats: "쿠팡이츠",
    yogiyo: "요기요",
  };
  for (const [key, name] of Object.entries(names)) {
    if (ch.toLowerCase().includes(key)) return name;
  }
  return ch;
}


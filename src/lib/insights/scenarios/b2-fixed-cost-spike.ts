// B2: Fixed cost spike detection
// Trigger: any fixed cost category +10% month-over-month

import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const b2FixedCostSpike: InsightScenario = {
  id: "B2",
  name: "고정비 이상 증가",
  category: "cost",

  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    if (ctx.fixedCosts.length < 2) return null;

    // Get unique months sorted descending
    const months = [...new Set(ctx.fixedCosts.map((f) => f.month))].sort(
      (a, b) => b.localeCompare(a)
    );

    if (months.length < 2) return null;

    const currentMonth = months[0];
    const previousMonth = months[1];

    // Group by category for each month
    const current = groupByCategory(
      ctx.fixedCosts.filter((f) => f.month === currentMonth)
    );
    const previous = groupByCategory(
      ctx.fixedCosts.filter((f) => f.month === previousMonth)
    );

    // Find categories with 10%+ increase
    const spikes: {
      category: string;
      current: number;
      previous: number;
      delta: number;
    }[] = [];

    for (const [cat, amount] of Object.entries(current)) {
      const prevAmount = previous[cat] ?? 0;
      if (prevAmount === 0) continue;

      const delta = ((amount - prevAmount) / prevAmount) * 100;
      if (delta >= 10) {
        spikes.push({ category: cat, current: amount, previous: prevAmount, delta });
      }
    }

    if (spikes.length === 0) return null;

    // Use the biggest spike
    spikes.sort((a, b) => b.delta - a.delta);
    const biggest = spikes[0];
    const increase = biggest.current - biggest.previous;

    return {
      scenarioId: "B2",
      category: "cost",
      severity: biggest.delta >= 20 ? "warning" : "info",
      detection: {
        title: `${biggest.category}가 전월 대비 ${Math.round(biggest.delta)}% 올랐어요`,
        metric: `+${Math.round(biggest.delta)}%`,
        comparedTo: "전월 동일 항목",
      },
      cause: {
        summary: `${biggest.category}: ${formatKRW(biggest.previous)} → ${formatKRW(biggest.current)} (${formatKRW(increase)} 증가)`,
        signals: spikes.map(
          (s) =>
            `${s.category}: +${Math.round(s.delta)}% (${formatKRW(s.previous)}→${formatKRW(s.current)})`
        ),
        confidence: 0.85,
      },
      solution: {
        recommendation: getCategoryAdvice(biggest.category),
        expectedEffect: `원래 수준으로 돌아오면 월 ${formatKRW(increase)} 절감`,
        estimatedValue: increase,
      },
      action: {
        type: "view_detail",
        label: "비교 보기",
        payload: { category: biggest.category, currentMonth, previousMonth },
      },
    };
  },
};

function groupByCategory(
  items: { category: string; amount: number }[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    result[item.category] = (result[item.category] ?? 0) + item.amount;
  }
  return result;
}

function getCategoryAdvice(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes("임대") || cat.includes("월세"))
    return "임대료 인상 시 재계약 조건을 점검하세요";
  if (cat.includes("인건"))
    return "시간대별 매출 대비 인력 배치를 점검하세요";
  if (cat.includes("전기") || cat.includes("가스") || cat.includes("수도"))
    return "계절 요인인지 확인하고, 에너지 절감 방안을 검토하세요";
  if (cat.includes("보험"))
    return "보험 요금제 비교 후 변경을 검토하세요";
  return "해당 항목의 증가 원인을 파악하고 절감 방안을 검토하세요";
}

function formatKRW(n: number): string {
  if (n >= 10000) return `${Math.round(n / 10000)}만원`;
  return `${Math.round(n / 1000)}천원`;
}

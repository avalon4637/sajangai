// A3: Day-of-week revenue variance
// Trigger: a specific day consistently below 50% of daily average for 3+ weeks

import type { InsightResult, InsightScenario, ScenarioContext } from "../types";
import { formatKRW } from "@/lib/utils/format-currency";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export const a3DayVariance: InsightScenario = {
  id: "A3",
  name: "요일별 편차 과다",
  category: "revenue",

  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    // Need at least 3 weeks of data
    if (ctx.revenues.length < 21) return null;

    // Group revenue by day-of-week
    const dayTotals: Record<number, number[]> = {};
    for (let d = 0; d < 7; d++) dayTotals[d] = [];

    for (const r of ctx.revenues) {
      const day = new Date(r.date).getDay();
      dayTotals[day].push(r.amount);
    }

    // Calculate averages
    const dayAvgs: Record<number, number> = {};
    let totalAvg = 0;
    let totalCount = 0;

    for (let d = 0; d < 7; d++) {
      const vals = dayTotals[d];
      if (vals.length === 0) continue;
      dayAvgs[d] = vals.reduce((a, b) => a + b, 0) / vals.length;
      totalAvg += dayAvgs[d];
      totalCount++;
    }

    if (totalCount === 0) return null;
    const overallDailyAvg = totalAvg / totalCount;
    if (overallDailyAvg === 0) return null;

    // Find days that are consistently below 50% of average
    // Require at least 3 data points (3 weeks)
    let weakestDay = -1;
    let weakestRatio = 1;

    for (let d = 0; d < 7; d++) {
      const vals = dayTotals[d];
      if (vals.length < 3) continue;

      const ratio = dayAvgs[d] / overallDailyAvg;
      if (ratio < 0.5 && ratio < weakestRatio) {
        weakestDay = d;
        weakestRatio = ratio;
      }
    }

    if (weakestDay === -1) return null;

    const dayName = DAY_NAMES[weakestDay];
    const pct = Math.round(weakestRatio * 100);
    const gap = Math.round(overallDailyAvg - dayAvgs[weakestDay]);

    return {
      scenarioId: "A3",
      category: "revenue",
      severity: "opportunity",
      detection: {
        title: `매주 ${dayName}요일 매출이 평균의 ${pct}%에요`,
        metric: `${pct}%`,
        comparedTo: "일평균 매출",
      },
      cause: {
        summary: `${dayName}요일은 3주 이상 연속으로 다른 요일 대비 매출이 낮아요`,
        signals: Object.entries(dayAvgs)
          .sort(([, a], [, b]) => b - a)
          .map(
            ([d, avg]) =>
              `${DAY_NAMES[Number(d)]}요일: ${formatKRW(avg)} (${Math.round((avg / overallDailyAvg) * 100)}%)`
          ),
        confidence: 0.8,
      },
      solution: {
        recommendation: `${dayName}요일 타겟 프로모션으로 매출 갭을 줄여보세요`,
        expectedEffect: `${dayName}요일 매출이 평균 수준으로 오르면 주간 약 ${formatKRW(gap)} 추가`,
        estimatedValue: gap,
      },
      action: {
        type: "send_message",
        label: "프로모션 문자 보내기",
        payload: { targetDay: weakestDay, dayName },
      },
    };
  },
};


/**
 * KPI 계산 엔진
 * 매출, 비용, 고정비 데이터를 기반으로 핵심 경영 지표를 계산한다.
 */

export interface KpiInput {
  totalRevenue: number;
  totalExpense: number; // 변동비 (매입)
  totalFixedCost: number; // 고정비 합계
  totalLaborCost: number; // 인건비 (고정비 중 is_labor=true)
}

export interface KpiResult {
  grossProfit: number;
  netProfit: number;
  grossMargin: number; // 매출총이익률 (%)
  laborRatio: number; // 인건비 비율 (%)
  fixedCostRatio: number; // 고정비 비율 (%)
  survivalScore: number; // 생존 점수 (0~100)
}

export function calculateKpi(input: KpiInput): KpiResult {
  const { totalRevenue, totalExpense, totalFixedCost, totalLaborCost } = input;

  const grossProfit = totalRevenue - totalExpense;
  const netProfit = grossProfit - totalFixedCost;

  const grossMargin =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const laborRatio =
    totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0;
  const fixedCostRatio =
    totalRevenue > 0 ? (totalFixedCost / totalRevenue) * 100 : 0;

  const survivalScore = calculateSurvivalScore({
    grossMargin,
    laborRatio,
    fixedCostRatio,
    netProfit,
    totalRevenue,
  });

  return {
    grossProfit,
    netProfit,
    grossMargin: Math.round(grossMargin * 100) / 100,
    laborRatio: Math.round(laborRatio * 100) / 100,
    fixedCostRatio: Math.round(fixedCostRatio * 100) / 100,
    survivalScore: Math.round(survivalScore * 10) / 10,
  };
}

interface SurvivalInput {
  grossMargin: number;
  laborRatio: number;
  fixedCostRatio: number;
  netProfit: number;
  totalRevenue: number;
}

/**
 * 생존 점수 계산 (0~100)
 *
 * 가중치:
 * - 순이익 여부: 30점
 * - 매출총이익률: 25점
 * - 인건비 비율: 20점
 * - 고정비 비율: 25점
 */
function calculateSurvivalScore(input: SurvivalInput): number {
  const { grossMargin, laborRatio, fixedCostRatio, netProfit, totalRevenue } =
    input;

  if (totalRevenue === 0) return 0;

  let score = 0;

  // 순이익 점수 (30점)
  if (netProfit > 0) {
    const profitMargin = (netProfit / totalRevenue) * 100;
    score += Math.min(30, profitMargin * 3);
  }

  // 매출총이익률 점수 (25점) - 높을수록 좋음
  if (grossMargin >= 60) score += 25;
  else if (grossMargin >= 40) score += 20;
  else if (grossMargin >= 20) score += 12;
  else if (grossMargin >= 10) score += 5;

  // 인건비 비율 점수 (20점) - 낮을수록 좋음 (업종마다 다르지만 기본 기준)
  if (laborRatio <= 20) score += 20;
  else if (laborRatio <= 30) score += 15;
  else if (laborRatio <= 40) score += 8;
  else if (laborRatio <= 50) score += 3;

  // 고정비 비율 점수 (25점) - 낮을수록 좋음
  if (fixedCostRatio <= 30) score += 25;
  else if (fixedCostRatio <= 50) score += 18;
  else if (fixedCostRatio <= 70) score += 10;
  else if (fixedCostRatio <= 85) score += 4;

  return Math.min(100, Math.max(0, score));
}

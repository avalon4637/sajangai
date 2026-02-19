import type { MonthlySummary } from "./data-entry";

export interface DashboardData {
  currentMonth: MonthlySummary | null;
  previousMonth: MonthlySummary | null;
  trend: MonthlySummary[];
  revenueByChannel: { channel: string; total: number }[];
  expenseBreakdown: { variable: number; fixed: number; labor: number };
  selectedMonth: string;
}

export interface SurvivalScoreBreakdown {
  netProfitScore: number;
  grossMarginScore: number;
  laborRatioScore: number;
  fixedCostRatioScore: number;
  total: number;
}

/**
 * Calculate survival score breakdown from KPI values.
 * Extracts scoring logic from calculator.ts for display purposes.
 */
export function calculateSurvivalScoreBreakdown(params: {
  grossMargin: number;
  laborRatio: number;
  fixedCostRatio: number;
  netProfit: number;
  totalRevenue: number;
}): SurvivalScoreBreakdown {
  const { grossMargin, laborRatio, fixedCostRatio, netProfit, totalRevenue } =
    params;

  if (totalRevenue === 0) {
    return {
      netProfitScore: 0,
      grossMarginScore: 0,
      laborRatioScore: 0,
      fixedCostRatioScore: 0,
      total: 0,
    };
  }

  // Net profit score (30 points max)
  let netProfitScore = 0;
  if (netProfit > 0) {
    const profitMargin = (netProfit / totalRevenue) * 100;
    netProfitScore = Math.min(30, profitMargin * 3);
  }

  // Gross margin score (25 points max)
  let grossMarginScore = 0;
  if (grossMargin >= 60) grossMarginScore = 25;
  else if (grossMargin >= 40) grossMarginScore = 20;
  else if (grossMargin >= 20) grossMarginScore = 12;
  else if (grossMargin >= 10) grossMarginScore = 5;

  // Labor ratio score (20 points max)
  let laborRatioScore = 0;
  if (laborRatio <= 20) laborRatioScore = 20;
  else if (laborRatio <= 30) laborRatioScore = 15;
  else if (laborRatio <= 40) laborRatioScore = 8;
  else if (laborRatio <= 50) laborRatioScore = 3;

  // Fixed cost ratio score (25 points max)
  let fixedCostRatioScore = 0;
  if (fixedCostRatio <= 30) fixedCostRatioScore = 25;
  else if (fixedCostRatio <= 50) fixedCostRatioScore = 18;
  else if (fixedCostRatio <= 70) fixedCostRatioScore = 10;
  else if (fixedCostRatio <= 85) fixedCostRatioScore = 4;

  const total = Math.min(
    100,
    Math.max(
      0,
      netProfitScore + grossMarginScore + laborRatioScore + fixedCostRatioScore
    )
  );

  return {
    netProfitScore: Math.round(netProfitScore * 10) / 10,
    grossMarginScore,
    laborRatioScore,
    fixedCostRatioScore,
    total: Math.round(total * 10) / 10,
  };
}

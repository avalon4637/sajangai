/**
 * 5-Factor Survival Score for Seri analysis page.
 * Separate from the existing 4-factor calculator in calculator.ts.
 */

export interface SurvivalScoreInput {
  totalRevenue: number;
  totalExpense: number; // total expense + fixed costs
  fixedCosts: number;
  laborCosts: number;
  cashBalance: number; // estimated: cumulative revenue - cumulative expenses
  monthlyBurnRate: number; // average monthly total expense
  previousMonthRevenue: number | null;
}

export interface SurvivalFactorDetail {
  score: number;
  max: number;
}

export interface SurvivalScoreResult {
  total: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  factors: {
    profitability: SurvivalFactorDetail & { ratio: number };
    fixedCostStability: SurvivalFactorDetail & { ratio: number };
    laborAppropriateness: SurvivalFactorDetail & { ratio: number };
    cashLiquidity: SurvivalFactorDetail & { runway: number };
    growth: SurvivalFactorDetail & { growthRate: number };
  };
}

function getGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 81) return "A";
  if (score >= 61) return "B";
  if (score >= 41) return "C";
  if (score >= 21) return "D";
  return "F";
}

export function calculateSurvivalScore(
  input: SurvivalScoreInput
): SurvivalScoreResult {
  const {
    totalRevenue,
    totalExpense,
    fixedCosts,
    laborCosts,
    cashBalance,
    monthlyBurnRate,
    previousMonthRevenue,
  } = input;

  // Zero revenue edge case
  if (totalRevenue === 0) {
    return {
      total: 0,
      grade: "F",
      factors: {
        profitability: { score: 0, max: 30, ratio: 0 },
        fixedCostStability: { score: 0, max: 25, ratio: 0 },
        laborAppropriateness: { score: 0, max: 20, ratio: 0 },
        cashLiquidity: { score: 0, max: 15, runway: 0 },
        growth: { score: 0, max: 10, growthRate: 0 },
      },
    };
  }

  // Profitability (30pts)
  const profitMargin = ((totalRevenue - totalExpense) / totalRevenue) * 100;
  let profitScore = 0;
  if (profitMargin >= 20) profitScore = 30;
  else if (profitMargin >= 15) profitScore = 25;
  else if (profitMargin >= 10) profitScore = 20;
  else if (profitMargin >= 5) profitScore = 15;
  else if (profitMargin >= 0) profitScore = 10;

  // Fixed cost stability (25pts)
  const fixedCostRatio = (fixedCosts / totalRevenue) * 100;
  let fixedCostScore = 5;
  if (fixedCostRatio <= 25) fixedCostScore = 25;
  else if (fixedCostRatio <= 30) fixedCostScore = 20;
  else if (fixedCostRatio <= 40) fixedCostScore = 15;
  else if (fixedCostRatio <= 50) fixedCostScore = 10;

  // Labor appropriateness (20pts)
  const laborRatio = (laborCosts / totalRevenue) * 100;
  let laborScore = 4;
  if (laborRatio <= 20) laborScore = 20;
  else if (laborRatio <= 25) laborScore = 16;
  else if (laborRatio <= 30) laborScore = 12;
  else if (laborRatio <= 35) laborScore = 8;

  // Cash liquidity (15pts)
  const runway =
    monthlyBurnRate > 0 ? cashBalance / monthlyBurnRate : cashBalance > 0 ? 12 : 0;
  let cashScore = 0;
  if (runway >= 6) cashScore = 15;
  else if (runway >= 3) cashScore = 12;
  else if (runway >= 2) cashScore = 8;
  else if (runway >= 1) cashScore = 4;

  // Growth (10pts)
  let growthRate = 0;
  let growthScore = 2;
  if (previousMonthRevenue !== null && previousMonthRevenue > 0) {
    growthRate =
      ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    if (growthRate >= 10) growthScore = 10;
    else if (growthRate >= 5) growthScore = 8;
    else if (growthRate >= 0) growthScore = 6;
    else if (growthRate >= -5) growthScore = 4;
  }

  const total = Math.min(
    100,
    profitScore + fixedCostScore + laborScore + cashScore + growthScore
  );

  return {
    total: Math.round(total * 10) / 10,
    grade: getGrade(total),
    factors: {
      profitability: {
        score: profitScore,
        max: 30,
        ratio: Math.round(profitMargin * 10) / 10,
      },
      fixedCostStability: {
        score: fixedCostScore,
        max: 25,
        ratio: Math.round(fixedCostRatio * 10) / 10,
      },
      laborAppropriateness: {
        score: laborScore,
        max: 20,
        ratio: Math.round(laborRatio * 10) / 10,
      },
      cashLiquidity: {
        score: cashScore,
        max: 15,
        runway: Math.round(runway * 10) / 10,
      },
      growth: {
        score: growthScore,
        max: 10,
        growthRate: Math.round(growthRate * 10) / 10,
      },
    },
  };
}

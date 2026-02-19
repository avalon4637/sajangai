/**
 * 의사결정 시뮬레이션 엔진
 * "만약 ~하면?" 시나리오를 시뮬레이션하여 KPI 변화를 예측한다.
 */

import { calculateKpi, type KpiInput, type KpiResult } from "@/lib/kpi/calculator";

export type SimulationType =
  | "employee_change" // 직원 증감
  | "revenue_change" // 매출 변동
  | "rent_change" // 임대료 변동
  | "expense_change"; // 매입 비용 변동

export interface SimulationParams {
  type: SimulationType;
  value: number; // 변동값 (양수/음수, 절대값 또는 비율)
  isPercentage: boolean; // true면 비율(%), false면 절대값(원)
}

export interface SimulationResult {
  before: KpiResult;
  after: KpiResult;
  changes: {
    netProfitDiff: number;
    survivalScoreDiff: number;
    grossMarginDiff: number;
    laborRatioDiff: number;
    fixedCostRatioDiff: number;
  };
}

export function runSimulation(
  currentInput: KpiInput,
  params: SimulationParams
): SimulationResult {
  const before = calculateKpi(currentInput);
  const simulatedInput = applySimulation(currentInput, params);
  const after = calculateKpi(simulatedInput);

  return {
    before,
    after,
    changes: {
      netProfitDiff: after.netProfit - before.netProfit,
      survivalScoreDiff: after.survivalScore - before.survivalScore,
      grossMarginDiff: after.grossMargin - before.grossMargin,
      laborRatioDiff: after.laborRatio - before.laborRatio,
      fixedCostRatioDiff: after.fixedCostRatio - before.fixedCostRatio,
    },
  };
}

function applySimulation(
  input: KpiInput,
  params: SimulationParams
): KpiInput {
  const { type, value, isPercentage } = params;
  const result = { ...input };

  switch (type) {
    case "employee_change": {
      // 인건비 변동 (직원 증감)
      const change = isPercentage
        ? result.totalLaborCost * (value / 100)
        : value;
      result.totalLaborCost = Math.max(0, result.totalLaborCost + change);
      result.totalFixedCost =
        result.totalFixedCost - input.totalLaborCost + result.totalLaborCost;
      break;
    }
    case "revenue_change": {
      const change = isPercentage
        ? result.totalRevenue * (value / 100)
        : value;
      result.totalRevenue = Math.max(0, result.totalRevenue + change);
      break;
    }
    case "rent_change": {
      const change = isPercentage
        ? (result.totalFixedCost - result.totalLaborCost) * (value / 100)
        : value;
      result.totalFixedCost = Math.max(
        result.totalLaborCost,
        result.totalFixedCost + change
      );
      break;
    }
    case "expense_change": {
      const change = isPercentage
        ? result.totalExpense * (value / 100)
        : value;
      result.totalExpense = Math.max(0, result.totalExpense + change);
      break;
    }
  }

  return result;
}

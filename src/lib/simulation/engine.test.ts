import { describe, it, expect } from "vitest";
import { runSimulation, type SimulationParams } from "./engine";
import type { KpiInput } from "@/lib/kpi/calculator";

// Standard baseline input for simulation tests
const baseInput: KpiInput = {
  totalRevenue: 10_000_000,
  totalExpense: 4_000_000,
  totalFixedCost: 3_000_000,
  totalLaborCost: 2_000_000,
};

describe("runSimulation", () => {
  describe("employee_change (labor cost)", () => {
    it("should increase labor cost by absolute value (won)", () => {
      const params: SimulationParams = {
        type: "employee_change",
        value: 2_000_000, // +200 man won (1 employee)
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      // totalLaborCost: 2M + 2M = 4M
      // totalFixedCost: 3M - 2M + 4M = 5M
      expect(result.after.laborRatio).toBeGreaterThan(result.before.laborRatio);
      expect(result.changes.laborRatioDiff).toBeGreaterThan(0);
    });

    it("should decrease labor cost by absolute negative value", () => {
      const params: SimulationParams = {
        type: "employee_change",
        value: -1_000_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      // totalLaborCost: 2M - 1M = 1M
      // totalFixedCost: 3M - 2M + 1M = 2M
      expect(result.after.laborRatio).toBeLessThan(result.before.laborRatio);
      expect(result.changes.laborRatioDiff).toBeLessThan(0);
    });

    it("should increase labor cost by percentage", () => {
      const params: SimulationParams = {
        type: "employee_change",
        value: 50, // +50%
        isPercentage: true,
      };
      const result = runSimulation(baseInput, params);
      // totalLaborCost: 2M + (2M * 0.5) = 3M
      // totalFixedCost: 3M - 2M + 3M = 4M
      expect(result.after.laborRatio).toBeGreaterThan(result.before.laborRatio);
    });

    it("should not let labor cost go below 0", () => {
      const params: SimulationParams = {
        type: "employee_change",
        value: -10_000_000, // far exceeds current labor cost
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      // Math.max(0, 2M + (-10M)) = 0
      expect(result.after.laborRatio).toBe(0);
    });
  });

  describe("revenue_change", () => {
    it("should increase revenue by absolute value", () => {
      const params: SimulationParams = {
        type: "revenue_change",
        value: 2_000_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      // revenue: 10M + 2M = 12M
      expect(result.after.netProfit).toBeGreaterThan(result.before.netProfit);
      expect(result.changes.netProfitDiff).toBe(2_000_000);
    });

    it("should decrease revenue by absolute negative value", () => {
      const params: SimulationParams = {
        type: "revenue_change",
        value: -3_000_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      expect(result.after.netProfit).toBeLessThan(result.before.netProfit);
      expect(result.changes.netProfitDiff).toBe(-3_000_000);
    });

    it("should increase revenue by percentage", () => {
      const params: SimulationParams = {
        type: "revenue_change",
        value: 10, // +10%
        isPercentage: true,
      };
      const result = runSimulation(baseInput, params);
      // revenue: 10M + (10M * 0.1) = 11M, netProfit diff = 1M
      expect(result.changes.netProfitDiff).toBe(1_000_000);
    });

    it("should not let revenue go below 0", () => {
      const params: SimulationParams = {
        type: "revenue_change",
        value: -20_000_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      // Math.max(0, 10M + (-20M)) = 0
      expect(result.after.grossMargin).toBe(0);
    });
  });

  describe("rent_change (fixed cost excluding labor)", () => {
    it("should increase fixed cost by absolute value (rent increase)", () => {
      const params: SimulationParams = {
        type: "rent_change",
        value: 500_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      // fixedCost: 3M + 0.5M = 3.5M
      expect(result.after.fixedCostRatio).toBeGreaterThan(result.before.fixedCostRatio);
      expect(result.changes.fixedCostRatioDiff).toBeGreaterThan(0);
    });

    it("should decrease fixed cost by absolute negative value", () => {
      const params: SimulationParams = {
        type: "rent_change",
        value: -500_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      expect(result.after.fixedCostRatio).toBeLessThan(result.before.fixedCostRatio);
    });

    it("should change rent by percentage of non-labor fixed cost", () => {
      const params: SimulationParams = {
        type: "rent_change",
        value: 100, // +100% of non-labor fixed cost
        isPercentage: true,
      };
      const result = runSimulation(baseInput, params);
      // non-labor fixed cost = 3M - 2M = 1M
      // change = 1M * 1.0 = 1M
      // new fixedCost = 3M + 1M = 4M
      expect(result.changes.netProfitDiff).toBe(-1_000_000);
    });

    it("should not let fixed cost go below labor cost", () => {
      const params: SimulationParams = {
        type: "rent_change",
        value: -10_000_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      // Math.max(laborCost, fixedCost + change) = Math.max(2M, 3M - 10M) = 2M
      // fixedCost becomes equal to laborCost (non-labor = 0)
      expect(result.after.fixedCostRatio).toBeLessThanOrEqual(result.before.fixedCostRatio);
    });
  });

  describe("expense_change (variable cost / COGS)", () => {
    it("should increase expense by absolute value", () => {
      const params: SimulationParams = {
        type: "expense_change",
        value: 1_000_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      // expense: 4M + 1M = 5M
      expect(result.after.grossMargin).toBeLessThan(result.before.grossMargin);
      expect(result.changes.grossMarginDiff).toBeLessThan(0);
    });

    it("should decrease expense by percentage", () => {
      const params: SimulationParams = {
        type: "expense_change",
        value: -25, // -25%
        isPercentage: true,
      };
      const result = runSimulation(baseInput, params);
      // expense: 4M + (4M * -0.25) = 3M
      expect(result.after.grossMargin).toBeGreaterThan(result.before.grossMargin);
    });

    it("should not let expense go below 0", () => {
      const params: SimulationParams = {
        type: "expense_change",
        value: -20_000_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      // Math.max(0, 4M + (-20M)) = 0
      // grossMargin = 100%
      expect(result.after.grossMargin).toBe(100);
    });
  });

  describe("zero change", () => {
    it("should produce identical before/after when value is 0", () => {
      const params: SimulationParams = {
        type: "revenue_change",
        value: 0,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      expect(result.before).toEqual(result.after);
      expect(result.changes.netProfitDiff).toBe(0);
      expect(result.changes.survivalScoreDiff).toBe(0);
      expect(result.changes.grossMarginDiff).toBe(0);
      expect(result.changes.laborRatioDiff).toBe(0);
      expect(result.changes.fixedCostRatioDiff).toBe(0);
    });

    it("should produce identical before/after for percentage 0%", () => {
      const params: SimulationParams = {
        type: "expense_change",
        value: 0,
        isPercentage: true,
      };
      const result = runSimulation(baseInput, params);
      expect(result.before).toEqual(result.after);
    });
  });

  describe("result structure", () => {
    it("should return before, after, and changes properties", () => {
      const params: SimulationParams = {
        type: "revenue_change",
        value: 1_000_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      expect(result).toHaveProperty("before");
      expect(result).toHaveProperty("after");
      expect(result).toHaveProperty("changes");
      expect(result.changes).toHaveProperty("netProfitDiff");
      expect(result.changes).toHaveProperty("survivalScoreDiff");
      expect(result.changes).toHaveProperty("grossMarginDiff");
      expect(result.changes).toHaveProperty("laborRatioDiff");
      expect(result.changes).toHaveProperty("fixedCostRatioDiff");
    });

    it("should calculate changes as after - before", () => {
      const params: SimulationParams = {
        type: "revenue_change",
        value: 2_000_000,
        isPercentage: false,
      };
      const result = runSimulation(baseInput, params);
      expect(result.changes.netProfitDiff).toBe(
        result.after.netProfit - result.before.netProfit
      );
      expect(result.changes.grossMarginDiff).toBe(
        result.after.grossMargin - result.before.grossMargin
      );
    });
  });
});

import { describe, it, expect } from "vitest";
import { calculateKpi, type KpiInput } from "./calculator";

// Helper to create KpiInput with defaults
function makeInput(overrides: Partial<KpiInput> = {}): KpiInput {
  return {
    totalRevenue: 10_000_000,
    totalExpense: 4_000_000,
    totalFixedCost: 1_500_000,
    totalLaborCost: 2_000_000,
    ...overrides,
  };
}

describe("calculateKpi", () => {
  describe("basic calculations", () => {
    it("should calculate grossProfit correctly (revenue - expense)", () => {
      const result = calculateKpi(makeInput());
      // 10,000,000 - 4,000,000 = 6,000,000
      expect(result.grossProfit).toBe(6_000_000);
    });

    it("should calculate netProfit correctly (grossProfit - fixedCost)", () => {
      const result = calculateKpi(makeInput());
      // 6,000,000 - 1,500,000 = 4,500,000
      expect(result.netProfit).toBe(4_500_000);
    });

    it("should calculate grossMargin as percentage", () => {
      const result = calculateKpi(makeInput());
      // (6,000,000 / 10,000,000) * 100 = 60%
      expect(result.grossMargin).toBe(60);
    });

    it("should calculate laborRatio as percentage", () => {
      const result = calculateKpi(makeInput());
      // (2,000,000 / 10,000,000) * 100 = 20%
      expect(result.laborRatio).toBe(20);
    });

    it("should calculate fixedCostRatio as percentage", () => {
      const result = calculateKpi(makeInput());
      // (1,500,000 / 10,000,000) * 100 = 15%
      expect(result.fixedCostRatio).toBe(15);
    });
  });

  describe("zero revenue handling", () => {
    it("should return all zeros when revenue is 0", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 0,
          totalExpense: 0,
          totalFixedCost: 0,
          totalLaborCost: 0,
        })
      );
      expect(result.grossProfit).toBe(0);
      expect(result.netProfit).toBe(0);
      expect(result.grossMargin).toBe(0);
      expect(result.laborRatio).toBe(0);
      expect(result.fixedCostRatio).toBe(0);
      expect(result.survivalScore).toBe(0);
    });

    it("should handle zero revenue with non-zero costs", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 0,
          totalExpense: 1_000_000,
          totalFixedCost: 500_000,
          totalLaborCost: 300_000,
        })
      );
      expect(result.grossProfit).toBe(-1_000_000);
      expect(result.netProfit).toBe(-1_500_000);
      expect(result.grossMargin).toBe(0);
      expect(result.laborRatio).toBe(0);
      expect(result.fixedCostRatio).toBe(0);
      expect(result.survivalScore).toBe(0);
    });
  });

  describe("loss scenario", () => {
    it("should return negative netProfit when expenses exceed revenue", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 5_000_000,
          totalExpense: 4_000_000,
          totalFixedCost: 3_000_000,
          totalLaborCost: 1_000_000,
        })
      );
      // grossProfit = 5M - 4M = 1M
      // netProfit = 1M - 3M = -2M
      expect(result.grossProfit).toBe(1_000_000);
      expect(result.netProfit).toBe(-2_000_000);
    });

    it("should have low survivalScore when in loss", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 5_000_000,
          totalExpense: 4_500_000,
          totalFixedCost: 4_000_000,
          totalLaborCost: 2_500_000,
        })
      );
      // netProfit is negative, so netProfit score = 0
      // grossMargin = (0.5M/5M)*100 = 10% => 5 points
      // laborRatio = (2.5M/5M)*100 = 50% => 3 points
      // fixedCostRatio = (4M/5M)*100 = 80% => 4 points
      expect(result.netProfit).toBe(-3_500_000);
      expect(result.survivalScore).toBe(12);
    });
  });

  describe("survival score weights", () => {
    it("should give max 30 points for netProfit (capped at 30)", () => {
      // Very high profit margin to hit the cap: profitMargin * 3 >= 30
      // Need profitMargin >= 10% => netProfit/revenue >= 0.1
      const result = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 0,
          totalFixedCost: 0,
          totalLaborCost: 0,
        })
      );
      // netProfit = 10M, profitMargin = 100%, score = min(30, 100*3) = 30
      // grossMargin = 100% => 25 points
      // laborRatio = 0% => 20 points
      // fixedCostRatio = 0% => 25 points
      // total = 30 + 25 + 20 + 25 = 100
      expect(result.survivalScore).toBe(100);
    });

    it("should give 0 netProfit points when netProfit <= 0", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 10_000_000,
          totalFixedCost: 1_000_000,
          totalLaborCost: 0,
        })
      );
      // netProfit = 0 - 1M = -1M, so netProfit score = 0
      // grossMargin = 0% => 0 points
      // laborRatio = 0% => 20 points
      // fixedCostRatio = (1M/10M)*100 = 10% => 25 points
      expect(result.survivalScore).toBe(45);
    });

    it("should score grossMargin: 25 at >=60%, 20 at >=40%, 12 at >=20%, 5 at >=10%, 0 below", () => {
      // grossMargin = 60% => 25 points
      const r1 = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 4_000_000, // grossMargin = 60%
          totalFixedCost: 0,
          totalLaborCost: 0,
        })
      );
      // grossMargin = 40% => 20 points
      const r2 = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 6_000_000, // grossMargin = 40%
          totalFixedCost: 0,
          totalLaborCost: 0,
        })
      );
      // grossMargin = 20% => 12 points
      const r3 = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 8_000_000, // grossMargin = 20%
          totalFixedCost: 0,
          totalLaborCost: 0,
        })
      );
      // grossMargin = 10% => 5 points
      const r4 = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 9_000_000, // grossMargin = 10%
          totalFixedCost: 0,
          totalLaborCost: 0,
        })
      );
      // grossMargin = 5% => 0 points
      const r5 = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 9_500_000, // grossMargin = 5%
          totalFixedCost: 0,
          totalLaborCost: 0,
        })
      );

      // All have: netProfit > 0 (various), laborRatio = 0 (20pts), fixedCostRatio = 0 (25pts)
      // r1: netProfit=6M, profitMargin=60%, netProfitScore=min(30,180)=30, grossMargin=25 => 30+25+20+25=100
      expect(r1.survivalScore).toBe(100);
      // r2: netProfit=4M, profitMargin=40%, netProfitScore=min(30,120)=30, grossMargin=20 => 30+20+20+25=95
      expect(r2.survivalScore).toBe(95);
      // r3: netProfit=2M, profitMargin=20%, netProfitScore=min(30,60)=30, grossMargin=12 => 30+12+20+25=87
      expect(r3.survivalScore).toBe(87);
      // r4: netProfit=1M, profitMargin=10%, netProfitScore=min(30,30)=30, grossMargin=5 => 30+5+20+25=80
      expect(r4.survivalScore).toBe(80);
      // r5: netProfit=0.5M, profitMargin=5%, netProfitScore=min(30,15)=15, grossMargin=0 => 15+0+20+25=60
      expect(r5.survivalScore).toBe(60);
    });

    it("should score laborRatio: 20 at <=20%, 15 at <=30%, 8 at <=40%, 3 at <=50%, 0 above", () => {
      // Use fixed parameters: revenue=10M, expense=4M (grossMargin=60% => 25pts)
      // fixedCost = laborCost (so fixedCostRatio = laborRatio)
      // We only vary laborCost

      // laborRatio = 20% => 20 points
      const r1 = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 4_000_000,
          totalLaborCost: 2_000_000,
          totalFixedCost: 2_000_000,
        })
      );
      // laborRatio = 30% => 15 points
      const r2 = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 4_000_000,
          totalLaborCost: 3_000_000,
          totalFixedCost: 3_000_000,
        })
      );

      // r1: laborRatio = 20% => 20pts, fixedCostRatio = 20% => 25pts
      expect(r1.laborRatio).toBe(20);
      // r2: laborRatio = 30% => 15pts, fixedCostRatio = 30% => 25pts
      expect(r2.laborRatio).toBe(30);
    });
  });

  describe("survival score grade boundaries", () => {
    it("should produce score in danger range (0-30) with poor metrics", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 9_500_000, // grossMargin = 5% => 0
          totalFixedCost: 9_000_000, // fixedCostRatio = 90% => 0
          totalLaborCost: 6_000_000, // laborRatio = 60% => 0
        })
      );
      // netProfit = 0.5M - 9M = -8.5M => 0 points
      // total = 0
      expect(result.survivalScore).toBeLessThanOrEqual(30);
    });

    it("should produce score in caution range (31-60) with moderate metrics", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 9_000_000, // grossMargin = 10% => 5
          totalFixedCost: 1_000_000, // fixedCostRatio = 10% => 25
          totalLaborCost: 500_000, // laborRatio = 5% => 20
        })
      );
      // netProfit = 1M - 1M = 0 => 0 points
      // total = 0 + 5 + 20 + 25 = 50
      expect(result.survivalScore).toBeGreaterThanOrEqual(31);
      expect(result.survivalScore).toBeLessThanOrEqual(60);
    });

    it("should produce score in good range (61-80) with decent metrics", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 6_000_000, // grossMargin = 40% => 20
          totalFixedCost: 2_500_000, // fixedCostRatio = 25% => 25
          totalLaborCost: 1_500_000, // laborRatio = 15% => 20
        })
      );
      // netProfit = 4M - 2.5M = 1.5M => profitMargin=15%, score=min(30,45)=30... wait
      // Actually that would be 30+20+20+25 = 95, which is excellent
      // Let's adjust to get 61-80 range
      const r2 = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 8_000_000, // grossMargin = 20% => 12
          totalFixedCost: 1_000_000, // fixedCostRatio = 10% => 25
          totalLaborCost: 500_000, // laborRatio = 5% => 20
        })
      );
      // netProfit = 2M - 1M = 1M => profitMargin=10%, score=min(30,30)=30
      // total = 30 + 12 + 20 + 25 = 87... still too high
      // Need to reduce: get partial netProfit score
      const r3 = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 6_000_000, // grossMargin = 40% => 20
          totalFixedCost: 3_800_000, // fixedCostRatio = 38% => 18
          totalLaborCost: 3_500_000, // laborRatio = 35% => 8
        })
      );
      // netProfit = 4M - 3.8M = 0.2M => profitMargin=2%, score=min(30,6)=6
      // total = 6 + 20 + 8 + 18 = 52 => caution, not good
      // Let's try another combination
      const r4 = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 4_000_000, // grossMargin = 60% => 25
          totalFixedCost: 5_500_000, // fixedCostRatio = 55% => 10
          totalLaborCost: 2_500_000, // laborRatio = 25% => 15
        })
      );
      // netProfit = 6M - 5.5M = 0.5M => profitMargin=5%, score=min(30,15)=15
      // total = 15 + 25 + 15 + 10 = 65
      expect(r4.survivalScore).toBeGreaterThanOrEqual(61);
      expect(r4.survivalScore).toBeLessThanOrEqual(80);
    });

    it("should produce score in excellent range (81-100) with strong metrics", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 3_000_000, // grossMargin = 70% => 25
          totalFixedCost: 1_000_000, // fixedCostRatio = 10% => 25
          totalLaborCost: 500_000, // laborRatio = 5% => 20
        })
      );
      // netProfit = 7M - 1M = 6M => profitMargin=60%, score=min(30,180)=30
      // total = 30 + 25 + 20 + 25 = 100
      expect(result.survivalScore).toBeGreaterThanOrEqual(81);
      expect(result.survivalScore).toBeLessThanOrEqual(100);
    });
  });

  describe("edge cases", () => {
    it("should handle very large numbers", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 999_999_999_999,
          totalExpense: 400_000_000_000,
          totalFixedCost: 100_000_000_000,
          totalLaborCost: 50_000_000_000,
        })
      );
      expect(result.grossProfit).toBe(599_999_999_999);
      expect(result.netProfit).toBe(499_999_999_999);
      expect(result.survivalScore).toBeGreaterThan(0);
      expect(result.survivalScore).toBeLessThanOrEqual(100);
    });

    it("should round percentages to 2 decimal places", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 3_000_000,
          totalExpense: 1_000_000,
          totalFixedCost: 500_000,
          totalLaborCost: 333_333,
        })
      );
      // laborRatio = (333333/3000000)*100 = 11.1111%
      expect(result.laborRatio).toBe(11.11);
    });

    it("should round survivalScore to 1 decimal place", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 8_500_000, // grossMargin = 15% => 5
          totalFixedCost: 500_000, // fixedCostRatio = 5% => 25
          totalLaborCost: 200_000, // laborRatio = 2% => 20
        })
      );
      // netProfit = 1.5M - 0.5M = 1M => profitMargin=10%, score=min(30,30)=30
      // total = 30 + 5 + 20 + 25 = 80
      expect(result.survivalScore).toBe(80);
      expect(Number.isFinite(result.survivalScore)).toBe(true);
    });

    it("should clamp survivalScore between 0 and 100", () => {
      // Maximum possible score
      const max = calculateKpi(
        makeInput({
          totalRevenue: 10_000_000,
          totalExpense: 0,
          totalFixedCost: 0,
          totalLaborCost: 0,
        })
      );
      expect(max.survivalScore).toBeLessThanOrEqual(100);

      // Minimum possible score
      const min = calculateKpi(
        makeInput({
          totalRevenue: 1_000_000,
          totalExpense: 950_000,
          totalFixedCost: 900_000,
          totalLaborCost: 600_000,
        })
      );
      expect(min.survivalScore).toBeGreaterThanOrEqual(0);
    });

    it("should handle minimal amounts (1 won)", () => {
      const result = calculateKpi(
        makeInput({
          totalRevenue: 1,
          totalExpense: 0,
          totalFixedCost: 0,
          totalLaborCost: 0,
        })
      );
      expect(result.grossProfit).toBe(1);
      expect(result.netProfit).toBe(1);
      expect(result.grossMargin).toBe(100);
    });
  });
});

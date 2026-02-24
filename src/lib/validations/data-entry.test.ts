import { describe, it, expect } from "vitest";
import { RevenueSchema, ExpenseSchema, FixedCostSchema } from "./data-entry";

describe("RevenueSchema", () => {
  it("should pass with valid revenue data", () => {
    const result = RevenueSchema.safeParse({
      date: "2026-01-15",
      amount: 100000,
      channel: "카드",
      category: "매장",
      memo: "점심 매출",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with only required fields (date, amount)", () => {
    const result = RevenueSchema.safeParse({
      date: "2026-01-15",
      amount: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("should pass with empty string for optional fields", () => {
    const result = RevenueSchema.safeParse({
      date: "2026-01-15",
      amount: 10000,
      channel: "",
      category: "",
      memo: "",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with amount 0 (minimum is 1)", () => {
    const result = RevenueSchema.safeParse({
      date: "2026-01-15",
      amount: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const amountError = result.error.issues.find((i) =>
        i.path.includes("amount")
      );
      expect(amountError).toBeDefined();
    }
  });

  it("should fail with negative amount", () => {
    const result = RevenueSchema.safeParse({
      date: "2026-01-15",
      amount: -1000,
    });
    expect(result.success).toBe(false);
  });

  it("should fail with decimal amount (must be integer)", () => {
    const result = RevenueSchema.safeParse({
      date: "2026-01-15",
      amount: 1000.5,
    });
    expect(result.success).toBe(false);
  });

  it("should fail with amount exceeding max (999,999,999,999)", () => {
    const result = RevenueSchema.safeParse({
      date: "2026-01-15",
      amount: 1_000_000_000_000,
    });
    expect(result.success).toBe(false);
  });

  it("should pass with amount at max boundary (999,999,999,999)", () => {
    const result = RevenueSchema.safeParse({
      date: "2026-01-15",
      amount: 999_999_999_999,
    });
    expect(result.success).toBe(true);
  });

  it("should fail with future date", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const result = RevenueSchema.safeParse({
      date: futureDate.toISOString(),
      amount: 10000,
    });
    expect(result.success).toBe(false);
  });

  it("should fail with invalid date", () => {
    const result = RevenueSchema.safeParse({
      date: "not-a-date",
      amount: 10000,
    });
    expect(result.success).toBe(false);
  });

  it("should fail when channel exceeds 50 characters", () => {
    const result = RevenueSchema.safeParse({
      date: "2026-01-15",
      amount: 10000,
      channel: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("should fail when memo exceeds 500 characters", () => {
    const result = RevenueSchema.safeParse({
      date: "2026-01-15",
      amount: 10000,
      memo: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("ExpenseSchema", () => {
  it("should pass with valid expense data", () => {
    const result = ExpenseSchema.safeParse({
      date: "2026-01-15",
      type: "variable",
      category: "식자재",
      amount: 50000,
      memo: "커피원두 구매",
    });
    expect(result.success).toBe(true);
  });

  it("should accept type 'fixed'", () => {
    const result = ExpenseSchema.safeParse({
      date: "2026-01-15",
      type: "fixed",
      category: "월세",
      amount: 1000000,
    });
    expect(result.success).toBe(true);
  });

  it("should accept type 'variable'", () => {
    const result = ExpenseSchema.safeParse({
      date: "2026-01-15",
      type: "variable",
      category: "소모품",
      amount: 30000,
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid type value", () => {
    const result = ExpenseSchema.safeParse({
      date: "2026-01-15",
      type: "unknown",
      category: "소모품",
      amount: 30000,
    });
    expect(result.success).toBe(false);
  });

  it("should fail when category is empty", () => {
    const result = ExpenseSchema.safeParse({
      date: "2026-01-15",
      type: "variable",
      category: "",
      amount: 30000,
    });
    expect(result.success).toBe(false);
  });

  it("should fail when category exceeds 50 characters", () => {
    const result = ExpenseSchema.safeParse({
      date: "2026-01-15",
      type: "variable",
      category: "a".repeat(51),
      amount: 30000,
    });
    expect(result.success).toBe(false);
  });

  it("should fail with amount 0", () => {
    const result = ExpenseSchema.safeParse({
      date: "2026-01-15",
      type: "variable",
      category: "식자재",
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should fail without required type field", () => {
    const result = ExpenseSchema.safeParse({
      date: "2026-01-15",
      category: "식자재",
      amount: 30000,
    });
    expect(result.success).toBe(false);
  });
});

describe("FixedCostSchema", () => {
  it("should pass with valid fixed cost data", () => {
    const result = FixedCostSchema.safeParse({
      category: "월세",
      amount: 1000000,
      is_labor: false,
    });
    expect(result.success).toBe(true);
  });

  it("should pass with labor cost (is_labor=true)", () => {
    const result = FixedCostSchema.safeParse({
      category: "고정알바",
      amount: 2000000,
      is_labor: true,
    });
    expect(result.success).toBe(true);
  });

  it("should default is_labor to false when not provided", () => {
    const result = FixedCostSchema.safeParse({
      category: "관리비",
      amount: 200000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_labor).toBe(false);
    }
  });

  it("should accept optional date fields", () => {
    const result = FixedCostSchema.safeParse({
      category: "월세",
      amount: 1000000,
      is_labor: false,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("should accept null date fields", () => {
    const result = FixedCostSchema.safeParse({
      category: "월세",
      amount: 1000000,
      is_labor: false,
      start_date: null,
      end_date: null,
    });
    expect(result.success).toBe(true);
  });

  it("should fail when category is empty", () => {
    const result = FixedCostSchema.safeParse({
      category: "",
      amount: 1000000,
    });
    expect(result.success).toBe(false);
  });

  it("should fail with negative amount", () => {
    const result = FixedCostSchema.safeParse({
      category: "월세",
      amount: -100000,
    });
    expect(result.success).toBe(false);
  });

  it("should fail with non-integer amount", () => {
    const result = FixedCostSchema.safeParse({
      category: "월세",
      amount: 999.99,
    });
    expect(result.success).toBe(false);
  });
});

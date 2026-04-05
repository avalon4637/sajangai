import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUnifiedTransactions } from "./transaction-unified";

// Mock getLastDayOfMonth
vi.mock("@/lib/utils", () => ({
  getLastDayOfMonth: vi.fn((ym: string) => `${ym}-31`),
}));

// Build a chainable Supabase query mock
function createChainMock(resolvedValue: { data: unknown[] | null; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const self = () => chain;
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lte = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  // Make it thenable so await resolves
  chain.then = vi.fn((resolve: (v: unknown) => void) => resolve(resolvedValue));
  return chain;
}

let revenueChain: ReturnType<typeof createChainMock>;
let expenseChain: ReturnType<typeof createChainMock>;

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (...args: unknown[]) => mockFrom(...args),
    })
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  revenueChain = createChainMock({ data: [], error: null });
  expenseChain = createChainMock({ data: [], error: null });
  mockFrom.mockImplementation((table: string) => {
    if (table === "revenues") return revenueChain;
    if (table === "expenses") return expenseChain;
    return createChainMock({ data: [], error: null });
  });
});

describe("getUnifiedTransactions", () => {
  const businessId = "biz-1";
  const yearMonth = "2026-03";

  it("should query revenues and expenses tables with correct filters", async () => {
    await getUnifiedTransactions(businessId, yearMonth);

    expect(mockFrom).toHaveBeenCalledWith("revenues");
    expect(mockFrom).toHaveBeenCalledWith("expenses");
    expect(revenueChain.eq).toHaveBeenCalledWith("business_id", businessId);
    expect(revenueChain.gte).toHaveBeenCalledWith("date", "2026-03-01");
    expect(revenueChain.lte).toHaveBeenCalledWith("date", "2026-03-31");
    expect(expenseChain.eq).toHaveBeenCalledWith("business_id", businessId);
  });

  it("should return empty array when no data", async () => {
    const result = await getUnifiedTransactions(businessId, yearMonth);
    expect(result.transactions).toEqual([]);
    expect(result.totals).toEqual({
      totalRevenue: 0,
      totalExpense: 0,
      netProfit: 0,
    });
  });

  it("should correctly map revenue fields to UnifiedTransaction format", async () => {
    revenueChain = createChainMock({
      data: [
        { id: "r1", date: "2026-03-15", category: "배달", amount: 50000, memo: "배달수입", channel: "배민" },
      ],
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "revenues") return revenueChain;
      return expenseChain;
    });

    const result = await getUnifiedTransactions(businessId, yearMonth);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toEqual({
      id: "r1",
      date: "2026-03-15",
      type: "revenue",
      amount: 50000,
      category: "배달",
      vendor: null,
      content: "배달수입",
      channel: "배민",
    });
  });

  it("should correctly map expense fields to UnifiedTransaction format", async () => {
    expenseChain = createChainMock({
      data: [
        { id: "e1", date: "2026-03-10", category: "식재료", amount: 30000, memo: "야채 구입", type: "variable" },
      ],
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "expenses") return expenseChain;
      return revenueChain;
    });

    const result = await getUnifiedTransactions(businessId, yearMonth);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toEqual({
      id: "e1",
      date: "2026-03-10",
      type: "expense",
      amount: 30000,
      category: "식재료",
      vendor: null,
      content: "야채 구입",
    });
  });

  it("should sort by date descending, expenses first on same date", async () => {
    revenueChain = createChainMock({
      data: [
        { id: "r1", date: "2026-03-15", category: "매출", amount: 100, memo: null, channel: null },
        { id: "r2", date: "2026-03-10", category: "매출", amount: 200, memo: null, channel: null },
      ],
      error: null,
    });
    expenseChain = createChainMock({
      data: [
        { id: "e1", date: "2026-03-15", category: "식재료", amount: 50, memo: null, type: "variable" },
      ],
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "revenues") return revenueChain;
      return expenseChain;
    });

    const result = await getUnifiedTransactions(businessId, yearMonth);
    expect(result.transactions.map((t) => t.id)).toEqual(["e1", "r1", "r2"]);
  });

  it("should filter by type 'revenue' only", async () => {
    revenueChain = createChainMock({
      data: [{ id: "r1", date: "2026-03-15", category: "매출", amount: 100, memo: null, channel: null }],
      error: null,
    });
    expenseChain = createChainMock({
      data: [{ id: "e1", date: "2026-03-10", category: "식재료", amount: 50, memo: null, type: "variable" }],
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "revenues") return revenueChain;
      return expenseChain;
    });

    const result = await getUnifiedTransactions(businessId, yearMonth, { type: "revenue" });
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe("revenue");
  });

  it("should filter by type 'expense' only", async () => {
    revenueChain = createChainMock({
      data: [{ id: "r1", date: "2026-03-15", category: "매출", amount: 100, memo: null, channel: null }],
      error: null,
    });
    expenseChain = createChainMock({
      data: [{ id: "e1", date: "2026-03-10", category: "식재료", amount: 50, memo: null, type: "variable" }],
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "revenues") return revenueChain;
      return expenseChain;
    });

    const result = await getUnifiedTransactions(businessId, yearMonth, { type: "expense" });
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe("expense");
  });

  it("should filter by category name when type is not 'revenue' or 'expense'", async () => {
    revenueChain = createChainMock({
      data: [{ id: "r1", date: "2026-03-15", category: "배달", amount: 100, memo: null, channel: null }],
      error: null,
    });
    expenseChain = createChainMock({
      data: [{ id: "e1", date: "2026-03-10", category: "식재료", amount: 50, memo: null, type: "variable" }],
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "revenues") return revenueChain;
      return expenseChain;
    });

    const result = await getUnifiedTransactions(businessId, yearMonth, { type: "배달" });
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].category).toBe("배달");
  });

  it("should filter by search text across content, vendor, and category", async () => {
    revenueChain = createChainMock({
      data: [
        { id: "r1", date: "2026-03-15", category: "배달", amount: 100, memo: "배민 주문", channel: null },
        { id: "r2", date: "2026-03-14", category: "홀", amount: 200, memo: "점심 매출", channel: null },
      ],
      error: null,
    });
    expenseChain = createChainMock({ data: [], error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "revenues") return revenueChain;
      return expenseChain;
    });

    const result = await getUnifiedTransactions(businessId, yearMonth, { search: "배민" });
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].id).toBe("r1");
  });

  it("should calculate monthly totals from unfiltered data", async () => {
    revenueChain = createChainMock({
      data: [
        { id: "r1", date: "2026-03-15", category: "매출", amount: 50000, memo: null, channel: null },
        { id: "r2", date: "2026-03-10", category: "매출", amount: 30000, memo: null, channel: null },
      ],
      error: null,
    });
    expenseChain = createChainMock({
      data: [
        { id: "e1", date: "2026-03-12", category: "식재료", amount: 20000, memo: null, type: "variable" },
      ],
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "revenues") return revenueChain;
      return expenseChain;
    });

    // Even with filter, totals should reflect unfiltered sums
    const result = await getUnifiedTransactions(businessId, yearMonth, { type: "revenue" });
    expect(result.totals).toEqual({
      totalRevenue: 80000,
      totalExpense: 20000,
      netProfit: 60000,
    });
  });

  it("should throw error when revenue query fails", async () => {
    revenueChain = createChainMock({
      data: null,
      error: { message: "connection failed" },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "revenues") return revenueChain;
      return expenseChain;
    });

    await expect(getUnifiedTransactions(businessId, yearMonth)).rejects.toThrow("매출 조회 실패");
  });

  it("should throw error when expense query fails", async () => {
    expenseChain = createChainMock({
      data: null,
      error: { message: "connection failed" },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "revenues") return revenueChain;
      if (table === "expenses") return expenseChain;
      return revenueChain;
    });

    await expect(getUnifiedTransactions(businessId, yearMonth)).rejects.toThrow("매입 조회 실패");
  });

  it("should use default category when category is null", async () => {
    revenueChain = createChainMock({
      data: [{ id: "r1", date: "2026-03-15", category: null, amount: 100, memo: null, channel: null }],
      error: null,
    });
    expenseChain = createChainMock({
      data: [{ id: "e1", date: "2026-03-10", category: null, amount: 50, memo: null, type: "variable" }],
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "revenues") return revenueChain;
      return expenseChain;
    });

    const result = await getUnifiedTransactions(businessId, yearMonth);
    const revenue = result.transactions.find((t) => t.type === "revenue");
    const expense = result.transactions.find((t) => t.type === "expense");
    expect(revenue?.category).toBe("매출");
    expect(expense?.category).toBe("기타");
  });
});

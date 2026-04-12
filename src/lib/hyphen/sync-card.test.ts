import { describe, it, expect, vi, beforeEach } from "vitest";
import type { HyphenCardApprovalItem, HyphenCardDepositItem } from "./types";

// ─── Supabase mock ──────────────────────────────────────────────────────────

const upsertMock = vi.fn();
const fromMock = vi.fn(() => ({ upsert: upsertMock }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: fromMock })),
}));

// ─── Hyphen client mock ─────────────────────────────────────────────────────

const postMock = vi.fn();
vi.mock("./client", () => ({
  createHyphenClient: () => ({ post: postMock }),
  isHyphenConfigured: () => true,
}));

// ─── Import after mocks ─────────────────────────────────────────────────────

const { syncCardSales, syncCardSettlements } = await import("./sync-card");

// ─── Fixtures ───────────────────────────────────────────────────────────────

function makeApproval(
  n: number,
  overrides: Partial<HyphenCardApprovalItem> = {}
): HyphenCardApprovalItem {
  return {
    appDt: "20260410",
    appTm: "143000",
    appNo: `APP-${String(n).padStart(4, "0")}`,
    appAmt: "25000",
    useCard: "신한카드",
    useDiv: "신용",
    instMon: "0",
    cardType: "개인",
    appMethod: "IC",
    appSt: "정상",
    pchDt: "20260410",
    appCancel: "N",
    pchCancel: "N",
    fee: "625",
    payDt: "20260413",
    payAmt: "24375",
    comDiv: "일반",
    svcFee: "0",
    exYn: "N",
    ...overrides,
  };
}

function makeDeposit(
  n: number,
  overrides: Partial<HyphenCardDepositItem> = {}
): HyphenCardDepositItem {
  return {
    payDt: "20260413",
    paySchDt: "20260415",
    salesAmt: "100000",
    payAmt: "97500",
    feeSum: "2500",
    useCard: "신한카드",
    totalCnt: "5",
    ...overrides,
  };
}

// =========================================================================
// syncCardSales
// =========================================================================

describe("syncCardSales", () => {
  const creds = { userId: "test", userPw: "pass" };

  beforeEach(() => {
    vi.clearAllMocks();
    upsertMock.mockResolvedValue({ error: null, count: 0 });
  });

  it("returns early when no credentials", async () => {
    const result = await syncCardSales("biz", undefined, null);
    expect(result).toEqual({ approvalsCount: 0, skippedCount: 0 });
    expect(postMock).not.toHaveBeenCalled();
  });

  it("filters cancelled approvals before batch", async () => {
    postMock.mockResolvedValue({
      data: {
        list: [
          makeApproval(1), // valid
          makeApproval(2, { appCancel: "Y" }), // cancelled
          makeApproval(3, { pchCancel: "Y" }), // cancelled
          makeApproval(4), // valid
        ],
      },
    });
    upsertMock.mockResolvedValue({ error: null, count: 2 });

    const result = await syncCardSales("biz", creds, null);

    // 2 valid approvals in one upsert call
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const rows = upsertMock.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[0].external_id).toBe("APP-0001");
    expect(rows[1].external_id).toBe("APP-0004");

    // skippedCount includes both cancelled
    expect(result.skippedCount).toBe(2);
    expect(result.approvalsCount).toBe(2);
  });

  it("calls upsert with onConflict external_id dedup key", async () => {
    postMock.mockResolvedValue({
      data: { list: [makeApproval(1)] },
    });
    upsertMock.mockResolvedValue({ error: null, count: 1 });

    await syncCardSales("biz-uuid", creds, null);

    expect(fromMock).toHaveBeenCalledWith("revenues");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          business_id: "biz-uuid",
          channel: "카드",
          external_id: "APP-0001",
        }),
      ]),
      expect.objectContaining({
        onConflict: "business_id,channel,external_id",
        ignoreDuplicates: true,
      })
    );
  });

  it("returns all as skipped when all are cancelled", async () => {
    postMock.mockResolvedValue({
      data: {
        list: [
          makeApproval(1, { appCancel: "Y" }),
          makeApproval(2, { pchCancel: "Y" }),
        ],
      },
    });

    const result = await syncCardSales("biz", creds, null);
    expect(result.approvalsCount).toBe(0);
    expect(result.skippedCount).toBe(2);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("returns API error in result", async () => {
    postMock.mockRejectedValue(new Error("Connection refused"));

    const result = await syncCardSales("biz", creds, null);
    expect(result.error).toBe("Connection refused");
  });
});

// =========================================================================
// syncCardSettlements
// =========================================================================

describe("syncCardSettlements", () => {
  const creds = { userId: "test", userPw: "pass" };

  beforeEach(() => {
    vi.clearAllMocks();
    upsertMock.mockResolvedValue({ error: null, count: 0 });
  });

  it("returns early when no credentials", async () => {
    const result = await syncCardSettlements("biz", undefined, null);
    expect(result).toEqual({
      settlementsCount: 0,
      upsertedCount: 0,
      skippedCount: 0,
    });
  });

  it("returns early when deposits list is empty", async () => {
    postMock.mockResolvedValue({ data: { list: [] } });

    const result = await syncCardSettlements("biz", creds, null);
    expect(result.settlementsCount).toBe(0);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("uses card_settlements table with correct onConflict", async () => {
    postMock.mockResolvedValue({
      data: { list: [makeDeposit(1)] },
    });
    upsertMock.mockResolvedValue({ error: null, count: 1 });

    await syncCardSettlements("biz", creds, null);

    expect(fromMock).toHaveBeenCalledWith("card_settlements");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          business_id: "biz",
          card_company: "신한카드",
        }),
      ]),
      expect.objectContaining({
        onConflict:
          "business_id,card_company,pay_scheduled_date,sales_amount",
        ignoreDuplicates: false,
      })
    );
  });

  it("splits 501 deposits into 2 chunks", async () => {
    const deposits = Array.from({ length: 501 }, (_, i) =>
      makeDeposit(i + 1, {
        paySchDt: `202604${String((i % 28) + 1).padStart(2, "0")}`,
        salesAmt: String(10000 + i),
      })
    );
    postMock.mockResolvedValue({ data: { list: deposits } });
    upsertMock.mockResolvedValue({ error: null, count: 500 });

    await syncCardSettlements("biz", creds, null);

    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(upsertMock.mock.calls[0][0]).toHaveLength(500);
    expect(upsertMock.mock.calls[1][0]).toHaveLength(1);
  });

  it("sets status based on pay date vs today", async () => {
    // Far future date should be 'pending'
    postMock.mockResolvedValue({
      data: {
        list: [makeDeposit(1, { payDt: "20991231", paySchDt: "20991231" })],
      },
    });
    upsertMock.mockResolvedValue({ error: null, count: 1 });

    await syncCardSettlements("biz", creds, null);

    const row = upsertMock.mock.calls[0][0][0];
    expect(row.status).toBe("pending");
  });

  it("counts skipped on upsert error", async () => {
    postMock.mockResolvedValue({
      data: { list: [makeDeposit(1), makeDeposit(2)] },
    });
    upsertMock.mockResolvedValue({
      error: { message: "constraint violation" },
      count: null,
    });

    const result = await syncCardSettlements("biz", creds, null);
    expect(result.skippedCount).toBe(2);
    expect(result.upsertedCount).toBe(0);
  });
});

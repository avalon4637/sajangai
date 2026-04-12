import { describe, it, expect, vi, beforeEach } from "vitest";
import type { HyphenOrderItem } from "./types";

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

const { syncDeliverySales } = await import("./sync-delivery");

// ─── Fixtures ───────────────────────────────────────────────────────────────

function makeOrder(n: number): HyphenOrderItem {
  return {
    storeId: "S1",
    adFee: "0",
    orderDiv: "TOUCH",
    orderDt: "20260410",
    orderTm: "120000",
    settleDt: "20260411",
    orderNo: `ORD-${String(n).padStart(4, "0")}`,
    orderName: `주문 ${n}`,
    deliveryType: "DELIVERY",
    totalAmt: "15000",
    discntAmt: "0",
    orderFee: "1500",
    cardFee: "300",
    deliveryAmt: "3000",
    addTax: "0",
    settleAmt: "13200",
    detailList: [],
  };
}

describe("syncDeliverySales", () => {
  const creds = { userId: "test", userPw: "pass" };

  beforeEach(() => {
    vi.clearAllMocks();
    upsertMock.mockResolvedValue({ error: null, count: 0 });
  });

  it("returns early when no credentials", async () => {
    const result = await syncDeliverySales("biz", "baemin", undefined, null);
    expect(result).toEqual({
      platform: "baemin",
      salesCount: 0,
      skippedCount: 0,
    });
    expect(postMock).not.toHaveBeenCalled();
  });

  it("returns early when API returns empty list", async () => {
    postMock.mockResolvedValue({ data: { touchOrderList: [] } });

    const result = await syncDeliverySales("biz", "baemin", creds, null);
    expect(result.salesCount).toBe(0);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("calls upsert with onConflict external_id dedup key", async () => {
    postMock.mockResolvedValue({
      data: { touchOrderList: [makeOrder(1)] },
    });
    upsertMock.mockResolvedValue({ error: null, count: 1 });

    await syncDeliverySales("biz-uuid", "baemin", creds, null);

    expect(fromMock).toHaveBeenCalledWith("revenues");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          business_id: "biz-uuid",
          external_id: "ORD-0001",
          channel: "배달의민족",
        }),
      ]),
      expect.objectContaining({
        onConflict: "business_id,channel,external_id",
        ignoreDuplicates: true,
      })
    );
  });

  it("splits 501 orders into 2 chunks (500 + 1)", async () => {
    const orders = Array.from({ length: 501 }, (_, i) => makeOrder(i + 1));
    postMock.mockResolvedValue({ data: { touchOrderList: orders } });
    upsertMock.mockResolvedValue({ error: null, count: 500 });

    await syncDeliverySales("biz", "coupangeats", creds, null);

    // Should have been called exactly twice: chunk of 500, then chunk of 1
    expect(upsertMock).toHaveBeenCalledTimes(2);
    const call1Rows = upsertMock.mock.calls[0][0];
    const call2Rows = upsertMock.mock.calls[1][0];
    expect(call1Rows).toHaveLength(500);
    expect(call2Rows).toHaveLength(1);
  });

  it("counts skipped on upsert error", async () => {
    postMock.mockResolvedValue({
      data: { touchOrderList: [makeOrder(1), makeOrder(2)] },
    });
    upsertMock.mockResolvedValue({
      error: { code: "42P01", message: "relation missing" },
      count: null,
    });

    const result = await syncDeliverySales("biz", "yogiyo", creds, null);
    expect(result.skippedCount).toBe(2);
    expect(result.salesCount).toBe(0);
  });

  it("returns API error in result", async () => {
    postMock.mockRejectedValue(new Error("Network timeout"));

    const result = await syncDeliverySales("biz", "baemin", creds, null);
    expect(result.error).toBe("Network timeout");
    expect(result.salesCount).toBe(0);
  });
});

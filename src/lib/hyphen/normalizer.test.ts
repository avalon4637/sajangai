import { describe, it, expect } from "vitest";
import {
  normalizeDeliveryOrder,
  normalizeCardApproval,
} from "./normalizer";
import type { HyphenOrderItem, HyphenCardApprovalItem } from "./types";

// Minimal valid order fixture
function makeOrder(overrides: Partial<HyphenOrderItem> = {}): HyphenOrderItem {
  return {
    storeId: "S1",
    adFee: "0",
    orderDiv: "TOUCH",
    orderDt: "20260410",
    orderTm: "120000",
    settleDt: "20260411",
    orderNo: "B-20260410-001",
    orderName: "비빔밥 1개",
    deliveryType: "DELIVERY",
    totalAmt: "15000",
    discntAmt: "0",
    orderFee: "1500",
    cardFee: "300",
    deliveryAmt: "3000",
    addTax: "0",
    settleAmt: "13200",
    detailList: [],
    ...overrides,
  };
}

// Minimal valid card approval fixture
function makeApproval(
  overrides: Partial<HyphenCardApprovalItem> = {}
): HyphenCardApprovalItem {
  return {
    appDt: "20260410",
    appTm: "143000",
    appNo: "12345678",
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

describe("normalizeDeliveryOrder", () => {
  it("sets external_id to orderNo", () => {
    const result = normalizeDeliveryOrder(
      makeOrder({ orderNo: "B-20260410-001" }),
      "biz-uuid",
      "baemin"
    );
    expect(result.external_id).toBe("B-20260410-001");
  });

  it("sets external_id to null when orderNo is empty", () => {
    const result = normalizeDeliveryOrder(
      makeOrder({ orderNo: "" }),
      "biz-uuid",
      "coupangeats"
    );
    expect(result.external_id).toBeNull();
  });

  it("maps platform to correct channel name", () => {
    const baemin = normalizeDeliveryOrder(makeOrder(), "biz", "baemin");
    const coupang = normalizeDeliveryOrder(makeOrder(), "biz", "coupangeats");
    const yogiyo = normalizeDeliveryOrder(makeOrder(), "biz", "yogiyo");

    expect(baemin.channel).toBe("배달의민족");
    expect(coupang.channel).toBe("쿠팡이츠");
    expect(yogiyo.channel).toBe("요기요");
  });

  it("uses settleAmt (after fees) as amount", () => {
    const result = normalizeDeliveryOrder(
      makeOrder({ settleAmt: "13200", totalAmt: "15000" }),
      "biz",
      "baemin"
    );
    expect(result.amount).toBe(13200);
  });

  it("falls back to totalAmt when settleAmt is 0", () => {
    const result = normalizeDeliveryOrder(
      makeOrder({ settleAmt: "0", totalAmt: "15000" }),
      "biz",
      "baemin"
    );
    expect(result.amount).toBe(15000);
  });

  it("formats yyyymmdd date to yyyy-MM-dd", () => {
    const result = normalizeDeliveryOrder(
      makeOrder({ orderDt: "20260315" }),
      "biz",
      "baemin"
    );
    expect(result.date).toBe("2026-03-15");
  });

  it("includes fee info in memo when present", () => {
    const result = normalizeDeliveryOrder(
      makeOrder({ orderFee: "1500", orderName: "비빔밥", orderNo: "ORD-1" }),
      "biz",
      "baemin"
    );
    expect(result.memo).toContain("수수료");
    expect(result.memo).toContain("1,500");
  });
});

describe("normalizeCardApproval", () => {
  it("sets external_id to appNo", () => {
    const result = normalizeCardApproval(
      makeApproval({ appNo: "12345678" }),
      "biz-uuid",
      "신한카드"
    );
    expect(result.external_id).toBe("12345678");
  });

  it("sets external_id to null when appNo is empty", () => {
    const result = normalizeCardApproval(
      makeApproval({ appNo: "" }),
      "biz-uuid",
      "신한카드"
    );
    expect(result.external_id).toBeNull();
  });

  it("sets channel to 카드", () => {
    const result = normalizeCardApproval(makeApproval(), "biz", "삼성카드");
    expect(result.channel).toBe("카드");
  });

  it("sets category to 카드매출", () => {
    const result = normalizeCardApproval(makeApproval(), "biz", "신한카드");
    expect(result.category).toBe("카드매출");
  });

  it("parses appAmt as amount", () => {
    const result = normalizeCardApproval(
      makeApproval({ appAmt: "25000" }),
      "biz",
      "신한카드"
    );
    expect(result.amount).toBe(25000);
  });

  it("handles comma-formatted amounts", () => {
    const result = normalizeCardApproval(
      makeApproval({ appAmt: "1,250,000" }),
      "biz",
      "신한카드"
    );
    expect(result.amount).toBe(1250000);
  });

  it("includes card company and appNo in memo", () => {
    const result = normalizeCardApproval(
      makeApproval({ appNo: "99887766" }),
      "biz",
      "삼성카드"
    );
    expect(result.memo).toContain("삼성카드");
    expect(result.memo).toContain("99887766");
  });

  it("includes installment info when instMon > 1", () => {
    const result = normalizeCardApproval(
      makeApproval({ instMon: "3" }),
      "biz",
      "신한카드"
    );
    expect(result.memo).toContain("3개월 할부");
  });
});

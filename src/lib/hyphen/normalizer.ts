// Hyphen API response normalizers
// Maps actual Hyphen API response fields to internal database formats

import type { InsertTables } from "@/types/database";
import type {
  DeliveryPlatform,
  HyphenReviewItem,
  HyphenOrderItem,
  HyphenCardApprovalItem,
  HyphenCardDepositItem,
} from "./types";

type RevenueInsert = InsertTables<"revenues">;
type DeliveryReviewInsert = InsertTables<"delivery_reviews">;

export type { DeliveryPlatform };

// ---------------------------------------------------------------------------
// Delivery order → revenues table
// ---------------------------------------------------------------------------

export function normalizeDeliveryOrder(
  order: HyphenOrderItem,
  businessId: string,
  platform: DeliveryPlatform
): RevenueInsert {
  // Convert yyyymmdd to yyyy-MM-dd
  const rawDate = order.orderDt || order.settleDt || "";
  const date = formatHyphenDate(rawDate);

  // Use settlement amount (after fees), fallback to total amount
  const amount = parseNum(order.settleAmt) || parseNum(order.totalAmt);

  const feeInfo = parseNum(order.orderFee)
    ? `수수료: ${parseNum(order.orderFee).toLocaleString()}원`
    : null;

  const memo = [
    order.orderName || null,
    order.orderNo ? `주문번호: ${order.orderNo}` : null,
    feeInfo,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    business_id: businessId,
    date,
    channel: platformToChannel(platform),
    category: "배달매출",
    amount: Math.round(amount),
    memo: memo || null,
  };
}

// ---------------------------------------------------------------------------
// Delivery review → delivery_reviews table
// ---------------------------------------------------------------------------

export function normalizeDeliveryReview(
  review: HyphenReviewItem,
  businessId: string,
  platform: DeliveryPlatform
): DeliveryReviewInsert {
  // Combine reviewDt + reviewTm → ISO datetime
  const datePart = formatHyphenDate(review.reviewDt);
  const timePart = review.reviewTm
    ? `${review.reviewTm.slice(0, 2)}:${review.reviewTm.slice(2, 4)}:${review.reviewTm.slice(4, 6)}`
    : "00:00:00";
  const reviewDate = `${datePart}T${timePart}+09:00`;

  return {
    business_id: businessId,
    platform,
    external_id: review.orderReviewId || review.reviewId || null,
    rating: clampRating(parseInt(review.allStar, 10) || 3),
    content: review.comment || null,
    customer_name: null, // Not provided in actual API
    order_summary: review.jumun || null,
    review_date: reviewDate,
    ai_reply: review.ownerReply || null,
    reply_status: review.ownerReply ? "published" : "pending",
    sentiment_score: null,
    keywords: null,
  };
}

// ---------------------------------------------------------------------------
// Card approval → revenues table
// ---------------------------------------------------------------------------

export function normalizeCardApproval(
  approval: HyphenCardApprovalItem,
  businessId: string,
  cardCompanyName: string
): RevenueInsert {
  const date = formatHyphenDate(approval.appDt);
  const amount = parseNum(approval.appAmt);

  const memo = [
    cardCompanyName || null,
    approval.appNo ? `승인번호: ${approval.appNo}` : null,
    approval.useCard || null,
    parseInt(approval.instMon, 10) > 1
      ? `${approval.instMon}개월 할부`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    business_id: businessId,
    date,
    channel: "카드",
    category: "카드매출",
    amount: Math.round(amount),
    memo: memo || null,
  };
}

// ---------------------------------------------------------------------------
// Card deposit → for cash flow prediction (not stored as revenue)
// ---------------------------------------------------------------------------

export interface NormalizedCardDeposit {
  payDate: string;
  payScheduledDate: string;
  salesAmount: number;
  payAmount: number;
  feeTotal: number;
  cardCompany: string;
  transactionCount: number;
}

export function normalizeCardDeposit(
  deposit: HyphenCardDepositItem
): NormalizedCardDeposit {
  return {
    payDate: formatHyphenDate(deposit.payDt),
    payScheduledDate: formatHyphenDate(deposit.paySchDt),
    salesAmount: parseNum(deposit.salesAmt),
    payAmount: parseNum(deposit.payAmt),
    feeTotal: parseNum(deposit.feeSum),
    cardCompany: deposit.useCard || "",
    transactionCount: parseInt(deposit.totalCnt, 10) || 0,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function platformToChannel(platform: DeliveryPlatform): string {
  const map: Record<DeliveryPlatform, string> = {
    baemin: "배달의민족",
    coupangeats: "쿠팡이츠",
    yogiyo: "요기요",
  };
  return map[platform];
}

function clampRating(rating: number): number {
  return Math.max(1, Math.min(5, Math.round(rating)));
}

/** Convert yyyymmdd string to yyyy-MM-dd */
function formatHyphenDate(raw: string): string {
  if (!raw || raw.length < 8) return new Date().toISOString().slice(0, 10);
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

/** Parse numeric string to number (handles comma-formatted strings) */
function parseNum(value: string | number | undefined): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return value;
  return parseInt(value.replace(/,/g, ""), 10) || 0;
}

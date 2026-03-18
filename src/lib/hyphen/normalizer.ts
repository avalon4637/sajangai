// Hyphen API response normalizers
// Maps raw Hyphen API responses to internal database formats

import type { InsertTables } from "@/types/database";

/** Revenue insert type */
type RevenueInsert = InsertTables<"revenues">;

/** Delivery review insert type */
type DeliveryReviewInsert = InsertTables<"delivery_reviews">;

/** Platform identifier for delivery apps */
export type DeliveryPlatform = "baemin" | "coupangeats" | "yogiyo";

// ---------------------------------------------------------------------------
// Hyphen raw response types (based on Hyphen API documentation structure)
// These represent the expected API response shapes
// ---------------------------------------------------------------------------

/** Hyphen delivery sales order item */
export interface HyphenDeliverySale {
  orderId?: string;
  orderDate?: string;
  orderDatetime?: string;
  settlementDate?: string;
  totalAmount?: number;
  orderAmount?: number;
  deliveryFee?: number;
  commissionFee?: number;
  commissionRate?: number;
  netAmount?: number;
  menuName?: string;
  storeName?: string;
  status?: string;
  cancelledAt?: string | null;
}

/** Hyphen card approval record */
export interface HyphenCardApproval {
  approvalNo?: string;
  approvalDate?: string;
  approvalDatetime?: string;
  cardCompany?: string;
  cardNo?: string;
  approvalAmount?: number;
  merchantName?: string;
  installments?: number;
  isCancelled?: boolean;
  cancelledAt?: string | null;
}

/** Hyphen card settlement record */
export interface HyphenCardSettlement {
  settlementDate?: string;
  cardCompany?: string;
  totalAmount?: number;
  feeAmount?: number;
  netAmount?: number;
  transactionCount?: number;
}

/** Hyphen delivery review item */
export interface HyphenReview {
  reviewId?: string;
  orderId?: string;
  reviewDate?: string;
  reviewDatetime?: string;
  rating?: number;
  content?: string;
  customerName?: string;
  customerNickname?: string;
  orderSummary?: string;
  menuName?: string;
  ownerReply?: string;
  isReplied?: boolean;
}

// ---------------------------------------------------------------------------
// Normalizer functions
// ---------------------------------------------------------------------------

/**
 * Normalize a Hyphen delivery sale to the revenues table format.
 * Handles null/missing fields gracefully with sensible defaults.
 *
 * @param sale - Raw Hyphen delivery sale response
 * @param businessId - Target business ID
 * @param platform - Delivery platform identifier
 * @returns Revenue insert record
 */
export function normalizeDeliverySale(
  sale: HyphenDeliverySale,
  businessId: string,
  platform: DeliveryPlatform
): RevenueInsert {
  // Prefer settlement date for financial records, fall back to order date
  const rawDate =
    sale.settlementDate ??
    sale.orderDatetime?.slice(0, 10) ??
    sale.orderDate ??
    new Date().toISOString().slice(0, 10);

  // Normalize to YYYY-MM-DD
  const date = rawDate.slice(0, 10);

  // Use net amount if available, otherwise total order amount
  const amount = sale.netAmount ?? sale.orderAmount ?? sale.totalAmount ?? 0;

  // Build memo with commission metadata
  const commissionInfo =
    sale.commissionFee != null
      ? `수수료: ${sale.commissionFee.toLocaleString()}원`
      : sale.commissionRate != null
        ? `수수료율: ${(sale.commissionRate * 100).toFixed(1)}%`
        : null;

  const memo = [
    sale.menuName ?? null,
    sale.orderId ? `주문번호: ${sale.orderId}` : null,
    commissionInfo,
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

/**
 * Normalize a Hyphen card approval to the revenues table format.
 *
 * @param approval - Raw Hyphen card approval response
 * @param businessId - Target business ID
 * @returns Revenue insert record
 */
export function normalizeCardSale(
  approval: HyphenCardApproval,
  businessId: string
): RevenueInsert {
  const rawDate =
    approval.approvalDatetime?.slice(0, 10) ??
    approval.approvalDate ??
    new Date().toISOString().slice(0, 10);

  const date = rawDate.slice(0, 10);
  const amount = approval.approvalAmount ?? 0;

  const memo = [
    approval.cardCompany ?? null,
    approval.approvalNo ? `승인번호: ${approval.approvalNo}` : null,
    approval.installments && approval.installments > 1
      ? `${approval.installments}개월 할부`
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

/**
 * Normalize a Hyphen delivery review to the delivery_reviews table format.
 *
 * @param review - Raw Hyphen review response
 * @param businessId - Target business ID
 * @param platform - Delivery platform identifier
 * @returns DeliveryReview insert record
 */
export function normalizeReview(
  review: HyphenReview,
  businessId: string,
  platform: DeliveryPlatform
): DeliveryReviewInsert {
  const rawDate =
    review.reviewDatetime ??
    review.reviewDate ??
    new Date().toISOString();

  // Ensure ISO format for timestamptz
  const reviewDate = rawDate.includes("T")
    ? rawDate
    : `${rawDate}T00:00:00+09:00`;

  return {
    business_id: businessId,
    platform,
    external_id: review.reviewId ?? review.orderId ?? null,
    rating: clampRating(review.rating ?? 3),
    content: review.content ?? null,
    customer_name: review.customerName ?? review.customerNickname ?? null,
    order_summary: review.orderSummary ?? review.menuName ?? null,
    review_date: reviewDate,
    ai_reply: null,
    reply_status: "pending",
    sentiment_score: null,
    keywords: null,
  };
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Map delivery platform to revenue channel name */
function platformToChannel(platform: DeliveryPlatform): string {
  const channelMap: Record<DeliveryPlatform, string> = {
    baemin: "배달의민족",
    coupangeats: "쿠팡이츠",
    yogiyo: "요기요",
  };
  return channelMap[platform];
}

/** Clamp rating to valid range 1-5 */
function clampRating(rating: number): number {
  return Math.max(1, Math.min(5, Math.round(rating)));
}

// Review query functions
// Database access layer for delivery_reviews table
// Provides filtering, updating, and aggregation for the Dapjangi review system

import { createClient } from "@/lib/supabase/server";

export interface DeliveryReview {
  id: string;
  businessId: string;
  platform: string;
  externalId: string | null;
  rating: number;
  content: string | null;
  customerName: string | null;
  orderSummary: string | null;
  reviewDate: string;
  aiReply: string | null;
  replyStatus: string;
  sentimentScore: number | null;
  keywords: string[];
  repliedAt: string | null;
  syncedAt: string;
  createdAt: string;
}

export interface ReviewFilterOptions {
  platform?: string;
  replyStatus?: string;
  minRating?: number;
  maxRating?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface ReviewStats {
  totalCount: number;
  avgRating: number;
  avgSentiment: number | null;
  ratingDistribution: Record<number, number>;
  platformBreakdown: Record<string, number>;
  replyStatusBreakdown: Record<string, number>;
}

/**
 * Get reviews for a business with optional filtering.
 *
 * @param businessId - UUID of the business
 * @param options - Filter and pagination options
 * @returns Array of DeliveryReview
 */
export async function getReviews(
  businessId: string,
  options: ReviewFilterOptions = {}
): Promise<DeliveryReview[]> {
  const supabase = await createClient();

  let query = supabase
    .from("delivery_reviews")
    .select("*")
    .eq("business_id", businessId);

  if (options.platform) {
    query = query.eq("platform", options.platform as "baemin" | "coupangeats" | "yogiyo");
  }

  if (options.replyStatus) {
    query = query.eq(
      "reply_status",
      options.replyStatus as "pending" | "auto_published" | "draft" | "published" | "skipped"
    );
  }

  if (options.minRating !== undefined) {
    query = query.gte("rating", options.minRating);
  }

  if (options.maxRating !== undefined) {
    query = query.lte("rating", options.maxRating);
  }

  if (options.dateFrom) {
    query = query.gte("review_date", options.dateFrom);
  }

  if (options.dateTo) {
    query = query.lte("review_date", options.dateTo);
  }

  query = query
    .order("review_date", { ascending: false })
    .limit(options.limit ?? 50)
    .range(
      options.offset ?? 0,
      (options.offset ?? 0) + (options.limit ?? 50) - 1
    );

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map(mapReviewRow);
}

/**
 * Get reviews that have not yet been processed by the AI reply system.
 * Unprocessed = ai_reply is null AND reply_status is 'pending'.
 *
 * @param businessId - UUID of the business
 * @returns Array of unprocessed DeliveryReview
 */
export async function getUnprocessedReviews(
  businessId: string
): Promise<DeliveryReview[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_reviews")
    .select("*")
    .eq("business_id", businessId)
    .is("ai_reply", null)
    .eq("reply_status", "pending")
    .order("review_date", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map(mapReviewRow);
}

/**
 * Update a review with its AI-generated reply and status.
 *
 * @param reviewId - UUID of the review to update
 * @param aiReply - Generated reply text
 * @param replyStatus - New status (auto_published | draft | published | skipped)
 */
export async function updateReviewReply(
  reviewId: string,
  aiReply: string,
  replyStatus: "auto_published" | "draft" | "published" | "skipped"
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_reviews")
    .update({
      ai_reply: aiReply,
      reply_status: replyStatus,
    })
    .eq("id", reviewId);

  if (error) {
    throw new Error(`리뷰 답글 업데이트 실패: ${error.message}`);
  }
}

/**
 * Get aggregate review statistics for a business and time period.
 *
 * @param businessId - UUID of the business
 * @param yearMonth - Period in YYYY-MM format (e.g., "2026-03")
 * @returns ReviewStats aggregate data
 */
export async function getReviewStats(
  businessId: string,
  yearMonth: string
): Promise<ReviewStats> {
  const supabase = await createClient();

  const startDate = `${yearMonth}-01`;
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("delivery_reviews")
    .select("rating, sentiment_score, platform, reply_status")
    .eq("business_id", businessId)
    .gte("review_date", startDate)
    .lte("review_date", endDate);

  if (error || !data || data.length === 0) {
    return {
      totalCount: 0,
      avgRating: 0,
      avgSentiment: null,
      ratingDistribution: {},
      platformBreakdown: {},
      replyStatusBreakdown: {},
    };
  }

  const totalCount = data.length;
  const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / totalCount;

  const sentimentScores = data
    .filter((r): r is typeof r & { sentiment_score: number } => r.sentiment_score !== null);
  const avgSentiment =
    sentimentScores.length > 0
      ? sentimentScores.reduce((sum, r) => sum + r.sentiment_score, 0) / sentimentScores.length
      : null;

  // Build distribution maps
  const ratingDistribution: Record<number, number> = {};
  const platformBreakdown: Record<string, number> = {};
  const replyStatusBreakdown: Record<string, number> = {};

  data.forEach((review) => {
    ratingDistribution[review.rating] =
      (ratingDistribution[review.rating] ?? 0) + 1;
    platformBreakdown[review.platform] =
      (platformBreakdown[review.platform] ?? 0) + 1;
    replyStatusBreakdown[review.reply_status] =
      (replyStatusBreakdown[review.reply_status] ?? 0) + 1;
  });

  return {
    totalCount,
    avgRating,
    avgSentiment,
    ratingDistribution,
    platformBreakdown,
    replyStatusBreakdown,
  };
}

// Map database row to typed DeliveryReview
function mapReviewRow(row: Record<string, unknown>): DeliveryReview {
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    platform: row.platform as string,
    externalId: row.external_id as string | null,
    rating: row.rating as number,
    content: row.content as string | null,
    customerName: row.customer_name as string | null,
    orderSummary: row.order_summary as string | null,
    reviewDate: row.review_date as string,
    aiReply: row.ai_reply as string | null,
    replyStatus: row.reply_status as string,
    sentimentScore: row.sentiment_score as number | null,
    keywords: (row.keywords as string[]) ?? [],
    repliedAt: (row.replied_at as string | null) ?? null,
    syncedAt: row.synced_at as string,
    createdAt: row.created_at as string,
  };
}

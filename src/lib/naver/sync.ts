// Naver Place review sync module
// Saves crawled reviews to delivery_reviews table with platform='naver_place'
// Deduplicates by external_id to avoid duplicate entries

import { createClient } from "@/lib/supabase/server";
import { crawlNaverReviews } from "./crawler";
import type { NaverReview, SyncResult } from "./types";

/**
 * Sync Naver Place reviews for a business.
 * Crawls reviews, deduplicates against existing data, and inserts new ones.
 *
 * @param businessId - UUID of the business
 * @param placeId - Naver Place restaurant ID (numeric string)
 * @returns SyncResult with counts and status
 */
export async function syncNaverReviews(
  businessId: string,
  placeId: string
): Promise<SyncResult> {
  const supabase = await createClient();

  try {
    // Crawl reviews from Naver Place
    const crawlResult = await crawlNaverReviews(placeId);

    if (crawlResult.error) {
      return {
        success: false,
        newReviews: 0,
        totalReviews: 0,
        error: crawlResult.error,
      };
    }

    if (crawlResult.reviews.length === 0) {
      // Update last synced timestamp even if no reviews found
      await supabase
        .from("businesses")
        .update({ naver_last_synced_at: new Date().toISOString() })
        .eq("id", businessId);

      return {
        success: true,
        newReviews: 0,
        totalReviews: 0,
      };
    }

    // Fetch existing external_ids to deduplicate
    const { data: existingReviews } = await supabase
      .from("delivery_reviews")
      .select("external_id")
      .eq("business_id", businessId)
      .eq("platform", "naver_place");

    const existingIds = new Set(
      existingReviews?.map((r) => r.external_id) ?? []
    );

    // Filter out already-stored reviews
    const newReviews = crawlResult.reviews.filter(
      (r) => !existingIds.has(r.externalId)
    );

    // Insert new reviews
    if (newReviews.length > 0) {
      const rows = newReviews.map((review: NaverReview) => ({
        business_id: businessId,
        platform: "naver_place" as const,
        external_id: review.externalId,
        rating: review.rating,
        content: review.content,
        customer_name: review.reviewerName,
        review_date: review.reviewDate,
        reply_status: "pending" as const,
        synced_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("delivery_reviews")
        .insert(rows);

      if (insertError) {
        console.error("[NaverSync] Insert error:", insertError.message);
        return {
          success: false,
          newReviews: 0,
          totalReviews: existingIds.size,
          error: insertError.message,
        };
      }
    }

    // Update last synced timestamp on business
    await supabase
      .from("businesses")
      .update({ naver_last_synced_at: new Date().toISOString() })
      .eq("id", businessId);

    const totalReviews = existingIds.size + newReviews.length;

    return {
      success: true,
      newReviews: newReviews.length,
      totalReviews,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[NaverSync] Sync failed:", message);

    return {
      success: false,
      newReviews: 0,
      totalReviews: 0,
      error: message,
    };
  }
}

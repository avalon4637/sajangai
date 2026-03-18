// Dapjangi Engine Orchestrator
// Main entry point for the AI review management system
// Coordinates voice profile, reply generation, sentiment analysis, and caching

import { createClient } from "@/lib/supabase/server";
import { getOrCreateVoiceProfile } from "./brand-voice";
import { generateRepliesBatch, type ReviewInput } from "./review-responder";
import { analyzeReviewBatch } from "./sentiment-analyzer";

// @MX:ANCHOR: Main Dapjangi orchestration entry point - called by API route /api/dapjangi/process
// @MX:REASON: Fan-in from API route (POST) and future scheduler/webhook

export interface DapjangiProcessSummary {
  processed: number;
  autoPublished: number;
  drafts: number;
  urgent: number;
  errors: number;
}

interface UnprocessedReview {
  id: string;
  rating: number;
  content: string | null;
  order_summary: string | null;
  platform: string;
}

/**
 * Process all unprocessed reviews for a business.
 * Orchestrates: voice profile -> reply generation -> sentiment analysis -> DB update.
 *
 * Steps:
 * 1. Fetch unprocessed reviews (where ai_reply is null)
 * 2. Get or create voice profile
 * 3. Generate replies for each review (batched)
 * 4. Run sentiment analysis on batch
 * 5. Update reviews with ai_reply, sentiment_score, keywords
 * 6. Store summary in daily_reports
 * 7. Return summary stats
 *
 * @param businessId - UUID of the business to process
 * @returns Processing summary with counts
 */
export async function processNewReviews(
  businessId: string
): Promise<DapjangiProcessSummary> {
  const supabase = await createClient();

  // Step 1: Fetch unprocessed reviews
  const { data: rawReviews, error: fetchError } = await supabase
    .from("delivery_reviews")
    .select("id, rating, content, order_summary, platform")
    .eq("business_id", businessId)
    .is("ai_reply", null)
    .eq("reply_status", "pending")
    .order("review_date", { ascending: false })
    .limit(50);

  if (fetchError || !rawReviews || rawReviews.length === 0) {
    return { processed: 0, autoPublished: 0, drafts: 0, urgent: 0, errors: 0 };
  }

  const reviews: UnprocessedReview[] = rawReviews;

  // Step 2: Get or create voice profile
  const voiceProfile = await getOrCreateVoiceProfile(businessId);

  // Step 3: Generate replies for all reviews
  const reviewInputs: ReviewInput[] = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    content: r.content,
    orderSummary: r.order_summary,
    platform: r.platform,
  }));

  const replyResults = await generateRepliesBatch(reviewInputs, voiceProfile);

  // Step 4: Run sentiment analysis on all reviews
  const sentimentResults = await analyzeReviewBatch(
    reviews.map((r) => ({ id: r.id, rating: r.rating, content: r.content }))
  );

  // Build sentiment lookup map
  const sentimentMap = new Map(
    sentimentResults.results.map((r) => [r.id, r])
  );

  // Step 5: Update reviews with AI data and count stats
  let autoPublished = 0;
  let drafts = 0;
  let urgent = 0;
  let errors = 0;

  const updatePromises = reviews.map(async (review) => {
    const replyResult = replyResults.get(review.id);
    const sentiment = sentimentMap.get(review.id);

    if (!replyResult) {
      errors++;
      return;
    }

    const { error: updateError } = await supabase
      .from("delivery_reviews")
      .update({
        ai_reply: replyResult.reply,
        reply_status: replyResult.replyStatus,
        sentiment_score: sentiment?.sentimentScore ?? null,
        keywords: sentiment?.keywords ?? [],
      })
      .eq("id", review.id);

    if (updateError) {
      errors++;
      return;
    }

    if (replyResult.replyStatus === "auto_published") {
      autoPublished++;
    } else {
      drafts++;
    }

    if (replyResult.isUrgent) {
      urgent++;
    }
  });

  await Promise.all(updatePromises);

  const summary: DapjangiProcessSummary = {
    processed: reviews.length - errors,
    autoPublished,
    drafts,
    urgent,
    errors,
  };

  // Step 6: Store daily report
  await saveDapjangiReport(businessId, summary, sentimentResults.trends);

  return summary;
}

/**
 * Persist dapjangi processing results to daily_reports table.
 * Uses upsert to allow re-processing on the same day.
 */
async function saveDapjangiReport(
  businessId: string,
  summary: DapjangiProcessSummary,
  trends: Array<{ pattern: string; count: number; category: string }>
): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const content = {
    generatedAt: new Date().toISOString(),
    summary,
    trends,
  };

  const summaryText = `리뷰 처리 완료: 총 ${summary.processed}건 (자동발행 ${summary.autoPublished}건, 검토필요 ${summary.drafts}건, 긴급 ${summary.urgent}건)`;

  await supabase.from("daily_reports").upsert(
    {
      business_id: businessId,
      report_date: today,
      report_type: "dapjangi_review",
      content: content as unknown as Record<string, unknown>,
      summary: summaryText,
    },
    { onConflict: "business_id,report_date,report_type" }
  );
}

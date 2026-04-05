"use server";

// Server actions for batch review operations
// Used by the Dapjangi batch reply panel

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";

/**
 * Batch publish AI replies for selected reviews.
 * Updates reply_status from 'draft' to 'published' for given review IDs.
 *
 * @param reviewIds - Array of review UUIDs to publish
 * @returns Success status and count of updated reviews
 */
export async function batchPublishReplies(
  reviewIds: string[]
): Promise<{ success: boolean; count: number }> {
  if (reviewIds.length === 0) {
    return { success: false, count: 0 };
  }

  const businessId = await getCurrentBusinessId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_reviews")
    .update({ reply_status: "published" })
    .eq("business_id", businessId)
    .in("id", reviewIds)
    .in("reply_status", ["draft", "auto_published"])
    .select("id");

  if (error) {
    throw new Error(`일괄 발행 실패: ${error.message}`);
  }

  revalidatePath("/review");

  return { success: true, count: data?.length ?? 0 };
}

/**
 * Update a single review's AI reply text (edit before publishing).
 *
 * @param reviewId - UUID of the review
 * @param aiReply - Updated reply text
 */
export async function updateReviewReplyText(
  reviewId: string,
  aiReply: string
): Promise<{ success: boolean }> {
  const businessId = await getCurrentBusinessId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_reviews")
    .update({ ai_reply: aiReply })
    .eq("id", reviewId)
    .eq("business_id", businessId);

  if (error) {
    throw new Error(`답글 수정 실패: ${error.message}`);
  }

  revalidatePath("/review");

  return { success: true };
}

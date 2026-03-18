// Review Responder
// Generates AI replies for delivery reviews matching the owner's brand voice
// Routes replies by rating: 4-5 = auto-publish, 3 = draft, 1-2 = urgent draft

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { BrandVoiceProfile, VoiceTraits } from "./brand-voice";
import {
  POSITIVE_REPLY_PROMPT,
  NEUTRAL_REPLY_PROMPT,
  NEGATIVE_REPLY_PROMPT,
} from "./dapjangi-prompts";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 256; // Keep replies concise (2-4 sentences)

export type ReplyStatus = "auto_published" | "draft" | "pending";

export interface ReviewReplyResult {
  reply: string;
  replyStatus: ReplyStatus;
  isUrgent: boolean;
}

export interface ReviewInput {
  id: string;
  rating: number;
  content: string | null;
  orderSummary: string | null;
  platform: string;
}

/**
 * Format voice profile into a concise description for prompt injection.
 */
function formatVoiceProfile(traits: VoiceTraits): string {
  return `어조: ${traits.tone === "formal" ? "격식체" : traits.tone === "casual" ? "친근한 반말" : "친근한 존댓말"}
성격: ${traits.personality}
인사말 스타일: ${traits.greetingStyle}
마무리 스타일: ${traits.closingStyle}
자주 쓰는 표현: ${traits.commonExpressions.slice(0, 5).join(", ") || "없음"}`;
}

/**
 * Select prompt template and determine reply routing based on rating.
 */
function getReplyConfig(rating: number): {
  template: string;
  replyStatus: ReplyStatus;
  isUrgent: boolean;
} {
  if (rating >= 4) {
    return {
      template: POSITIVE_REPLY_PROMPT,
      replyStatus: "auto_published",
      isUrgent: false,
    };
  } else if (rating === 3) {
    return {
      template: NEUTRAL_REPLY_PROMPT,
      replyStatus: "draft",
      isUrgent: false,
    };
  } else {
    // rating 1-2: urgent draft requiring owner review
    return {
      template: NEGATIVE_REPLY_PROMPT,
      replyStatus: "draft",
      isUrgent: true,
    };
  }
}

/**
 * Build the final prompt by substituting template variables.
 */
function buildPrompt(
  template: string,
  review: ReviewInput,
  voiceProfile: string
): string {
  return template
    .replace("{VOICE_PROFILE}", voiceProfile)
    .replace("{RATING}", String(review.rating))
    .replace("{REVIEW_CONTENT}", review.content ?? "(내용 없음)")
    .replace("{ORDER_SUMMARY}", review.orderSummary ?? "(주문 정보 없음)");
}

/**
 * Generate an AI reply for a single review matching the owner's voice.
 * Routes by rating to determine auto-publish vs draft vs urgent.
 *
 * @param review - Review data including rating and content
 * @param voiceProfile - Owner's brand voice profile
 * @returns Generated reply text with status and urgency flag
 */
export async function generateReply(
  review: ReviewInput,
  voiceProfile: BrandVoiceProfile
): Promise<ReviewReplyResult> {
  const config = getReplyConfig(review.rating);
  const formattedVoice = formatVoiceProfile(voiceProfile.voiceTraits);
  const prompt = buildPrompt(config.template, review, formattedVoice);

  const anthropic = createAnthropic();
  const model = anthropic(CLAUDE_MODEL);

  const { text } = await generateText({
    model,
    prompt,
    maxOutputTokens: MAX_TOKENS,
  });

  // Clean up reply (remove quotes if Claude wraps in quotes)
  const reply = text.trim().replace(/^["']|["']$/g, "");

  return {
    reply,
    replyStatus: config.replyStatus,
    isUrgent: config.isUrgent,
  };
}

/**
 * Generate replies for multiple reviews concurrently.
 * Limits concurrency to 3 to respect API rate limits.
 *
 * @param reviews - Array of review inputs
 * @param voiceProfile - Owner's brand voice profile
 * @returns Map of reviewId to reply result
 */
export async function generateRepliesBatch(
  reviews: ReviewInput[],
  voiceProfile: BrandVoiceProfile
): Promise<Map<string, ReviewReplyResult>> {
  const results = new Map<string, ReviewReplyResult>();

  // Process in batches of 3 to avoid rate limits
  const BATCH_SIZE = 3;
  for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
    const batch = reviews.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((review) => generateReply(review, voiceProfile))
    );

    batch.forEach((review, idx) => {
      results.set(review.id, batchResults[idx]);
    });
  }

  return results;
}

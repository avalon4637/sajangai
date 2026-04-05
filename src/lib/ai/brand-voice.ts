// Brand Voice Learner
// Analyzes owner's existing replies to extract communication style traits
// Stores extracted traits in brand_voice_profiles table for consistent AI reply generation

import { createClient } from "@/lib/supabase/server";
import { VOICE_LEARNING_PROMPT } from "./dapjangi-prompts";
import { callClaudeObject } from "./claude-client";
import { VoiceTraitsSchema } from "./schemas";

// @MX:ANCHOR: Core voice profile structure - used by review-responder and dapjangi-engine
// @MX:REASON: Fan-in from brand-voice.ts, review-responder.ts, dapjangi-engine.ts

export interface VoiceTraits {
  tone: "formal" | "friendly" | "casual";
  greetingStyle: string;
  closingStyle: string;
  commonExpressions: string[];
  avoidExpressions: string[];
  personality: string;
}

export interface BrandVoiceProfile {
  id: string;
  businessId: string;
  sampleReplies: string[];
  voiceTraits: VoiceTraits;
  tone: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_VOICE_TRAITS: VoiceTraits = {
  tone: "friendly",
  greetingStyle: "안녕하세요! 저희 가게를 찾아주셔서 감사합니다.",
  closingStyle: "다음에 또 방문해 주세요. 감사합니다!",
  commonExpressions: ["감사합니다", "소중한 리뷰 감사드립니다"],
  avoidExpressions: [],
  personality: "친절하고 따뜻한 소상공인 사장님",
};

/**
 * Analyze sample replies and extract voice traits using Claude.
 * Returns parsed VoiceTraits JSON from Claude's analysis.
 */
async function extractVoiceTraits(sampleReplies: string[]): Promise<VoiceTraits> {
  if (sampleReplies.length === 0) {
    return DEFAULT_VOICE_TRAITS;
  }

  const repliesText = sampleReplies
    .slice(0, 20)
    .map((reply, i) => `[답글 ${i + 1}]\n${reply}`)
    .join("\n\n");

  const prompt = `다음은 사장님이 직접 작성한 리뷰 답글 샘플입니다. 분석해주세요.\n\n${repliesText}`;

  try {
    return await callClaudeObject(VOICE_LEARNING_PROMPT, prompt, VoiceTraitsSchema, 512);
  } catch (error) {
    // Fall back to defaults if parsing fails
    console.error("[BrandVoice] Failed to analyze voice traits:", error);
    return DEFAULT_VOICE_TRAITS;
  }
}

/**
 * Learn voice profile from sample replies and persist to database.
 * If a profile already exists, it will be updated.
 *
 * @param businessId - UUID of the business
 * @param sampleReplies - Array of 10-20 existing reply texts to learn from
 * @returns Updated BrandVoiceProfile
 */
export async function learnVoice(
  businessId: string,
  sampleReplies: string[]
): Promise<BrandVoiceProfile> {
  const voiceTraits = await extractVoiceTraits(sampleReplies);
  const tone = voiceTraits.tone;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brand_voice_profiles")
    .upsert(
      {
        business_id: businessId,
        sample_replies: sampleReplies.slice(0, 20),
        voice_traits: voiceTraits as unknown as Record<string, unknown>,
        tone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`브랜드 보이스 저장 실패: ${error?.message}`);
  }

  return mapProfileRow(data);
}

/**
 * Retrieve cached voice profile for a business.
 * Returns null if no profile exists yet.
 *
 * @param businessId - UUID of the business
 * @returns BrandVoiceProfile or null
 */
export async function getVoiceProfile(
  businessId: string
): Promise<BrandVoiceProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brand_voice_profiles")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !data) return null;

  return mapProfileRow(data);
}

/**
 * Get or create a default voice profile for a business.
 * Falls back to DEFAULT_VOICE_TRAITS if no profile exists.
 *
 * @param businessId - UUID of the business
 * @returns BrandVoiceProfile (always returns a profile)
 */
export async function getOrCreateVoiceProfile(
  businessId: string
): Promise<BrandVoiceProfile> {
  const existing = await getVoiceProfile(businessId);
  if (existing) return existing;

  // Create default profile
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_voice_profiles")
    .insert({
      business_id: businessId,
      sample_replies: [],
      voice_traits: DEFAULT_VOICE_TRAITS as unknown as Record<string, unknown>,
      tone: DEFAULT_VOICE_TRAITS.tone,
    })
    .select("*")
    .single();

  if (error || !data) {
    // If insert fails (race condition), try fetching again
    const retry = await getVoiceProfile(businessId);
    if (retry) return retry;
    throw new Error(`기본 보이스 프로필 생성 실패: ${error?.message}`);
  }

  return mapProfileRow(data);
}

// Map database row to typed BrandVoiceProfile
function mapProfileRow(row: Record<string, unknown>): BrandVoiceProfile {
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    sampleReplies: (row.sample_replies as string[]) ?? [],
    voiceTraits: (row.voice_traits as unknown as VoiceTraits) ?? DEFAULT_VOICE_TRAITS,
    tone: (row.tone as string) ?? "friendly",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

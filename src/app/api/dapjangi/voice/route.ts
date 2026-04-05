// Dapjangi Voice Profile API Route
// GET: Retrieve current brand voice profile for the authenticated business
// POST: Train or update brand voice profile with sample replies

import { createClient } from "@/lib/supabase/server";
import { getVoiceProfile, learnVoice } from "@/lib/ai/brand-voice";
import { z } from "zod";

export const maxDuration = 60;

const TrainVoiceSchema = z.object({
  sampleReplies: z
    .array(z.string().min(1))
    .min(1, "최소 1개 이상의 샘플 답글이 필요합니다.")
    .max(20, "최대 20개까지 샘플 답글을 입력할 수 있습니다."),
});

/**
 * GET /api/dapjangi/voice
 * Returns the current brand voice profile for the authenticated user's business.
 * Returns 404 if no profile has been trained yet.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (bizError || !business) {
    return Response.json(
      { error: "사업장 정보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const profile = await getVoiceProfile(business.id);

  if (!profile) {
    return Response.json(
      { error: "아직 브랜드 보이스 프로필이 없습니다. 먼저 학습을 진행해주세요." },
      { status: 404 }
    );
  }

  return Response.json({ profile });
}

/**
 * POST /api/dapjangi/voice
 * Train or update the brand voice profile with sample reply texts.
 * Body: { sampleReplies: string[] }
 *
 * Uses Claude to extract tone, expressions, and personality from samples.
 * Stores result in brand_voice_profiles table.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (bizError || !business) {
    return Response.json(
      { error: "사업장 정보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("[API /dapjangi/voice] Failed to parse request body:", error);
    return Response.json({ error: "요청 본문을 파싱할 수 없습니다." }, { status: 400 });
  }

  const parsed = TrainVoiceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  try {
    const profile = await learnVoice(business.id, parsed.data.sampleReplies);
    return Response.json({ success: true, profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json(
      { error: `브랜드 보이스 학습 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}

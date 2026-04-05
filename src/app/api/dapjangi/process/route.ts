// Dapjangi Process API Route
// POST: Process new reviews for the current user's business
// Returns a summary of processed reviews (count, auto-published, drafts, urgent)

import { createClient } from "@/lib/supabase/server";
import { processNewReviews } from "@/lib/ai/dapjangi-engine";
import { checkRateLimit, getRateLimitKey } from "@/lib/api/rate-limit";

export const maxDuration = 120; // Allow up to 2 min for batch processing

/**
 * POST /api/dapjangi/process
 * Fetches unprocessed reviews and runs AI reply generation + sentiment analysis.
 * Idempotent: safe to call multiple times (skips already-processed reviews).
 */
export async function POST(req: Request) {
  // Rate limiting: 5 requests per minute (batch processing is expensive)
  const rlKey = getRateLimitKey(req, "dapjangi-process");
  const rl = checkRateLimit(rlKey, 5);
  if (!rl.allowed) {
    return Response.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

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

  // Get business_id for the authenticated user
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

  try {
    const summary = await processNewReviews(business.id);
    return Response.json({ success: true, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json(
      { error: `리뷰 처리 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}

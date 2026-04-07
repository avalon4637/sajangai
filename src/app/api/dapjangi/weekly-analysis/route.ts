// POST /api/dapjangi/weekly-analysis
// Manual trigger for weekly review analysis (user-initiated)
// Requires authentication and returns analysis for the current business

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { analyzeWeeklyReviews } from "@/lib/ai/review-analyzer";
import { checkRateLimit, getRateLimitKey } from "@/lib/api/rate-limit";

export const maxDuration = 120; // Allow up to 2 min for AI analysis

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "인증이 필요합니다." },
      { status: 401 }
    );
  }

  // Rate limiting: 3 requests per minute (AI-heavy endpoint)
  const rlKey = getRateLimitKey(req, "dapjangi-weekly", user.id);
  const rl = checkRateLimit(rlKey, 3);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const businessId = await getCurrentBusinessId();
    const result = await analyzeWeeklyReviews(businessId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `주간 리뷰 분석 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}

// Seri Financial Report API Route
// GET: Fetch today's seri report (from cache or generate)
// POST: Force regenerate report

import { createClient } from "@/lib/supabase/server";
import { generateSeriReport } from "@/lib/ai/seri-engine";
import { checkRateLimit, getRateLimitKey } from "@/lib/api/rate-limit";
import { z } from "zod";

export const maxDuration = 60; // Allow up to 60s for Claude API calls

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * GET /api/seri/report
 * Returns today's Seri financial report. Serves from cache if available.
 * Query params:
 *   - date: optional YYYY-MM-DD to fetch a specific date's report
 */
export async function GET(req: Request) {
  // Rate limiting: 10 requests per minute
  const rlKey = getRateLimitKey(req, "seri-report");
  const rl = checkRateLimit(rlKey, 10);
  if (!rl.allowed) {
    return Response.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "인증이 필요합니다." },
      { status: 401 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // Parse query params
  const { searchParams } = new URL(req.url);
  const queryParsed = QuerySchema.safeParse({ date: searchParams.get("date") ?? undefined });

  if (!queryParsed.success) {
    return Response.json(
      { error: "잘못된 날짜 형식입니다. YYYY-MM-DD 형식을 사용하세요." },
      { status: 400 }
    );
  }

  // Get business_id for authenticated user
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (bizError || !business) {
    return Response.json(
      { error: "등록된 사업장이 없습니다. 온보딩을 먼저 완료해주세요." },
      { status: 404 }
    );
  }

  try {
    const report = await generateSeriReport(
      business.id,
      queryParsed.data.date
    );

    return Response.json({
      success: true,
      fromCache: report.fromCache,
      report: {
        id: report.id,
        reportDate: report.reportDate,
        summary: report.summary,
        content: report.content,
        createdAt: report.createdAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[Seri Report GET] Error:", message);
    return Response.json(
      { error: `리포트 생성 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seri/report
 * Force regenerate today's Seri report (bypasses cache).
 * Request body (optional):
 *   - date: YYYY-MM-DD for a specific date
 */
export async function POST(req: Request) {
  // Rate limiting: 3 requests per minute (report generation is expensive)
  const rlKeyPost = getRateLimitKey(req, "seri-report-gen");
  const rlPost = checkRateLimit(rlKeyPost, 3);
  if (!rlPost.allowed) {
    return Response.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "인증이 필요합니다." },
      { status: 401 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // Parse body
  let date: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.date) {
      const parsed = QuerySchema.safeParse({ date: body.date });
      if (!parsed.success) {
        return Response.json(
          { error: "잘못된 날짜 형식입니다. YYYY-MM-DD 형식을 사용하세요." },
          { status: 400 }
        );
      }
      date = parsed.data.date;
    }
  } catch {
    // No body is fine
  }

  // Get business_id for authenticated user
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (bizError || !business) {
    return Response.json(
      { error: "등록된 사업장이 없습니다. 온보딩을 먼저 완료해주세요." },
      { status: 404 }
    );
  }

  try {
    const report = await generateSeriReport(
      business.id,
      date,
      true // forceRefresh = true
    );

    return Response.json({
      success: true,
      fromCache: false,
      report: {
        id: report.id,
        reportDate: report.reportDate,
        summary: report.summary,
        content: report.content,
        createdAt: report.createdAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[Seri Report POST] Error:", message);
    return Response.json(
      { error: `리포트 재생성 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}

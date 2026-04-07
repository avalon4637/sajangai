// Admin operations API - list reports and trigger operations for any business
// Protected by admin role check

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeWeeklyReviews } from "@/lib/ai/review-analyzer";
import { syncNaverReviews } from "@/lib/naver/sync";

// Helper: verify admin and return supabase client
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", status: 401 } as const;
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    return { error: "No business found", status: 403 } as const;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("business_id", business.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: "Admin only", status: 403 } as const;
  }

  return { supabase, user } as const;
}

// GET: List recent reports across all businesses
export async function GET() {
  const result = await requireAdmin();
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  const { supabase } = result;

  // Fetch recent reports (last 30 days, all businesses)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: reports, error: reportsError } = await supabase
    .from("daily_reports")
    .select("id, business_id, report_date, report_type, summary, created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(100);

  if (reportsError) {
    return NextResponse.json(
      { error: reportsError.message },
      { status: 500 }
    );
  }

  // Fetch all businesses for name mapping
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, naver_place_id, naver_last_synced_at");

  const bizMap = Object.fromEntries(
    (businesses ?? []).map((b) => [b.id, b])
  );

  const enrichedReports = (reports ?? []).map((r) => ({
    ...r,
    businessName: bizMap[r.business_id]?.name ?? "Unknown",
  }));

  return NextResponse.json({
    reports: enrichedReports,
    businesses: (businesses ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      naverPlaceId: b.naver_place_id,
      naverLastSyncedAt: b.naver_last_synced_at,
    })),
  });
}

// POST: Trigger a specific operation for a business
export async function POST(request: Request) {
  const result = await requireAdmin();
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  const { supabase } = result;

  let body: { action: string; businessId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { action, businessId } = body;

  if (!action || !businessId) {
    return NextResponse.json(
      { error: "action and businessId are required" },
      { status: 400 }
    );
  }

  // Verify business exists
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, naver_place_id")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404 }
    );
  }

  switch (action) {
    case "weekly_review": {
      const analysisResult = await analyzeWeeklyReviews(businessId);
      return NextResponse.json({
        success: analysisResult.success,
        message: analysisResult.success
          ? `주간 리뷰 분석 완료 (리뷰 ${analysisResult.reviewCount}건)`
          : `분석 실패: ${analysisResult.error}`,
        data: analysisResult,
      });
    }

    case "naver_sync": {
      if (!business.naver_place_id) {
        return NextResponse.json({
          success: false,
          message: "네이버 플레이스 ID가 설정되지 않았습니다.",
        });
      }
      try {
        const syncResult = await syncNaverReviews(
          businessId,
          business.naver_place_id
        );
        return NextResponse.json({
          success: true,
          message: `네이버 리뷰 동기화 완료 (${syncResult.newReviews ?? 0}건 추가)`,
          data: syncResult,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
          success: false,
          message: `네이버 동기화 실패: ${errorMessage}`,
        });
      }
    }

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
  }
}

// Admin operations API - list reports and trigger operations for any business
// Protected by admin role check

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeWeeklyReviews } from "@/lib/ai/review-analyzer";
import { syncNaverReviews } from "@/lib/naver/sync";
import { runSync } from "@/lib/hyphen/sync-orchestrator";
import { isHyphenConfigured } from "@/lib/hyphen/client";
import { runMorningRoutine } from "@/lib/ai/jeongjang-engine";
import { fetchRevenueReviewSnapshot } from "@/lib/insights/cross-query";
import { analyzeRevenueReviewCross } from "@/lib/ai/cross-diagnosis";
import { saveMonthlyRoiReport } from "@/lib/roi/calculator";

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

    case "generate_monthly_roi": {
      // Phase 2.3 — Calculate + persist monthly ROI report for the last
      // complete month. If today is 2026-04-12, this generates the 2026-03
      // report.
      try {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const yearMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
        const breakdown = await saveMonthlyRoiReport(businessId, yearMonth);
        return NextResponse.json({
          success: true,
          message: `${yearMonth} 월간 ROI 생성 완료 (총 가치 ${breakdown.totalValue.toLocaleString()}원, ${breakdown.roiMultiple}배 회수)`,
          data: { yearMonth, breakdown },
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
          success: false,
          message: `월간 ROI 생성 실패: ${errorMessage}`,
        });
      }
    }

    case "cross_diagnosis": {
      // Phase 1.4 — Level 3 prescriptive diagnosis for revenue x reviews.
      // Runs a DB cross-query then asks Claude Haiku for root cause + actions.
      try {
        const snapshot = await fetchRevenueReviewSnapshot(businessId);
        const diagnosis = await analyzeRevenueReviewCross(snapshot, {
          caller: "admin-operations",
        });

        if (!diagnosis) {
          return NextResponse.json({
            success: true,
            message:
              "크로스 진단 결과 유의미한 시그널이 없어요 (매출 변동 <10% + 부정 리뷰 0건)",
            data: { snapshot, diagnosis: null },
          });
        }

        // Persist the diagnosis into daily_reports for dashboard consumption.
        const { supabase: sb } = result;
        const today = new Date().toISOString().slice(0, 10);
        await sb.from("daily_reports").upsert(
          {
            business_id: businessId,
            report_date: today,
            report_type: "cross_diagnosis",
            summary: diagnosis.rootCause,
            content: {
              generatedAt: new Date().toISOString(),
              snapshot,
              diagnosis,
            } as unknown as Record<string, unknown>,
          },
          { onConflict: "business_id,report_date,report_type" }
        );

        return NextResponse.json({
          success: true,
          message: `크로스 진단 완료 (원인: ${diagnosis.rootCause.slice(0, 50)}..., 행동 ${diagnosis.actionableSteps.length}건)`,
          data: {
            snapshot,
            diagnosis,
          },
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
          success: false,
          message: `크로스 진단 실패: ${errorMessage}`,
        });
      }
    }

    case "generate_briefing": {
      // Phase 1.2 — Manual jeongjang morning routine trigger.
      // Runs the full pipeline (seri -> dapjangi -> diagnosis -> briefing)
      // and writes the result into daily_reports. The dashboard will then
      // render the new briefing via TodayBriefingCard.
      try {
        const routine = await runMorningRoutine(businessId, undefined, {
          skipMessaging: true, // don't send kakao yet — Phase 1.3 handles delivery
        });
        return NextResponse.json({
          success: true,
          message: `오늘의 브리핑 생성 완료 (세리 보고서 + 리뷰 ${routine.dapjangiSummary?.processed ?? 0}건 처리)`,
          data: {
            reportDate: routine.date,
            durationMs: routine.durationMs,
            messageSent: routine.messageSent,
            criticalAlerts: routine.criticalAlerts.length,
          },
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
          success: false,
          message: `브리핑 생성 실패: ${errorMessage}`,
        });
      }
    }

    case "hyphen_sync": {
      // Phase 1.1 — Manual Hyphen sync trigger.
      // Calls the full orchestrator which processes every active api_connection
      // (card + delivery) for the business.
      if (!isHyphenConfigured()) {
        return NextResponse.json({
          success: false,
          message:
            "하이픈 API 키가 설정되지 않았습니다. HYPHEN_USER_ID / HYPHEN_HKEY를 확인해주세요.",
        });
      }

      try {
        const result = await runSync(businessId);
        const successOps = result.operations.filter((op) => op.success);
        const failedOps = result.operations.filter((op) => !op.success);

        return NextResponse.json({
          success: !result.hasErrors,
          message: result.hasErrors
            ? `하이픈 동기화 일부 실패 (성공 ${successOps.length}건 / 실패 ${failedOps.length}건, 총 ${result.totalRecords}건 저장)`
            : `하이픈 동기화 완료 (${result.totalRecords}건 저장)`,
          data: {
            totalRecords: result.totalRecords,
            operations: result.operations,
            testMode: process.env.HYPHEN_TEST_MODE === "true",
          },
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
          success: false,
          message: `하이픈 동기화 실패: ${errorMessage}`,
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

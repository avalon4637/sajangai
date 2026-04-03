// 점장 Engine - Main Orchestrator
// Coordinates Seri, Dapjangi, proactive diagnosis, briefing, and KakaoTalk delivery
// Runs morning routine: analyze -> diagnose -> brief -> notify

import { generateSeriReport, type SeriReport } from "./seri-engine";
import { processNewReviews, type DapjangiProcessSummary } from "./dapjangi-engine";
import {
  generateDailyBriefing,
  type DailyBriefing,
} from "./briefing-generator";
import { diagnose, type DiagnosisResult } from "./proactive-diagnosis";
import { evaluateInsights, type EngineResult } from "@/lib/insights/engine";
import { runViralAnalysis, type ViralAnalysis } from "./viral-engine";
import { sendDailyBriefing, sendUrgentAlert, sendInsightAlert } from "@/lib/messaging/sender";
import { getUserProfile } from "@/lib/queries/user-profile";
import { createClient } from "@/lib/supabase/server";

// @MX:ANCHOR: Morning routine entry point - called by scheduler and API route
// @MX:REASON: Fan-in from /api/jeongjang/morning-routine and future cron trigger
export interface MorningRoutineResult {
  businessId: string;
  date: string;
  seriReport: SeriReport;
  dapjangiSummary: DapjangiProcessSummary;
  diagnosis: DiagnosisResult;
  insights: EngineResult;
  viralAnalysis: ViralAnalysis;
  briefing: DailyBriefing;
  messageSent: boolean;
  messageChannel: "alimtalk" | "sms" | "none";
  criticalAlerts: string[];
  durationMs: number;
}

/**
 * Save Seri and Dapjangi results to store_context table.
 * Enables the supervisor (점장) to read all specialist contexts in one place.
 */
async function saveSubAgentContexts(
  businessId: string,
  seriReport: SeriReport,
  dapjangiSummary: DapjangiProcessSummary
): Promise<void> {
  const supabase = await createClient();

  const seriContext = {
    yearMonth: seriReport.content.yearMonth,
    generatedAt: seriReport.content.generatedAt,
    grossRevenue: seriReport.content.profit.grossRevenue,
    netProfit: seriReport.content.profit.netProfit,
    profitMargin: seriReport.content.profit.profitMargin,
    cashFlowRisk: seriReport.content.cashFlow.overallRisk,
    dailySummary: seriReport.content.narratives.dailySummary,
  };

  const dapjangiContext = {
    processed: dapjangiSummary.processed,
    autoPublished: dapjangiSummary.autoPublished,
    drafts: dapjangiSummary.drafts,
    urgent: dapjangiSummary.urgent,
    errors: dapjangiSummary.errors,
    updatedAt: new Date().toISOString(),
  };

  // Upsert both contexts concurrently
  await Promise.all([
    supabase.from("store_context").upsert(
      {
        business_id: businessId,
        agent_type: "seri",
        context_data: seriContext as unknown as Record<string, unknown>,
        summary: seriReport.summary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id,agent_type" }
    ),
    supabase.from("store_context").upsert(
      {
        business_id: businessId,
        agent_type: "dapjangi",
        context_data: dapjangiContext as unknown as Record<string, unknown>,
        summary: `리뷰 처리 완료: 총 ${dapjangiSummary.processed}건 (긴급 ${dapjangiSummary.urgent}건)`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id,agent_type" }
    ),
  ]).catch((err) => {
    console.error("[점장] store_context 저장 실패:", err);
  });
}

/**
 * Save critical/warning diagnoses to agent_memory as insights.
 * Importance: critical=9, warning=7, info=5.
 */
async function saveDiagnosisToMemory(
  businessId: string,
  diagnosis: DiagnosisResult
): Promise<void> {
  const supabase = await createClient();
  const importantDiagnoses = diagnosis.diagnoses.filter(
    (d) => d.severity === "critical" || d.severity === "warning"
  );

  if (importantDiagnoses.length === 0) return;

  const memoryItems = importantDiagnoses.map((d) => ({
    business_id: businessId,
    agent_type: "manager" as const,
    memory_type: "insight" as const,
    content: `[${d.severity === "critical" ? "긴급" : "주의"}] ${d.title}: ${d.description} → ${d.recommendation}`,
    importance: d.severity === "critical" ? 9 : 7,
  }));

  const { error: memErr } = await supabase
    .from("agent_memory")
    .insert(memoryItems);
  if (memErr) {
    console.error("[점장] agent_memory 저장 실패:", memErr);
  }
}

/**
 * Check if there are urgent reviews requiring immediate notification.
 * Returns list of review IDs that need urgent alerts.
 */
async function checkUrgentReviews(
  businessId: string
): Promise<
  Array<{ id: string; rating: number; content: string | null; platform: string }>
> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("delivery_reviews")
    .select("id, rating, content, platform")
    .eq("business_id", businessId)
    .eq("reply_status", "draft")
    .lte("rating", 2)
    .order("created_at", { ascending: false })
    .limit(3);

  return data ?? [];
}

/**
 * Get business name for notification messages.
 */
async function getBusinessName(businessId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single();

  return data?.name ?? "매장";
}

/**
 * Send urgent review notifications as fire-and-forget side effects.
 * Does not block the morning routine on failure.
 */
async function sendUrgentReviewAlerts(
  businessId: string,
  businessName: string,
  urgentReviews: Array<{
    id: string;
    rating: number;
    content: string | null;
    platform: string;
  }>
): Promise<void> {
  for (const review of urgentReviews) {
    const excerpt = (review.content ?? "내용 없음").substring(0, 50);
    await sendUrgentAlert(businessId, "URGENT_REVIEW", {
      business_name: businessName,
      rating: String(review.rating),
      review_excerpt: excerpt,
      platform: review.platform,
    }).catch((err) => {
      console.error("[점장] Urgent review alert failed:", err);
    });
  }
}

/**
 * Run the full morning routine for a business.
 * Steps:
 * 1. Run Seri financial analysis (or use cached)
 * 2. Run Dapjangi review processing
 * 3. Run proactive cross-agent diagnosis
 * 4. Generate daily briefing narrative
 * 5. Send via KakaoTalk AlimTalk
 * 6. Send urgent review alerts if any
 * 7. Return complete report
 *
 * @param businessId - UUID of the business
 * @param date - ISO date string (YYYY-MM-DD), defaults to today
 * @param options - Control flags for individual steps
 */
export async function runMorningRoutine(
  businessId: string,
  date?: string,
  options: {
    skipSeri?: boolean;
    skipDapjangi?: boolean;
    skipMessaging?: boolean;
    forceRefresh?: boolean;
  } = {}
): Promise<MorningRoutineResult> {
  const startTime = Date.now();
  const reportDate = date ?? new Date().toISOString().split("T")[0];

  // Step 1 & 2: Run Seri and Dapjangi concurrently
  const [seriReport, dapjangiSummary] = await Promise.all([
    options.skipSeri
      ? generateSeriReport(businessId, reportDate, false) // use cache if available
      : generateSeriReport(businessId, reportDate, options.forceRefresh),
    options.skipDapjangi
      ? Promise.resolve<DapjangiProcessSummary>({
          processed: 0,
          autoPublished: 0,
          drafts: 0,
          urgent: 0,
          errors: 0,
        })
      : processNewReviews(businessId),
  ]);

  // Step 3: Save sub-agent results to store_context for supervisor access
  await saveSubAgentContexts(businessId, seriReport, dapjangiSummary);

  // Step 4: Run proactive diagnosis
  const diagnosis = await diagnose(businessId);

  // Step 4b: Run insight engine (5 scenarios) + viral agent concurrently
  const [insights, viralAnalysis] = await Promise.all([
    evaluateInsights(businessId).catch((err): EngineResult => {
      console.error("[점장] Insight engine error:", err);
      return { businessId, generated: [], errors: [], durationMs: 0 };
    }),
    runViralAnalysis(businessId).catch((err): ViralAnalysis => {
      console.error("[점장] Viral analysis error:", err);
      return { churnRisks: [], totalAtRisk: 0, messages: [] };
    }),
  ]);

  // Save viral context to store_context
  if (viralAnalysis.churnRisks.length > 0) {
    try {
      const supabase = await createClient();
      await supabase
        .from("store_context")
        .upsert(
          {
            business_id: businessId,
            agent_type: "viral",
            context_data: {
              churnRisks: viralAnalysis.churnRisks,
              totalAtRisk: viralAnalysis.totalAtRisk,
              messagesGenerated: viralAnalysis.messages.length,
              updatedAt: new Date().toISOString(),
            } as unknown as Record<string, unknown>,
            summary: `이탈 위험 고객 ${viralAnalysis.totalAtRisk}건 감지`,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "business_id,agent_type" }
        );
    } catch (err) {
      console.error("[점장] viral store_context 저장 실패:", err);
    }
  }

  // Step 5: Generate briefing (uses cached sub-agent reports just written)
  const briefing = await generateDailyBriefing(
    businessId,
    reportDate,
    options.forceRefresh
  );

  // Step 5b: Save important diagnoses to agent_memory
  await saveDiagnosisToMemory(businessId, diagnosis);

  // Collect critical alerts from diagnosis
  const criticalAlerts = diagnosis.diagnoses
    .filter((d) => d.severity === "critical")
    .map((d) => d.title);

  // Step 5: Send morning briefing via KakaoTalk
  let messageSent = false;
  let messageChannel: "alimtalk" | "sms" | "none" = "none";

  if (!options.skipMessaging) {
    const businessName = await getBusinessName(businessId);
    const structured = briefing.content.structured;

    const sendResult = await sendDailyBriefing(businessId, {
      businessName,
      summary: structured.oneLiner,
      revenue: structured.revenue.toLocaleString() + "원",
      reviewCount: String(structured.reviewCount),
      alert:
        criticalAlerts.length > 0
          ? criticalAlerts[0]
          : structured.alert,
    });

    messageSent = sendResult.success;
    messageChannel = sendResult.channel;

    // Step 5c: Send critical insight alerts (non-blocking)
    const criticalInsights = insights.generated.filter(
      (i) => i.severity === "critical" || i.severity === "warning"
    );
    const userProfile = await getUserProfile(businessId).catch(() => null);
    const currentHour = new Date().getHours();
    const withinActiveHours =
      currentHour >= (userProfile?.activeHoursStart ?? 7) &&
      currentHour < (userProfile?.activeHoursEnd ?? 22);

    if (criticalInsights.length > 0 && withinActiveHours) {
      for (const insight of criticalInsights.slice(0, 2)) {
        sendInsightAlert(businessId, {
          businessName,
          severity: insight.severity,
          insightTitle: insight.detection.title,
          recommendation: insight.solution.recommendation,
        }).catch((err) => console.error("[점장] Insight alert failed:", err));
      }
    }

    // Step 6: Send urgent review alerts (non-blocking)
    const urgentReviews = await checkUrgentReviews(businessId);
    if (urgentReviews.length > 0) {
      sendUrgentReviewAlerts(businessId, businessName, urgentReviews).catch(
        (err) => console.error("[점장] Urgent alerts error:", err)
      );
    }
  }

  return {
    businessId,
    date: reportDate,
    seriReport,
    dapjangiSummary,
    diagnosis,
    insights,
    viralAnalysis,
    briefing,
    messageSent,
    messageChannel,
    criticalAlerts,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Get the latest morning routine result for a business (for dashboard display).
 * Returns null if no routine has been run today.
 */
export async function getLatestBriefing(
  businessId: string
): Promise<DailyBriefing | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("business_id", businessId)
    .eq("report_date", today)
    .eq("report_type", "jeongjang_briefing")
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    businessId: data.business_id,
    date: data.report_date,
    content: data.content as unknown as DailyBriefing["content"],
    summary: data.summary ?? "",
    fromCache: true,
  };
}

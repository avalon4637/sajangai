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
import { sendDailyBriefing, sendUrgentAlert } from "@/lib/messaging/sender";
import { createClient } from "@/lib/supabase/server";

// @MX:ANCHOR: Morning routine entry point - called by scheduler and API route
// @MX:REASON: Fan-in from /api/jeongjang/morning-routine and future cron trigger
export interface MorningRoutineResult {
  businessId: string;
  date: string;
  seriReport: SeriReport;
  dapjangiSummary: DapjangiProcessSummary;
  diagnosis: DiagnosisResult;
  briefing: DailyBriefing;
  messageSent: boolean;
  messageChannel: "alimtalk" | "sms" | "none";
  criticalAlerts: string[];
  durationMs: number;
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

  // Step 3: Run proactive diagnosis
  const diagnosis = await diagnose(businessId);

  // Step 4: Generate briefing (uses cached sub-agent reports just written)
  const briefing = await generateDailyBriefing(
    businessId,
    reportDate,
    options.forceRefresh
  );

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

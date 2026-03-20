// Daily briefing generator - J1 feature
// Composes morning briefing by combining Seri (financial) and Dapjangi (review) reports
// Uses Claude to write natural Korean narrative, stores result in daily_reports

import { createClient } from "@/lib/supabase/server";
import type { SeriReportContent } from "./seri-engine";
import { BRIEFING_SYSTEM_PROMPT } from "./jeongjang-prompts";
import { callClaudeText } from "./claude-client";

export interface BriefingContent {
  generatedAt: string;
  narrative: string;
  seriSummary: string;
  dapjangiSummary: string;
  structured: {
    oneLiner: string;
    revenue: number;
    reviewCount: number;
    negativeReviewCount: number;
    alert: string;
    todayAction: string;
  };
}

export interface DailyBriefing {
  id: string;
  businessId: string;
  date: string;
  content: BriefingContent;
  summary: string;
  fromCache: boolean;
}

interface DapjangiReportContent {
  generatedAt: string;
  summary: {
    processed: number;
    autoPublished: number;
    drafts: number;
    urgent: number;
    errors: number;
  };
  trends: Array<{ pattern: string; count: number; category: string }>;
}

// @MX:ANCHOR: Central briefing cache loader - called by generateDailyBriefing
// @MX:REASON: Fan-in from generateDailyBriefing and future scheduler
async function loadCachedBriefing(
  businessId: string,
  reportDate: string
): Promise<DailyBriefing | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("business_id", businessId)
    .eq("report_date", reportDate)
    .eq("report_type", "jeongjang_briefing")
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    businessId: data.business_id,
    date: data.report_date,
    content: data.content as unknown as BriefingContent,
    summary: data.summary ?? "",
    fromCache: true,
  };
}

/**
 * Fetch the latest Seri financial report from daily_reports.
 * Returns null if no report exists for today.
 */
async function loadSeriReport(
  businessId: string,
  reportDate: string
): Promise<SeriReportContent | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("daily_reports")
    .select("content, summary")
    .eq("business_id", businessId)
    .eq("report_date", reportDate)
    .eq("report_type", "seri_profit")
    .maybeSingle();

  return data ? (data.content as unknown as SeriReportContent) : null;
}

/**
 * Fetch the latest Dapjangi review report from daily_reports.
 * Returns null if no review processing has occurred today.
 */
async function loadDapjangiReport(
  businessId: string,
  reportDate: string
): Promise<DapjangiReportContent | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("daily_reports")
    .select("content, summary")
    .eq("business_id", businessId)
    .eq("report_date", reportDate)
    .eq("report_type", "dapjangi_review")
    .maybeSingle();

  return data ? (data.content as unknown as DapjangiReportContent) : null;
}

/**
 * Build the briefing prompt by combining Seri and Dapjangi data.
 * Falls back to partial data when one sub-agent report is missing.
 */
function buildBriefingPrompt(
  seri: SeriReportContent | null,
  dapjangi: DapjangiReportContent | null,
  yearMonth: string
): string {
  const sections: string[] = [`[${yearMonth} 점장 아침 브리핑 데이터]`];

  if (seri) {
    sections.push(
      `\n[세리 재무 보고]`,
      `총매출: ${seri.profit.grossRevenue.toLocaleString()}원`,
      `순이익: ${seri.profit.netProfit.toLocaleString()}원 (이익률 ${seri.profit.profitMargin}%)`,
      `자금 상태: ${seri.cashFlow.overallRisk === "danger" ? "위험" : seri.cashFlow.overallRisk === "caution" ? "주의" : "안전"}`,
      `비용 이상: ${seri.costAnomaly.isAnomaly ? `있음 (${seri.costAnomaly.diagnosisLabel})` : "없음"}`,
      `\n세리 요약:`,
      seri.narratives.dailySummary
    );
  } else {
    sections.push(`\n[세리 재무 보고] 오늘 데이터 없음`);
  }

  if (dapjangi) {
    const s = dapjangi.summary;
    sections.push(
      `\n[답장이 리뷰 보고]`,
      `신규 처리 리뷰: ${s.processed}건`,
      `자동 발행: ${s.autoPublished}건 | 검토 필요: ${s.drafts}건 | 긴급: ${s.urgent}건`
    );
    if (dapjangi.trends.length > 0) {
      sections.push(
        `주요 트렌드:`,
        ...dapjangi.trends
          .slice(0, 3)
          .map((t) => `- ${t.pattern} (${t.count}건)`)
      );
    }
  } else {
    sections.push(`\n[답장이 리뷰 보고] 오늘 처리 없음`);
  }

  sections.push(
    `\n위 데이터를 종합하여 사장님께 간결한 아침 브리핑을 작성해주세요.`
  );

  return sections.join("\n");
}

/**
 * Extract structured fields from Claude's narrative response.
 * Uses simple heuristics since Claude is instructed to use the briefing format.
 */
function parseNarrativeToStructured(
  narrative: string,
  seri: SeriReportContent | null,
  dapjangi: DapjangiReportContent | null
): BriefingContent["structured"] {
  // Extract one-liner summary (first line after "한줄 요약:")
  const oneLinerMatch = narrative.match(/한줄 요약:\s*(.+)/);
  const oneLiner = oneLinerMatch?.[1]?.trim() ?? narrative.split("\n")[0];

  // Extract alert section
  const alertMatch = narrative.match(/주의:\s*(.+)/);
  const alert = alertMatch?.[1]?.trim() ?? "특이사항 없음";

  // Extract today action
  const actionMatch = narrative.match(/오늘의 할 일:\s*(.+)/);
  const todayAction = actionMatch?.[1]?.trim() ?? "";

  return {
    oneLiner,
    revenue: seri?.profit.grossRevenue ?? 0,
    reviewCount: dapjangi?.summary.processed ?? 0,
    negativeReviewCount: dapjangi?.summary.urgent ?? 0,
    alert,
    todayAction,
  };
}

/**
 * Generate daily morning briefing for a business.
 * Combines Seri and Dapjangi reports, uses Claude to write narrative.
 * Caches result in daily_reports (type: 'jeongjang_briefing').
 *
 * @param businessId - UUID of the business
 * @param date - ISO date string (YYYY-MM-DD), defaults to today
 * @param forceRefresh - If true, skip cache and regenerate
 */
export async function generateDailyBriefing(
  businessId: string,
  date?: string,
  forceRefresh = false
): Promise<DailyBriefing> {
  const today = new Date();
  const reportDate = date ?? today.toISOString().split("T")[0];
  const yearMonth = reportDate.substring(0, 7);

  // Check cache first
  if (!forceRefresh) {
    const cached = await loadCachedBriefing(businessId, reportDate);
    if (cached) return cached;
  }

  // Load sub-agent reports concurrently
  const [seri, dapjangi] = await Promise.all([
    loadSeriReport(businessId, reportDate),
    loadDapjangiReport(businessId, reportDate),
  ]);

  // Build and call Claude
  const prompt = buildBriefingPrompt(seri, dapjangi, yearMonth);
  const narrative = await callClaudeText(BRIEFING_SYSTEM_PROMPT, prompt);

  const structured = parseNarrativeToStructured(narrative, seri, dapjangi);

  const content: BriefingContent = {
    generatedAt: new Date().toISOString(),
    narrative,
    seriSummary: seri?.narratives.dailySummary ?? "",
    dapjangiSummary: dapjangi
      ? `리뷰 ${dapjangi.summary.processed}건 처리 완료`
      : "리뷰 없음",
    structured,
  };

  const summary = structured.oneLiner.substring(0, 200);

  // Save to daily_reports
  const supabase = await createClient();
  const { data: saved, error } = await supabase
    .from("daily_reports")
    .upsert(
      {
        business_id: businessId,
        report_date: reportDate,
        report_type: "jeongjang_briefing",
        content: content as unknown as Record<string, unknown>,
        summary,
      },
      { onConflict: "business_id,report_date,report_type" }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`브리핑 저장 실패: ${error.message}`);
  }

  return {
    id: saved.id,
    businessId,
    date: reportDate,
    content,
    summary,
    fromCache: false,
  };
}

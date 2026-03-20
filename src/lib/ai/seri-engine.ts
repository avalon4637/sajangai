// Seri Engine Orchestrator
// Runs all three analyses (profit, cashflow, cost) and synthesizes into a Korean report
// Caches results in daily_reports table to avoid redundant Claude API calls

import { createClient } from "@/lib/supabase/server";
import { calculateRealProfit, type RealProfitResult } from "./profit-calculator";
import { predictCashFlow, type CashFlowForecast } from "./cashflow-predictor";
import { detectCostAnomaly, type CostAnomalyResult } from "./cost-analyzer";
import {
  SERI_SYSTEM_PROMPT,
  buildProfitPrompt,
  buildCashFlowPrompt,
  buildCostAnomalyPrompt,
  buildSeriDailyBriefingPrompt,
} from "./seri-prompts";
import { callClaudeText } from "./claude-client";

// @MX:ANCHOR: Central Seri report generation - called by API route and future scheduler
// @MX:REASON: Fan-in from API route (GET/POST) and potential cron job triggers

export interface SeriReportContent {
  yearMonth: string;
  generatedAt: string;
  profit: RealProfitResult;
  cashFlow: CashFlowForecast;
  costAnomaly: CostAnomalyResult;
  narratives: {
    profitNarrative: string;
    cashFlowNarrative: string;
    costNarrative: string;
    dailySummary: string;
  };
}

export interface SeriReport {
  id: string;
  businessId: string;
  reportDate: string;
  content: SeriReportContent;
  summary: string;
  createdAt: string;
  fromCache: boolean;
}

/**
 * Try to load today's cached report from daily_reports table.
 * Returns null if no cache exists for the given date and type.
 */
async function loadCachedReport(
  businessId: string,
  reportDate: string
): Promise<SeriReport | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("business_id", businessId)
    .eq("report_date", reportDate)
    .eq("report_type", "seri_profit")
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    businessId: data.business_id,
    reportDate: data.report_date,
    content: data.content as unknown as SeriReportContent,
    summary: data.summary ?? "",
    createdAt: data.created_at,
    fromCache: true,
  };
}

/**
 * Persist the generated report to the daily_reports table.
 * Uses upsert to handle regeneration requests (force refresh).
 */
async function saveReport(
  businessId: string,
  reportDate: string,
  content: SeriReportContent,
  summary: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("daily_reports")
    .upsert(
      {
        business_id: businessId,
        report_date: reportDate,
        report_type: "seri_profit",
        content: content as unknown as Record<string, unknown>,
        summary,
      },
      { onConflict: "business_id,report_date,report_type" }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`리포트 저장 실패: ${error.message}`);
  }

  return data.id;
}

/**
 * Generate the full Seri financial analysis report for a business.
 * Runs all three analyses concurrently, then calls Claude for narratives.
 * Caches result in daily_reports to avoid repeated API costs.
 *
 * @param businessId - UUID of the business
 * @param date - ISO date string (YYYY-MM-DD), defaults to today
 * @param forceRefresh - If true, skip cache and regenerate
 * @returns Complete Seri report with structured data and AI narratives
 */
export async function generateSeriReport(
  businessId: string,
  date?: string,
  forceRefresh = false
): Promise<SeriReport> {
  const today = new Date();
  const reportDate = date ?? today.toISOString().split("T")[0];
  const yearMonth = reportDate.substring(0, 7); // YYYY-MM

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await loadCachedReport(businessId, reportDate);
    if (cached) return cached;
  }

  // Run all three analyses concurrently to minimize latency
  const [profit, cashFlow, costAnomaly] = await Promise.all([
    calculateRealProfit(businessId, yearMonth),
    predictCashFlow(businessId),
    detectCostAnomaly(businessId),
  ]);

  // Build prompts for each analysis
  const profitPrompt = buildProfitPrompt(profit, yearMonth);
  const cashFlowPrompt = buildCashFlowPrompt(cashFlow);
  const costPrompt = buildCostAnomalyPrompt(costAnomaly);
  const dailyPrompt = buildSeriDailyBriefingPrompt(profit, cashFlow, costAnomaly, yearMonth);

  // Call Claude for all four narratives concurrently
  const [profitNarrative, cashFlowNarrative, costNarrative, dailySummary] =
    await Promise.all([
      callClaudeText(SERI_SYSTEM_PROMPT, profitPrompt),
      callClaudeText(SERI_SYSTEM_PROMPT, cashFlowPrompt),
      callClaudeText(SERI_SYSTEM_PROMPT, costPrompt),
      callClaudeText(SERI_SYSTEM_PROMPT, dailyPrompt),
    ]);

  const content: SeriReportContent = {
    yearMonth,
    generatedAt: new Date().toISOString(),
    profit,
    cashFlow,
    costAnomaly,
    narratives: {
      profitNarrative,
      cashFlowNarrative,
      costNarrative,
      dailySummary,
    },
  };

  // Use dailySummary as the report summary (first 200 chars)
  const summary = dailySummary.substring(0, 200);

  // Save to cache
  const reportId = await saveReport(businessId, reportDate, content, summary);

  return {
    id: reportId,
    businessId,
    reportDate,
    content,
    summary,
    createdAt: new Date().toISOString(),
    fromCache: false,
  };
}

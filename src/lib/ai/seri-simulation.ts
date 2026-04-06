// Seri-Simulation Bridge
// Connects Seri's real financial data to the simulation engine
// Generates AI-recommended what-if scenarios with Korean narratives

import { createClient } from "@/lib/supabase/server";
import { type KpiInput } from "@/lib/kpi/calculator";
import {
  runSimulation,
  type SimulationParams,
  type SimulationResult,
} from "@/lib/simulation/engine";
import { callClaudeHaiku } from "./claude-client";
import {
  SIMULATION_NARRATIVE_PROMPT,
  buildSimulationPrompt,
} from "./seri-prompts";
import type { SeriReportContent } from "./seri-engine";

// @MX:ANCHOR: Bridge between Seri financial analysis and simulation engine
// @MX:REASON: Fan-in from future API routes (simulation endpoint) and Seri report enrichment

export interface SmartSimulationResult {
  /** Korean description of the scenario (e.g. "direct employee 1 more hire") */
  scenario: string;
  params: SimulationParams;
  result: SimulationResult;
  /** AI-generated Korean explanation of the simulation outcome */
  narrative: string;
  /** Priority based on current financial state */
  priority: "high" | "medium" | "low";
}

/**
 * Build KpiInput from Seri's real financial data for a business.
 * Queries current month's actual revenue, variable expenses, fixed costs, and labor.
 *
 * @param businessId - UUID of the business
 * @returns KpiInput populated from current month's financial data
 */
export async function buildKpiInputFromSeri(
  businessId: string
): Promise<KpiInput> {
  const supabase = await createClient();

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = `${yearMonth}-01`;
  const monthEnd = `${yearMonth}-31`; // Safe upper bound; DB filters correctly

  // Run all three queries concurrently for minimal latency
  const [revenueResult, expenseResult, fixedCostResult] = await Promise.all([
    // Total revenue for current month
    supabase
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", monthStart)
      .lte("date", monthEnd),

    // Variable costs (expenses) for current month
    supabase
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", monthStart)
      .lte("date", monthEnd),

    // Fixed costs including labor
    supabase
      .from("fixed_costs")
      .select("amount, is_labor")
      .eq("business_id", businessId)
      .eq("is_active", true),
  ]);

  const totalRevenue = (revenueResult.data ?? []).reduce(
    (sum, r) => sum + (r.amount ?? 0),
    0
  );

  const totalExpense = (expenseResult.data ?? []).reduce(
    (sum, e) => sum + (e.amount ?? 0),
    0
  );

  const fixedCosts = fixedCostResult.data ?? [];
  const totalFixedCost = fixedCosts.reduce(
    (sum, f) => sum + (f.amount ?? 0),
    0
  );
  const totalLaborCost = fixedCosts
    .filter((f) => f.is_labor)
    .reduce((sum, f) => sum + (f.amount ?? 0), 0);

  return {
    totalRevenue,
    totalExpense,
    totalFixedCost,
    totalLaborCost,
  };
}

/**
 * Load the latest Seri report content for business context.
 * Returns null if no cached report exists.
 */
async function loadLatestSeriReport(
  businessId: string
): Promise<SeriReportContent | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("daily_reports")
    .select("content")
    .eq("business_id", businessId)
    .eq("report_type", "seri_profit")
    .order("report_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return data.content as unknown as SeriReportContent;
}

/**
 * Build business context string from Seri report for narrative generation.
 * Summarizes key financial indicators in Korean for Claude prompt.
 */
function buildBusinessContext(report: SeriReportContent | null): string {
  if (!report) return "최근 재무 분석 데이터 없음";

  const parts: string[] = [];

  // Profit status
  const profitStatus =
    report.profit.netProfit >= 0
      ? `흑자 ${report.profit.netProfit.toLocaleString()}원 (이익률 ${report.profit.profitMargin}%)`
      : `적자 ${Math.abs(report.profit.netProfit).toLocaleString()}원`;
  parts.push(`손익: ${profitStatus}`);

  // Cash flow risk
  const riskLabel =
    report.cashFlow.overallRisk === "danger"
      ? "위험"
      : report.cashFlow.overallRisk === "caution"
        ? "주의"
        : "안전";
  parts.push(`자금흐름: ${riskLabel}`);

  // Cost anomaly
  if (report.costAnomaly.isAnomaly) {
    parts.push(
      `비용 이상: ${report.costAnomaly.diagnosisLabel} (편차 ${report.costAnomaly.deviation > 0 ? "+" : ""}${report.costAnomaly.deviation.toFixed(1)}%p)`
    );
  }

  return parts.join(" | ");
}

/**
 * Determine simulation scenarios based on current financial health indicators.
 * Returns scenario definitions sorted by relevance to current financial state.
 */
function determineScenarios(
  kpiInput: KpiInput,
  report: SeriReportContent | null
): Array<{
  scenario: string;
  params: SimulationParams;
  priority: "high" | "medium" | "low";
}> {
  const scenarios: Array<{
    scenario: string;
    params: SimulationParams;
    priority: "high" | "medium" | "low";
  }> = [];

  const revenue = kpiInput.totalRevenue;
  const laborRatio = revenue > 0 ? (kpiInput.totalLaborCost / revenue) * 100 : 0;
  const profitMargin =
    revenue > 0
      ? ((revenue - kpiInput.totalExpense - kpiInput.totalFixedCost) / revenue) * 100
      : 0;

  // Cost anomaly detected: suggest expense reduction
  if (report?.costAnomaly.isAnomaly) {
    scenarios.push({
      scenario: "변동비 10% 절감 시",
      params: { type: "expense_change", value: -10, isPercentage: true },
      priority: "high",
    });
    scenarios.push({
      scenario: "변동비 20% 절감 시",
      params: { type: "expense_change", value: -20, isPercentage: true },
      priority: "medium",
    });
  }

  // Cash flow at risk: suggest revenue increase
  if (
    report?.cashFlow.overallRisk === "danger" ||
    report?.cashFlow.overallRisk === "caution"
  ) {
    scenarios.push({
      scenario: "매출 10% 증가 시",
      params: { type: "revenue_change", value: 10, isPercentage: true },
      priority: "high",
    });
    scenarios.push({
      scenario: "매출 20% 증가 시",
      params: { type: "revenue_change", value: 20, isPercentage: true },
      priority: "medium",
    });
  }

  // High labor ratio (>30%): suggest employee reduction
  if (laborRatio > 30) {
    scenarios.push({
      scenario: "인건비 10% 절감 시 (근무 시간 조정)",
      params: { type: "employee_change", value: -10, isPercentage: true },
      priority: "high",
    });
  }

  // Low profit margin (<10%): suggest combined cost cut
  if (profitMargin < 10) {
    scenarios.push({
      scenario: "고정비(임대료) 10% 절감 시",
      params: { type: "rent_change", value: -10, isPercentage: true },
      priority: "medium",
    });
  }

  // Always include one optimistic scenario
  scenarios.push({
    scenario: "매출 15% 성장 시",
    params: { type: "revenue_change", value: 15, isPercentage: true },
    priority: "low",
  });

  // Deduplicate by scenario name and limit to 3
  const seen = new Set<string>();
  return scenarios.filter((s) => {
    if (seen.has(s.scenario)) return false;
    seen.add(s.scenario);
    return true;
  }).slice(0, 3);
}

/**
 * Generate AI narrative explaining simulation results in Korean.
 * Uses Claude Haiku for cost efficiency (~70% cheaper than Sonnet).
 *
 * @param simulation - Before/after KPI comparison from simulation engine
 * @param params - Simulation parameters that were applied
 * @param businessContext - Korean summary of current financial state
 * @returns AI-generated Korean narrative (3-5 sentences)
 */
export async function narrateSimulationResult(
  simulation: SimulationResult,
  params: SimulationParams,
  businessContext: string
): Promise<string> {
  const userPrompt = buildSimulationPrompt(simulation, params, businessContext);

  return callClaudeHaiku(SIMULATION_NARRATIVE_PROMPT, userPrompt, 512);
}

/**
 * Run AI-recommended simulations based on Seri's financial analysis.
 * Analyzes current financial state and generates relevant what-if scenarios
 * with AI narratives explaining each outcome in Korean.
 *
 * @param businessId - UUID of the business
 * @returns Array of SmartSimulationResult sorted by priority (high first)
 */
export async function generateSmartSimulations(
  businessId: string
): Promise<SmartSimulationResult[]> {
  // Build current KPI input from real data and load latest Seri report concurrently
  const [kpiInput, seriReport] = await Promise.all([
    buildKpiInputFromSeri(businessId),
    loadLatestSeriReport(businessId),
  ]);

  const businessContext = buildBusinessContext(seriReport);

  // Determine relevant scenarios based on financial health
  const scenarioDefs = determineScenarios(kpiInput, seriReport);

  // Run simulations (pure computation, no async needed)
  const simulationResults = scenarioDefs.map((def) => ({
    ...def,
    result: runSimulation(kpiInput, def.params),
  }));

  // Generate narratives concurrently using Haiku for cost efficiency
  const narratives = await Promise.all(
    simulationResults.map((sim) =>
      narrateSimulationResult(sim.result, sim.params, businessContext)
    )
  );

  // Combine results with narratives
  const results: SmartSimulationResult[] = simulationResults.map(
    (sim, index) => ({
      scenario: sim.scenario,
      params: sim.params,
      result: sim.result,
      narrative: narratives[index],
      priority: sim.priority,
    })
  );

  // Sort by priority: high > medium > low
  const priorityOrder: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  results.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return results;
}

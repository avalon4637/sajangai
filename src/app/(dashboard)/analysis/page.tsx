import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import {
  getDailyRevenues,
  getPreviousMonthRevenues,
  calculateMonthlyAnalysis,
} from "@/lib/queries/daily-revenue";
import {
  calculateSurvivalScore,
  type SurvivalScoreInput,
} from "@/lib/kpi/survival-score";
import type { CashflowData } from "@/components/seri/cashflow-forecast";
import type { CostCategoryData } from "@/components/seri/cost-breakdown";
import { AnalysisPageClient } from "./page-client";

interface SeriReportData {
  id: string;
  report_date: string;
  summary: string | null;
  content: Record<string, unknown> | null;
}

interface AnalysisPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function AnalysisPage({ searchParams }: AnalysisPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let businessId: string;
  try {
    businessId = await getCurrentBusinessId();
  } catch (error) {
    console.error("[Analysis] Failed to get business ID:", error);
    redirect("/auth/onboarding");
  }

  const params = await searchParams;
  const now = new Date();
  const yearMonth =
    params.month ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Calculate previous month's yearMonth
  const [y, m] = yearMonth.split("-").map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const prevYearMonth = `${prevY}-${String(prevM).padStart(2, "0")}`;

  // Calculate 3 months ago for cashflow history
  const threeMonthsAgoDate = new Date(y, m - 4, 1); // 3 months before current
  const threeMonthsAgo = `${threeMonthsAgoDate.getFullYear()}-${String(
    threeMonthsAgoDate.getMonth() + 1
  ).padStart(2, "0")}-01`;

  // Load all data in parallel
  const [
    currentData,
    previousData,
    seriReportResult,
    currentExpensesResult,
    prevExpensesResult,
    fixedCostsResult,
    expenseCategoriesResult,
    revenueHistoryResult,
  ] = await Promise.all([
    getDailyRevenues(businessId, yearMonth),
    getPreviousMonthRevenues(businessId, yearMonth),
    supabase
      .from("daily_reports")
      .select("id, report_date, summary, content")
      .eq("business_id", businessId)
      .eq("report_type", "seri_profit")
      .gte("report_date", `${yearMonth}-01`)
      .lte("report_date", `${yearMonth}-31`)
      .order("report_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Current month expenses
    supabase
      .from("expenses")
      .select("category, amount")
      .eq("business_id", businessId)
      .gte("date", `${yearMonth}-01`)
      .lte("date", `${yearMonth}-31`),
    // Previous month expenses
    supabase
      .from("expenses")
      .select("category, amount")
      .eq("business_id", businessId)
      .gte("date", `${prevYearMonth}-01`)
      .lte("date", `${prevYearMonth}-31`),
    // Fixed costs (monthly, not date-bound)
    supabase
      .from("fixed_costs")
      .select("category, amount, is_labor")
      .eq("business_id", businessId),
    // Expense category hierarchy
    supabase
      .from("expense_categories")
      .select("major_category, sub_category, display_order")
      .eq("business_id", businessId)
      .order("display_order"),
    // Revenue history for cashflow (last 3 months)
    supabase
      .from("revenues")
      .select("date, amount")
      .eq("business_id", businessId)
      .gte("date", threeMonthsAgo)
      .lte("date", `${yearMonth}-31`),
  ]);

  const seriReport: SeriReportData | null = seriReportResult.data as SeriReportData | null;

  const currentSummary = calculateMonthlyAnalysis(currentData, yearMonth);
  const previousSummary = calculateMonthlyAnalysis(previousData, prevYearMonth);

  // ===== Aggregate expenses for cost breakdown =====
  const currentExpenses = currentExpensesResult.data ?? [];
  const prevExpenses = prevExpensesResult.data ?? [];
  const fixedCosts = fixedCostsResult.data ?? [];
  const expenseCategories = expenseCategoriesResult.data ?? [];

  // Sum current expenses by category
  const currentByCat = new Map<string, number>();
  for (const e of currentExpenses) {
    currentByCat.set(e.category, (currentByCat.get(e.category) ?? 0) + Number(e.amount));
  }
  // Add fixed costs as categories
  for (const fc of fixedCosts) {
    currentByCat.set(fc.category, (currentByCat.get(fc.category) ?? 0) + Number(fc.amount));
  }

  // Sum previous expenses by category
  const prevByCat = new Map<string, number>();
  for (const e of prevExpenses) {
    prevByCat.set(e.category, (prevByCat.get(e.category) ?? 0) + Number(e.amount));
  }
  // Add same fixed costs for previous month (fixed costs are monthly recurring)
  for (const fc of fixedCosts) {
    prevByCat.set(fc.category, (prevByCat.get(fc.category) ?? 0) + Number(fc.amount));
  }

  // Build sub-category mapping from expense_categories table
  const subCatMap = new Map<string, string[]>();
  for (const ec of expenseCategories) {
    const subs = subCatMap.get(ec.major_category) ?? [];
    if (!subs.includes(ec.sub_category)) {
      subs.push(ec.sub_category);
    }
    subCatMap.set(ec.major_category, subs);
  }

  // Total current expenses
  const totalExpense = Array.from(currentByCat.values()).reduce((s, v) => s + v, 0);

  // Build cost category data
  const costCategories: CostCategoryData[] = Array.from(currentByCat.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => {
      const prevAmount = prevByCat.get(cat) ?? 0;
      const delta = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : null;
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;

      // Build sub-categories (match expense_categories hierarchy)
      const subNames = subCatMap.get(cat) ?? [];
      const subCategories = subNames
        .map((name) => {
          // For now sub-categories share the major category amount proportionally
          // In a real implementation, expenses would have sub_category field
          return {
            name,
            amount: 0,
            percentage: 0,
            delta: null,
          };
        })
        .filter((s) => s.amount > 0 || subNames.length > 0);

      return {
        majorCategory: cat,
        totalAmount: amount,
        percentage,
        delta: delta !== null ? Math.round(delta * 10) / 10 : null,
        subCategories: subCategories.filter((s) => s.name !== cat), // filter self-references
      };
    });

  // ===== Calculate survival score =====
  const totalFixedCosts = fixedCosts.reduce((s, fc) => s + Number(fc.amount), 0);
  const totalLaborCosts = fixedCosts
    .filter((fc) => fc.is_labor)
    .reduce((s, fc) => s + Number(fc.amount), 0);
  const totalVariableExpense = currentExpenses.reduce(
    (s, e) => s + Number(e.amount),
    0
  );
  const totalAllExpense = totalVariableExpense + totalFixedCosts;

  // Revenue history for cashflow
  const revenueHistory = revenueHistoryResult.data ?? [];
  // Group revenues by month
  const revenueByMonth = new Map<string, number>();
  for (const r of revenueHistory) {
    const ym = (r.date as string).substring(0, 7);
    revenueByMonth.set(ym, (revenueByMonth.get(ym) ?? 0) + Number(r.amount));
  }
  const monthlyRevenues = Array.from(revenueByMonth.values());
  const dataMonths = monthlyRevenues.length;
  const avgMonthlyRevenue =
    dataMonths > 0
      ? monthlyRevenues.reduce((s, v) => s + v, 0) / dataMonths
      : 0;

  // Average monthly burn (expenses + fixed costs)
  const monthlyBurn = totalAllExpense; // current month as proxy
  const netMonthlyCashflow = avgMonthlyRevenue - monthlyBurn;

  // Estimated current cash balance
  const cumulativeRevenue = monthlyRevenues.reduce((s, v) => s + v, 0);
  const cumulativeExpense = monthlyBurn * dataMonths; // rough estimate
  const currentCash = cumulativeRevenue - cumulativeExpense;

  // Survival score input
  const survivalInput: SurvivalScoreInput = {
    totalRevenue: currentSummary.totalRevenue,
    totalExpense: totalAllExpense,
    fixedCosts: totalFixedCosts,
    laborCosts: totalLaborCosts,
    cashBalance: Math.max(0, currentCash),
    monthlyBurnRate: monthlyBurn,
    previousMonthRevenue: previousSummary.totalRevenue > 0 ? previousSummary.totalRevenue : null,
  };

  const survivalScore = currentSummary.totalRevenue > 0
    ? calculateSurvivalScore(survivalInput)
    : null;

  // Calculate previous month survival score for delta
  const prevSurvivalTotal = previousSummary.totalRevenue > 0
    ? calculateSurvivalScore({
        ...survivalInput,
        totalRevenue: previousSummary.totalRevenue,
        previousMonthRevenue: null, // no 2-months-ago data available
      }).total
    : null;

  // ===== Build cashflow data =====
  const buildScenario = (revenueMultiplier: number) => ({
    day30: Math.round(currentCash + (avgMonthlyRevenue * revenueMultiplier - monthlyBurn)),
    day60: Math.round(currentCash + (avgMonthlyRevenue * revenueMultiplier - monthlyBurn) * 2),
    day90: Math.round(currentCash + (avgMonthlyRevenue * revenueMultiplier - monthlyBurn) * 3),
  });

  const cashflowData: CashflowData | null = currentSummary.totalRevenue > 0
    ? {
        currentCash: Math.round(currentCash),
        monthlyIncome: Math.round(avgMonthlyRevenue),
        monthlyBurn: Math.round(monthlyBurn),
        netMonthlyCashflow: Math.round(netMonthlyCashflow),
        scenarios: {
          baseline: buildScenario(1.0),
          pessimistic: buildScenario(0.8),
          optimistic: buildScenario(1.2),
        },
        isNegativeAt90Days: buildScenario(1.0).day90 < 0,
        dataMonths,
      }
    : null;

  return (
    <AnalysisPageClient
      businessId={businessId}
      yearMonth={yearMonth}
      currentData={currentData}
      previousData={previousData}
      currentSummary={currentSummary}
      previousSummary={previousSummary}
      seriReport={seriReport}
      survivalScore={survivalScore}
      previousSurvivalScore={prevSurvivalTotal}
      cashflowData={cashflowData}
      costCategories={costCategories}
      totalExpense={totalExpense}
    />
  );
}

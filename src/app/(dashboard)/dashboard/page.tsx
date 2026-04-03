import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import {
  getMonthlyKpi,
  getMonthlyTrend,
  getRevenueByChannel,
  getExpenseBreakdown,
} from "@/lib/queries/monthly-summary";
import { MonthPicker } from "@/components/data-entry/month-picker";
import { KpiSummaryCards } from "@/components/dashboard/kpi-summary-cards";
import { SurvivalScoreWidget } from "@/components/dashboard/survival-score-widget";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { RevenueExpenseChart } from "@/components/dashboard/revenue-expense-chart";
import { KpiTrendChart } from "@/components/dashboard/kpi-trend-chart";
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart";
import { RevenueChannelBreakdown } from "@/components/dashboard/revenue-channel-breakdown";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AiInsightWidget } from "@/components/dashboard/ai-insight-widget";
import { JeongjangBriefingCard } from "@/components/dashboard/jeongjang-briefing-card";
import { ManagementGrid } from "@/components/dashboard/management-grid";
import { InsightFeedServer } from "./insight-feed-server";
import { TrialBanner } from "@/components/billing/trial-banner";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const now = new Date();
  const currentMonth =
    params.month ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let businessId: string;
  try {
    businessId = await getCurrentBusinessId();
  } catch {
    redirect("/auth/onboarding");
  }

  // Calculate previous month for comparison
  const [year, month] = currentMonth.split("-").map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  // Fetch business type for AI analysis
  const { data: business } = await supabase
    .from("businesses")
    .select("business_type")
    .eq("id", businessId)
    .single();
  const businessType = business?.business_type ?? undefined;

  // Fetch all dashboard data in parallel (including latest briefing + subscription)
  const [currentKpi, previousKpi, trend, revenueByChannel, expenseBreakdown, latestBriefing, subscription] =
    await Promise.all([
      getMonthlyKpi(businessId, currentMonth),
      getMonthlyKpi(businessId, previousMonth),
      getMonthlyTrend(businessId, 12),
      getRevenueByChannel(businessId, currentMonth),
      getExpenseBreakdown(businessId, currentMonth),
      supabase
        .from("daily_reports")
        .select("id, report_date, summary, content")
        .eq("business_id", businessId)
        .eq("report_type", "jeongjang_briefing")
        .order("report_date", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then((res) => res.data),
      supabase
        .from("subscriptions")
        .select("plan, status, trial_ends_at")
        .eq("business_id", businessId)
        .in("status", ["trial", "active", "expired"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then((res) => res.data),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <span>👨‍💼</span>
            <span>점장 · 종합 브리핑</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            오늘의 매장 현황을 한눈에 확인하세요
          </p>
        </div>
        <Suspense fallback={null}>
          <MonthPicker basePath="/dashboard" />
        </Suspense>
      </div>

      {/* Trial Banner */}
      {subscription?.status === "trial" || subscription?.status === "expired" ? (
        (() => {
          const trialEnd = subscription.trial_ends_at
            ? new Date(subscription.trial_ends_at)
            : null;
          const daysLeft = trialEnd
            ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86_400_000))
            : 0;
          return (
            <TrialBanner
              daysLeft={daysLeft}
              isExpired={subscription.status === "expired" || daysLeft === 0}
            />
          );
        })()
      ) : null}

      {/* Jeongjang Briefing Card - shown when available */}
      {latestBriefing && (
        <JeongjangBriefingCard
          date={latestBriefing.report_date}
          summary={latestBriefing.summary ?? ""}
          content={latestBriefing.content as Record<string, unknown> | null}
        />
      )}

      {!currentKpi ? (
        <DashboardEmptyState />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <KpiSummaryCards current={currentKpi} previous={previousKpi} />

          {/* AI Insight Feed */}
          <Suspense fallback={null}>
            <InsightFeedServer businessId={businessId} />
          </Suspense>

          {/* Survival Score + Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SurvivalScoreWidget data={currentKpi} />
            <ExpenseBreakdownChart data={expenseBreakdown} />
          </div>

          {/* Revenue Trend + Revenue vs Expense */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueTrendChart data={trend} />
            <RevenueExpenseChart data={trend} />
          </div>

          {/* KPI Trend */}
          <KpiTrendChart data={trend} />

          {/* AI Insight Widget */}
          <AiInsightWidget
            kpiData={currentKpi ? {
              grossProfit: currentKpi.gross_profit,
              netProfit: currentKpi.net_profit,
              grossMargin: currentKpi.gross_margin,
              laborRatio: currentKpi.labor_ratio,
              fixedCostRatio: currentKpi.fixed_cost_ratio,
              survivalScore: currentKpi.survival_score,
            } : null}
            businessType={businessType}
          />

          {/* Channel Breakdown + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChannelBreakdown data={revenueByChannel} />
            <QuickActions />
          </div>
        </>
      )}

      {/* Management Section */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-foreground">관리</h2>
        <ManagementGrid />
      </div>
    </div>
  );
}

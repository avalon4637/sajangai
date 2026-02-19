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
    redirect("/onboarding");
  }

  // Calculate previous month for comparison
  const [year, month] = currentMonth.split("-").map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  // Fetch all dashboard data in parallel
  const [currentKpi, previousKpi, trend, revenueByChannel, expenseBreakdown] =
    await Promise.all([
      getMonthlyKpi(businessId, currentMonth),
      getMonthlyKpi(businessId, previousMonth),
      getMonthlyTrend(businessId, 12),
      getRevenueByChannel(businessId, currentMonth),
      getExpenseBreakdown(businessId, currentMonth),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-muted-foreground mt-1">
            사업장의 핵심 경영 지표를 한눈에 확인하세요.
          </p>
        </div>
        <Suspense fallback={null}>
          <MonthPicker basePath="/dashboard" />
        </Suspense>
      </div>

      {!currentKpi ? (
        <DashboardEmptyState />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <KpiSummaryCards current={currentKpi} previous={previousKpi} />

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

          {/* Channel Breakdown + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChannelBreakdown data={revenueByChannel} />
            <QuickActions />
          </div>
        </>
      )}
    </div>
  );
}

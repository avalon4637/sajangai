"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  BarChart3,
  Download,
  FileSpreadsheet,
  BookOpen,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PnlSummaryCards } from "@/components/seri/pnl-summary-cards";
import { SeriAiNarrative } from "@/components/seri/seri-ai-narrative";
import { CostBreakdown, type CostCategoryData } from "@/components/seri/cost-breakdown";
import { CashflowForecast, type CashflowData } from "@/components/seri/cashflow-forecast";
import { SurvivalGauge } from "@/components/seri/survival-gauge";
import type { SurvivalScoreResult } from "@/lib/kpi/survival-score";
import {
  RevenueCalendar,
  DailyDetailPanel,
} from "@/components/analysis/revenue-calendar";
import { MonthlySummaryPanel } from "@/components/analysis/monthly-summary-panel";
import { DailyTrendChart } from "@/components/analysis/daily-trend-chart";
import { DayOfWeekChart } from "@/components/analysis/day-of-week-chart";
import { ChannelBreakdownChart } from "@/components/analysis/channel-breakdown-chart";
import { ExpenseCategoryChart } from "@/components/analysis/expense-category-chart";
import { LaborCostForm } from "@/components/seri/labor-cost-form";
import { InvoiceTracker } from "@/components/seri/invoice-tracker";
import { exportRevenueSummary, exportRevenueDetail } from "@/lib/actions/export";
import type {
  DailyRevenueSummary,
  MonthlyAnalysisSummary,
} from "@/lib/queries/daily-revenue";

interface SeriReportData {
  id: string;
  report_date: string;
  summary: string | null;
  content: Record<string, unknown> | null;
}

interface AnalysisPageClientProps {
  businessId: string;
  yearMonth: string;
  currentData: DailyRevenueSummary[];
  previousData: DailyRevenueSummary[];
  currentSummary: MonthlyAnalysisSummary;
  previousSummary: MonthlyAnalysisSummary;
  seriReport?: SeriReportData | null;
  survivalScore?: SurvivalScoreResult | null;
  previousSurvivalScore?: number | null;
  cashflowData?: CashflowData | null;
  costCategories?: CostCategoryData[];
  totalExpense?: number;
}

type TabValue = "trend" | "pattern" | "bookkeeping";
type CalendarView = "monthly" | "weekly";

export function AnalysisPageClient({
  businessId,
  yearMonth,
  currentData,
  previousData,
  currentSummary,
  previousSummary,
  seriReport,
  survivalScore,
  previousSurvivalScore,
  cashflowData,
  costCategories,
  totalExpense: totalExpenseProp,
}: AnalysisPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("trend");
  const [calendarView, setCalendarView] = useState<CalendarView>("monthly");
  const [selectedDayData, setSelectedDayData] = useState<{
    date: string;
    data: DailyRevenueSummary;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Trigger CSV download in the browser
  const downloadCsv = (csvContent: string, filename: string) => {
    const bom = "\uFEFF"; // UTF-8 BOM for Korean characters in Excel
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSummaryDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const csv = await exportRevenueSummary(businessId, yearMonth);
      downloadCsv(csv, `매출요약_${yearMonth}.csv`);
    } catch {
      toast.error("다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDetailDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const csv = await exportRevenueDetail(businessId, yearMonth);
      downloadCsv(csv, `매출상세_${yearMonth}.csv`);
    } catch {
      toast.error("다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  const [year, month] = yearMonth.split("-").map(Number);

  const navigateMonth = (direction: -1 | 1) => {
    const newMonth = month + direction;
    let newYear = year;
    let adjustedMonth = newMonth;

    if (newMonth < 1) {
      adjustedMonth = 12;
      newYear = year - 1;
    } else if (newMonth > 12) {
      adjustedMonth = 1;
      newYear = year + 1;
    }

    const ym = `${newYear}-${String(adjustedMonth).padStart(2, "0")}`;
    router.push(`/analysis?month=${ym}`);
  };

  const handleDateSelect = (
    date: string,
    data: DailyRevenueSummary | null
  ) => {
    if (data) {
      setSelectedDayData({ date, data });
    } else {
      setSelectedDayData(null);
    }
  };

  const hasData = currentData.length > 0;

  return (
    <div className="space-y-6">
      {/* ===== TOP BAR ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Title + Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-xl font-semibold flex items-center gap-2 whitespace-nowrap">
            <span className="text-[#10B981]">세리</span>
            <span className="text-muted-foreground font-normal">·</span>
            <span>매출 분석</span>
          </h1>
          {hasData && (
            <Badge className="bg-[#ECFDF5] text-[#059669] border-[#10B981]/20 hover:bg-[#ECFDF5] gap-1">
              <CheckCircle2 className="h-3 w-3" />
              분석완료
            </Badge>
          )}
        </div>

        {/* Center: Month selector */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-base font-semibold min-w-[120px] text-center">
            {year}년 {month}월
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Download buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleSummaryDownload}
            disabled={isDownloading || !hasData}
          >
            <Download className="h-3.5 w-3.5" />
            요약
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleDetailDownload}
            disabled={isDownloading || !hasData}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            상세 Excel
          </Button>
        </div>
      </div>

      {/* ===== SURVIVAL SCORE ===== */}
      {hasData && survivalScore && (
        <SurvivalGauge
          score={survivalScore}
          previousScore={previousSurvivalScore}
        />
      )}

      {/* ===== P&L SUMMARY ROW ===== */}
      <PnlSummaryCards
        current={currentSummary}
        previous={previousSummary.totalRevenue > 0 ? previousSummary : null}
      />

      {/* ===== MAIN CONTENT: Calendar + Side Panel ===== */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* LEFT COLUMN: Calendar (Main Content) */}
          <div className="space-y-4">
            {/* Calendar view toggle: weekly/monthly + today button */}
            <div className="flex items-center gap-2">
              <div className="flex">
                <button
                  onClick={() => setCalendarView("weekly")}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-l-md border transition-colors ${
                    calendarView === "weekly"
                      ? "bg-[#4B6BF5] text-white border-[#4B6BF5]"
                      : "bg-[#F8F9FA] text-muted-foreground border-border hover:bg-gray-100"
                  }`}
                >
                  주간
                </button>
                <button
                  onClick={() => setCalendarView("monthly")}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-r-md border-y border-r transition-colors ${
                    calendarView === "monthly"
                      ? "bg-[#4B6BF5] text-white border-[#4B6BF5]"
                      : "bg-[#F8F9FA] text-muted-foreground border-border hover:bg-gray-100"
                  }`}
                >
                  월간
                </button>
              </div>
              <div className="flex-1" />
              <button
                onClick={() => {
                  const today = new Date();
                  const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
                  router.push(`/analysis?month=${ym}`);
                }}
                className="px-3 py-1.5 text-xs font-medium text-[#4B6BF5] border rounded-md hover:bg-[#EEF1FE] transition-colors"
              >
                오늘
              </button>
            </div>

            {/* Calendar */}
            <RevenueCalendar
              data={currentData}
              yearMonth={yearMonth}
              onDateSelect={handleDateSelect}
            />

            {/* Daily detail panel when a date is selected */}
            {selectedDayData && (
              <DailyDetailPanel
                date={selectedDayData.date}
                data={selectedDayData.data}
              />
            )}
          </div>

          {/* RIGHT COLUMN: AI Narrative + Cost Breakdown + Cashflow */}
          <div className="space-y-4">
            <SeriAiNarrative
              seriReport={seriReport}
              summary={currentSummary}
              yearMonth={yearMonth}
            />
            <CostBreakdown
              categories={costCategories ?? []}
              totalExpense={totalExpenseProp ?? 0}
            />
            <CashflowForecast cashflow={cashflowData ?? null} />
          </div>
        </div>
      )}

      {/* ===== TABS for detailed analysis ===== */}
      <div className="border-t pt-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
        >
          <TabsList>
            <TabsTrigger value="trend" className="gap-1.5">
              <TrendingUp className="h-4 w-4" />
              <span>추이</span>
            </TabsTrigger>
            <TabsTrigger value="pattern" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span>패턴</span>
            </TabsTrigger>
            <TabsTrigger value="bookkeeping" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>가계부</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ===== Empty State ===== */}
      {!hasData && (
        <div className="border rounded-lg p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {month}월 매출 데이터가 없습니다
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            매출 관리에서 데이터를 등록하거나 CSV 파일을 임포트하세요.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push("/revenue")}
            >
              매출 등록
            </Button>
            <Button onClick={() => router.push("/import")}>
              CSV 임포트
            </Button>
          </div>
        </div>
      )}

      {/* ===== Tab Content ===== */}
      {hasData && activeTab === "trend" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <DailyTrendChart
            data={currentData}
            previousData={previousData}
            yearMonth={yearMonth}
          />
          <MonthlySummaryPanel
            summary={currentSummary}
            yearMonth={yearMonth}
          />
        </div>
      )}

      {hasData && activeTab === "pattern" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <DayOfWeekChart data={currentSummary.dayOfWeekAverage} />
          <ChannelBreakdownChart
            data={currentSummary.channelBreakdown}
            totalRevenue={currentSummary.totalRevenue}
          />
        </div>
      )}

      {activeTab === "bookkeeping" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">가계부</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                은행/카드 명세서를 업로드하여 지출을 자동으로 분류합니다
              </p>
            </div>
            <Button onClick={() => router.push("/analysis/upload")}>
              <Upload className="h-4 w-4 mr-2" />
              명세서 업로드
            </Button>
          </div>

          {/* 9-category stacked bar chart */}
          <ExpenseCategoryChart data={[]} />

          {/* Labor cost management card */}
          <LaborCostForm />

          {/* Receivables/Payables card */}
          <InvoiceTracker />
        </div>
      )}
    </div>
  );
}

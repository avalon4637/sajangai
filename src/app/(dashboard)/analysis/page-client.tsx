"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevenueKpiCards } from "@/components/analysis/revenue-kpi-cards";
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
}

type TabValue = "calendar" | "trend" | "pattern" | "bookkeeping";

export function AnalysisPageClient({
  businessId,
  yearMonth,
  currentData,
  previousData,
  currentSummary,
  previousSummary,
  seriReport,
}: AnalysisPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("calendar");
  const [selectedDayData, setSelectedDayData] = useState<{
    date: string;
    data: DailyRevenueSummary;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Trigger CSV download in the browser
  const downloadCsv = (csvContent: string, filename: string) => {
    const bom = "\uFEFF"; // UTF-8 BOM for Korean characters in Excel
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
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
      alert("다운로드 중 오류가 발생했습니다.");
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
      alert("다운로드 중 오류가 발생했습니다.");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <span>📊</span>
            <span>세리 · 매출 분석</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            달력, 추이, 패턴으로 매출을 분석해드려요
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold min-w-[120px] text-center">
            {year}년 {month}월
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <RevenueKpiCards
        current={currentSummary}
        previous={previousSummary.totalRevenue > 0 ? previousSummary : null}
      />

      {/* Seri AI Insight Card */}
      {seriReport && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span>📊</span>
                <span>세리의 매출 분석</span>
              </CardTitle>
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                {seriReport.report_date} 기준
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {seriReport.summary ?? "세리가 이달의 매출 분석을 완료했습니다."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>달력</span>
          </TabsTrigger>
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

      {/* Empty State */}
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

      {/* Tab Content */}
      {hasData && activeTab === "calendar" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <RevenueCalendar
              data={currentData}
              yearMonth={yearMonth}
              onDateSelect={handleDateSelect}
            />
            {selectedDayData && (
              <DailyDetailPanel
                date={selectedDayData.date}
                data={selectedDayData.data}
              />
            )}
            {/* Download buttons below calendar */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleSummaryDownload}
                disabled={isDownloading}
              >
                <Download className="h-3.5 w-3.5" />
                요약 다운로드
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleDetailDownload}
                disabled={isDownloading}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                상세 Excel
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <MonthlySummaryPanel
              summary={currentSummary}
              yearMonth={yearMonth}
            />
          </div>
        </div>
      )}

      {hasData && activeTab === "trend" && (
        <div className="space-y-6">
          <DailyTrendChart
            data={currentData}
            previousData={previousData}
            yearMonth={yearMonth}
          />
          {/* Mobile: show summary below chart */}
          <div className="lg:hidden">
            <MonthlySummaryPanel
              summary={currentSummary}
              yearMonth={yearMonth}
            />
          </div>
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

          {/* 9대 분류 스택 바 차트 */}
          <ExpenseCategoryChart data={[]} />

          {/* 인건비 관리 카드 */}
          <LaborCostForm />

          {/* 미수금/미지급금 카드 */}
          <InvoiceTracker />
        </div>
      )}
    </div>
  );
}

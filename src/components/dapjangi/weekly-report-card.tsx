"use client";

// Weekly review report card for Dapjangi agent
// Displays AI-generated weekly review analysis with collapsible sections

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Megaphone,
  ChevronDown,
  Loader2,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WeeklyReportData {
  summary: string;
  stats: {
    newCount: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    avgRating: number;
    ratingChange: number;
  };
  positiveKeywords: { keyword: string; count: number; example: string }[];
  negativeKeywords: { keyword: string; count: number; example: string }[];
  trends: { type: "improving" | "declining" | "new"; description: string }[];
  actions: {
    priority: number;
    action: string;
    reason: string;
    expectedImpact: string;
  }[];
  marketingPoints: { keyword: string; suggestion: string }[];
}

interface WeeklyReportCardProps {
  report: WeeklyReportData | null;
  reportDate?: string;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-border/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2.5 px-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <div className="pb-3 px-1">{children}</div>}
    </div>
  );
}

function RunAnalysisButton(): React.ReactElement {
  const [loading, setLoading] = useState(false);

  const handleRun = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/dapjangi/weekly-analysis", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`리뷰 ${data.reviewCount}건 분석 완료`);
        window.location.reload();
      } else {
        toast.error(data.error || "분석 실패");
      }
    } catch {
      toast.error("분석 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRun}
      disabled={loading}
      className="text-xs gap-1"
    >
      {loading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" /> 분석 중...
        </>
      ) : (
        "주간 분석 실행"
      )}
    </Button>
  );
}

function RatingChange({ change }: { change: number }): React.ReactElement {
  if (change === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  const isPositive = change > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
        isPositive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {change.toFixed(1)}
    </span>
  );
}

export function WeeklyReportCard({
  report,
  reportDate,
}: WeeklyReportCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(true);

  // No report state
  if (!report) {
    return (
      <div className="rounded-2xl border bg-card shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold">주간 리뷰 리포트</h2>
          </div>
          <RunAnalysisButton />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          아직 주간 분석이 실행되지 않았습니다. 버튼을 눌러 분석을 시작하세요.
        </p>
      </div>
    );
  }

  const { stats } = report;

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold">주간 리뷰 리포트</h2>
          {reportDate && (
            <span className="text-[11px] text-muted-foreground">
              {reportDate}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RunAnalysisButton />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label={expanded ? "접기" : "펼치기"}
          >
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Summary */}
          <div className="flex items-start gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-foreground leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 flex-wrap text-xs mb-1">
            <span className="inline-flex items-center gap-1 bg-muted rounded-full px-2.5 py-1">
              신규{" "}
              <span className="font-semibold">{stats.newCount}건</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 rounded-full px-2.5 py-1">
              긍정{" "}
              <span className="font-semibold">{stats.positiveCount}</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 rounded-full px-2.5 py-1">
              부정{" "}
              <span className="font-semibold">{stats.negativeCount}</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 rounded-full px-2.5 py-1">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="font-semibold">
                {stats.avgRating.toFixed(1)}
              </span>
              <RatingChange change={stats.ratingChange} />
            </span>
          </div>

          {/* Keywords section */}
          {(report.positiveKeywords.length > 0 ||
            report.negativeKeywords.length > 0) && (
            <CollapsibleSection
              title="키워드 분석"
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              defaultOpen
            >
              {report.positiveKeywords.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] text-muted-foreground mb-1">
                    긍정 키워드
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {report.positiveKeywords.map((kw) => (
                      <span
                        key={kw.keyword}
                        className="inline-flex items-center gap-1 bg-green-50 text-green-700 rounded-full px-2 py-0.5 text-[11px]"
                        title={kw.example}
                      >
                        {kw.keyword}
                        <span className="text-green-500 font-medium">
                          {kw.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {report.negativeKeywords.length > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">
                    부정 키워드
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {report.negativeKeywords.map((kw) => (
                      <span
                        key={kw.keyword}
                        className="inline-flex items-center gap-1 bg-red-50 text-red-700 rounded-full px-2 py-0.5 text-[11px]"
                        title={kw.example}
                      >
                        {kw.keyword}
                        <span className="text-red-500 font-medium">
                          {kw.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Trends section */}
          {report.trends.length > 0 && (
            <CollapsibleSection
              title="트렌드"
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            >
              <ul className="space-y-1.5">
                {report.trends.map((trend, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs">
                    {trend.type === "improving" ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                    ) : trend.type === "declining" ? (
                      <TrendingDown className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                    )}
                    <span className="text-foreground">{trend.description}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Action suggestions */}
          {report.actions.length > 0 && (
            <CollapsibleSection
              title="개선 제안"
              icon={<Lightbulb className="h-3.5 w-3.5" />}
            >
              <ul className="space-y-2">
                {report.actions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs bg-amber-50/50 rounded-lg p-2"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {action.action}
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        {action.reason}
                      </p>
                      <p className="text-amber-600 mt-0.5">
                        기대 효과: {action.expectedImpact}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Marketing points */}
          {report.marketingPoints.length > 0 && (
            <CollapsibleSection
              title="마케팅 포인트"
              icon={<Megaphone className="h-3.5 w-3.5" />}
            >
              <ul className="space-y-2">
                {report.marketingPoints.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs bg-blue-50/50 rounded-lg p-2"
                  >
                    <Megaphone className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-[11px] font-medium mb-1">
                        {point.keyword}
                      </span>
                      <p className="text-foreground">{point.suggestion}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}

export type { WeeklyReportData, WeeklyReportCardProps };

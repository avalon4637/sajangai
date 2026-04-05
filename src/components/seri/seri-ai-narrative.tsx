"use client";

// Seri AI Narrative Panel
// Displays AI-generated analysis with green accent theme

import { Sparkles, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MonthlyAnalysisSummary } from "@/lib/queries/daily-revenue";

interface SeriReportData {
  id: string;
  report_date: string;
  summary: string | null;
  content: Record<string, unknown> | null;
}

interface SeriAiNarrativeProps {
  seriReport?: SeriReportData | null;
  summary: MonthlyAnalysisSummary;
  yearMonth: string;
}

// Format Korean currency with man/eok units
function formatAmount(amount: number): string {
  if (amount >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}억`;
  }
  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString()}만`;
  }
  return amount.toLocaleString();
}

// Generate a default narrative when no AI report is available
function generateDefaultNarrative(
  summary: MonthlyAnalysisSummary,
  yearMonth: string
): string {
  const [, month] = yearMonth.split("-").map(Number);
  const topChannel =
    summary.channelBreakdown.length > 0
      ? summary.channelBreakdown.reduce((max, ch) =>
          ch.amount > max.amount ? ch : max
        )
      : null;

  const bestDay =
    summary.dayOfWeekAverage.length > 0
      ? summary.dayOfWeekAverage.reduce((max, d) =>
          d.avgAmount > max.avgAmount ? d : max
        )
      : null;

  let narrative = `사장님, ${month}월 매출 현황을 정리해드렸어요.\n\n`;
  narrative += `이번 달 총 매출은 ${formatAmount(summary.totalRevenue)}원이고, `;
  narrative += `${summary.daysWithRevenue}일 동안 총 ${summary.totalTransactions.toLocaleString()}건의 거래가 있었어요.\n\n`;

  if (topChannel) {
    narrative += `${topChannel.channel} 채널이 ${formatAmount(topChannel.amount)}원으로 가장 높은 매출을 기록했고요. `;
  }

  if (bestDay) {
    narrative += `${bestDay.label}요일이 평균 ${formatAmount(bestDay.avgAmount)}원으로 가장 매출이 좋은 요일이에요.`;
  }

  return narrative;
}

export function SeriAiNarrative({
  seriReport,
  summary,
  yearMonth,
}: SeriAiNarrativeProps) {
  const narrativeText =
    seriReport?.summary ?? generateDefaultNarrative(summary, yearMonth);

  return (
    <Card className="border-[#10B981]/20 bg-gradient-to-br from-[#ECFDF5]/30 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#10B981] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#059669]">
                세리의 분석
              </h3>
              <p className="text-xs text-muted-foreground">AI 매출 인사이트</p>
            </div>
          </div>
          {seriReport && (
            <Badge
              variant="outline"
              className="text-xs border-[#10B981]/30 text-[#059669] bg-[#ECFDF5] gap-1"
            >
              <Calendar className="h-3 w-3" />
              {seriReport.report_date}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {narrativeText}
        </p>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MonthlyAnalysisSummary } from "@/lib/queries/daily-revenue";

interface MonthlySummaryPanelProps {
  summary: MonthlyAnalysisSummary;
  yearMonth: string;
}

function formatAmount(amount: number): string {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억`;
  if (amount >= 10_000) return `${Math.round(amount / 10_000).toLocaleString()}만`;
  return amount.toLocaleString();
}

export function MonthlySummaryPanel({
  summary,
  yearMonth,
}: MonthlySummaryPanelProps) {
  const [, month] = yearMonth.split("-").map(Number);

  return (
    <div className="space-y-4">
      {/* Total Revenue */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            {month}월 총 매출
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.totalRevenue.toLocaleString()}원
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{summary.totalTransactions}건 거래</span>
            <span>{summary.daysWithRevenue}일 영업</span>
          </div>
        </CardContent>
      </Card>

      {/* Channel Breakdown */}
      {summary.channelBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              채널별 매출
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {summary.channelBreakdown.map((ch) => {
              const percent =
                summary.totalRevenue > 0
                  ? Math.round((ch.amount / summary.totalRevenue) * 100)
                  : 0;

              return (
                <div key={ch.channel}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{ch.channel}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {ch.count}건
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {formatAmount(ch.amount)}원
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Day of Week Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            요일별 평균 매출
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {summary.dayOfWeekAverage.map((dow) => {
              const maxAvg = Math.max(
                ...summary.dayOfWeekAverage.map((d) => d.avgAmount)
              );
              const barWidth =
                maxAvg > 0 ? Math.round((dow.avgAmount / maxAvg) * 100) : 0;

              return (
                <div key={dow.day} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-4 text-center">
                    {dow.label}
                  </span>
                  <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-chart-1 rounded transition-all flex items-center"
                      style={{ width: `${barWidth}%` }}
                    >
                      {barWidth > 30 && (
                        <span className="text-[10px] text-white px-1 truncate">
                          {formatAmount(dow.avgAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                  {barWidth <= 30 && (
                    <span className="text-[10px] text-muted-foreground min-w-[40px]">
                      {dow.avgAmount > 0 ? `${formatAmount(dow.avgAmount)}` : "-"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

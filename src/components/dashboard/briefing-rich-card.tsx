"use client";

import { TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";

interface BriefingRichCardProps {
  revenue: number;
  revenueChange: number;
  netProfit: number;
  profitMargin: number;
  weeklyChange: number;
  monthProjection: number;
  monthTarget?: number;
  reviewCount: number;
  unansweredReviews: number;
  briefingText?: string;
  time?: string;
}

function formatCompact(n: number): string {
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (Math.abs(n) >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString() + "원";
}

export function BriefingRichCard({
  revenue,
  revenueChange,
  netProfit,
  profitMargin,
  weeklyChange,
  monthProjection,
  monthTarget,
  reviewCount,
  unansweredReviews,
  briefingText,
  time,
}: BriefingRichCardProps): React.JSX.Element {
  const isUp = revenueChange >= 0;

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <BarChart3 className="h-4 w-4 text-blue-700" />
          </div>
          <div>
            <p className="text-sm font-semibold">오늘의 브리핑</p>
            {time && (
              <p className="text-[10px] text-muted-foreground">{time}</p>
            )}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-slate-50 p-2.5 text-center">
          <p className="mb-0.5 text-[11px] text-muted-foreground">어제 매출</p>
          <p className="text-sm font-bold">{formatCompact(revenue)}</p>
          <p
            className={`text-[10px] font-medium ${isUp ? "text-emerald-600" : "text-red-500"}`}
          >
            {isUp ? "▲" : "▼"}
            {Math.abs(revenueChange).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 text-center">
          <p className="mb-0.5 text-[11px] text-muted-foreground">순이익</p>
          <p className={`text-sm font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {formatCompact(netProfit)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            수익률 {profitMargin.toFixed(0)}%
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 text-center">
          <p className="mb-0.5 text-[11px] text-muted-foreground">리뷰</p>
          <p className="text-sm font-bold">{reviewCount}건</p>
          {unansweredReviews > 0 && (
            <p className="text-[10px] font-medium text-amber-600">
              미답변 {unansweredReviews}
            </p>
          )}
        </div>
      </div>

      {/* Trend badges */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            weeklyChange >= 0
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {weeklyChange >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          주간 {weeklyChange >= 0 ? "+" : ""}
          {weeklyChange.toFixed(0)}%
        </span>
        {monthTarget && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            <Target className="h-3 w-3" />
            목표 {Math.round((monthProjection / monthTarget) * 100)}%
          </span>
        )}
      </div>

      {/* Briefing text */}
      {briefingText && (
        <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {briefingText}
        </p>
      )}
    </div>
  );
}

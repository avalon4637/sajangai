"use client";

import { useState } from "react";
import { formatKRW } from "@/lib/utils/format-currency";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  MessageCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import type { DailyBriefingData } from "@/lib/queries/briefing";

interface DailyBriefingProps {
  data: DailyBriefingData;
  businessName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "좋은 아침이에요!";
  if (hour >= 11 && hour < 17) return "오늘 하루 어떠세요?";
  if (hour >= 17 && hour < 22) return "수고 많으셨어요!";
  return "늦은 시간까지 수고하세요!";
}

function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const isPositive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
        isPositive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {isPositive ? "+" : ""}{delta.toFixed(1)}%
    </span>
  );
}

export function DailyBriefing({ data, businessName }: DailyBriefingProps) {
  const [expanded, setExpanded] = useState(false);
  const { revenue, reviews, anomalies } = data;
  const dayDelta = calcDelta(revenue.yesterday, revenue.dayBeforeYesterday);
  const weekDelta = calcDelta(revenue.yesterday, revenue.sameWeekdayLastWeek);
  const monthProgress =
    revenue.monthTarget && revenue.monthTarget > 0
      ? Math.min(Math.round((revenue.monthTotal / revenue.monthTarget) * 100), 100)
      : null;

  const hasAlerts = reviews.unansweredCount > 0 || anomalies.length > 0;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Compact summary strip — always visible */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 px-3 py-2 md:px-4">
        {/* Greeting + date */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-base">👨‍💼</span>
          <span className="text-xs font-medium text-foreground hidden sm:inline">
            {getGreeting()}
          </span>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Revenue KPI */}
        <div className="flex items-center gap-1.5 shrink-0">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">어제</span>
          <span className="text-sm font-bold">{formatKRW(revenue.yesterday)}</span>
          <DeltaChip delta={dayDelta} />
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Month total */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground">이달</span>
          <span className="text-xs font-semibold">{formatKRW(revenue.monthTotal)}</span>
          {monthProgress !== null && (
            <span className="text-[10px] text-primary font-medium">({monthProgress}%)</span>
          )}
        </div>

        {/* Alerts */}
        {hasAlerts && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              {reviews.unansweredCount > 0 && (
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 border-amber-200">
                  <Star className="h-2.5 w-2.5 mr-0.5" />
                  리뷰 {reviews.unansweredCount}
                </Badge>
              )}
              {anomalies.length > 0 && (
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-700 border-red-200">
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                  주의 {anomalies.length}
                </Badge>
              )}
            </div>
          </>
        )}

        {/* Spacer + expand/links */}
        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Link
            href="/analysis"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors hidden md:inline-flex items-center gap-0.5"
          >
            <BarChart3 className="h-3 w-3" />
            분석
          </Link>
          <Link
            href="/chat"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors hidden md:inline-flex items-center gap-0.5"
          >
            <MessageCircle className="h-3 w-3" />
            채팅
          </Link>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
            aria-label={expanded ? "브리핑 접기" : "브리핑 펼치기"}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded detail — toggleable */}
      {expanded && (
        <div className="border-t px-3 py-3 md:px-4 space-y-3 bg-muted/20">
          {/* Revenue detail grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">어제 매출</p>
              <p className="text-sm font-bold">{formatKRW(revenue.yesterday)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">전일 대비</p>
              <div className="mt-0.5"><DeltaChip delta={dayDelta} /></div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">전주 대비</p>
              <div className="mt-0.5"><DeltaChip delta={weekDelta} /></div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">이달 누적</p>
              <p className="text-sm font-bold">{formatKRW(revenue.monthTotal)}</p>
            </div>
          </div>

          {/* Month progress bar */}
          {monthProgress !== null && (
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>목표: {formatKRW(revenue.monthTarget!)}</span>
                <span className="font-medium text-primary">{monthProgress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${monthProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Review alert */}
          {reviews.recentNegative && (
            <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2 dark:border-orange-900/30 dark:bg-orange-950/20">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
              <div className="min-w-0 text-xs">
                <span className="font-medium text-orange-800 dark:text-orange-200">
                  {reviews.recentNegative.author}
                </span>
                <span className="text-orange-600 dark:text-orange-400">
                  {" · "}{reviews.recentNegative.content.slice(0, 60)}...
                </span>
              </div>
            </div>
          )}

          {/* Anomalies */}
          {anomalies.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg p-2 text-xs ${
                a.severity === "critical"
                  ? "border border-red-200 bg-red-50 text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200"
                  : "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200"
              }`}
            >
              {a.type === "revenue_drop" ? (
                <TrendingDown className="h-3 w-3 shrink-0" />
              ) : (
                <AlertTriangle className="h-3 w-3 shrink-0" />
              )}
              <span className="font-medium">{a.title}</span>
              <span className="text-[11px] opacity-80">{a.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

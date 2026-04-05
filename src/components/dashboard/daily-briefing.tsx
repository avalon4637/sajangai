"use client";

// Daily Briefing Card Component
// Displays revenue, reviews, and anomalies in a premium card format
// Shown at the top of the dashboard for users with existing data

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  MessageCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import Link from "next/link";
import type { DailyBriefingData } from "@/lib/queries/briefing";

interface DailyBriefingProps {
  data: DailyBriefingData;
  businessName: string;
}

// Time-based greeting for Korean business owners
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "좋은 아침이에요, 사장님!";
  if (hour >= 11 && hour < 17) return "오늘 하루 어떠세요, 사장님?";
  if (hour >= 17 && hour < 22) return "수고 많으셨어요, 사장님!";
  return "늦은 시간까지 수고하세요, 사장님!";
}

// Format date as Korean style
function getFormattedDate(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[now.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

// Format currency in Korean style
function formatKRW(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${Math.round(amount / 10000)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

// Calculate percentage change safely
function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

// Delta display component
function DeltaDisplay({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
        <Minus className="h-3 w-3" />
        데이터 없음
      </span>
    );
  }

  const isPositive = delta > 0;
  const isZero = delta === 0;

  if (isZero) {
    return (
      <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
        <Minus className="h-3 w-3" />
        변동 없음
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  );
}

// Star rating display
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </span>
  );
}

export function DailyBriefing({ data, businessName }: DailyBriefingProps) {
  const { revenue, reviews, anomalies } = data;
  const dayDelta = calcDelta(revenue.yesterday, revenue.dayBeforeYesterday);
  const weekDelta = calcDelta(revenue.yesterday, revenue.sameWeekdayLastWeek);
  const monthProgress =
    revenue.monthTarget && revenue.monthTarget > 0
      ? Math.min(
          Math.round((revenue.monthTotal / revenue.monthTarget) * 100),
          100
        )
      : null;

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      {/* Accent top border */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 md:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="점장">
            👨‍💼
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {getGreeting()}
            </h2>
            <p className="text-xs text-muted-foreground">
              AI 점장의 오늘 브리핑
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs font-normal">
          {getFormattedDate()}
        </Badge>
      </div>

      <CardContent className="space-y-4 px-4 pb-4 md:px-6">
        {/* Revenue Section */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">매출 현황</h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Yesterday revenue */}
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">어제 매출</p>
              <p className="mt-0.5 text-base font-bold text-foreground">
                {formatKRW(revenue.yesterday)}
              </p>
            </div>

            {/* Day-over-day */}
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">전일 대비</p>
              <div className="mt-1 flex justify-center">
                <DeltaDisplay delta={dayDelta} />
              </div>
            </div>

            {/* Week-over-week */}
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">전주 대비</p>
              <div className="mt-1 flex justify-center">
                <DeltaDisplay delta={weekDelta} />
              </div>
            </div>
          </div>

          {/* Month progress */}
          {revenue.monthTarget && revenue.monthTarget > 0 ? (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  이번 달 누적: {formatKRW(revenue.monthTotal)} / 목표{" "}
                  {formatKRW(revenue.monthTarget)}
                </span>
                <span className="font-medium text-primary">
                  {monthProgress}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${monthProgress}%` }}
                />
              </div>
            </div>
          ) : revenue.monthTotal > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              이번 달 누적: {formatKRW(revenue.monthTotal)}
            </p>
          ) : null}
        </div>

        {/* Reviews Section */}
        {(reviews.unansweredCount > 0 ||
          reviews.recentNegative ||
          reviews.totalThisMonth > 0) && (
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Star className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold">리뷰 알림</h3>
              {reviews.unansweredCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0"
                >
                  미답변 {reviews.unansweredCount}건
                </Badge>
              )}
            </div>

            {reviews.totalThisMonth > 0 && (
              <p className="text-xs text-muted-foreground mb-1.5">
                이번 달 {reviews.totalThisMonth}건 | 평균{" "}
                {reviews.avgRating.toFixed(1)}점
              </p>
            )}

            {reviews.recentNegative && (
              <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2.5 dark:border-orange-900/30 dark:bg-orange-950/20">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-orange-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-orange-800 dark:text-orange-200">
                      {reviews.recentNegative.author}
                    </span>
                    <StarRating rating={reviews.recentNegative.rating} />
                  </div>
                  <p className="mt-0.5 text-xs text-orange-700 dark:text-orange-300 line-clamp-2">
                    &ldquo;
                    {reviews.recentNegative.content.length > 80
                      ? reviews.recentNegative.content.slice(0, 80) + "..."
                      : reviews.recentNegative.content}
                    &rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Anomalies Section */}
        {anomalies.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold">이상 징후</h3>
            </div>
            <div className="space-y-1.5">
              {anomalies.map((anomaly, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 rounded-lg p-2.5 ${
                    anomaly.severity === "critical"
                      ? "border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20"
                      : "border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20"
                  }`}
                >
                  {anomaly.type === "revenue_drop" ? (
                    <TrendingDown
                      className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${
                        anomaly.severity === "critical"
                          ? "text-red-500"
                          : "text-amber-500"
                      }`}
                    />
                  ) : (
                    <AlertTriangle
                      className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${
                        anomaly.severity === "critical"
                          ? "text-red-500"
                          : "text-amber-500"
                      }`}
                    />
                  )}
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        anomaly.severity === "critical"
                          ? "text-red-800 dark:text-red-200"
                          : "text-amber-800 dark:text-amber-200"
                      }`}
                    >
                      {anomaly.title}
                    </p>
                    <p
                      className={`text-[11px] ${
                        anomaly.severity === "critical"
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {anomaly.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            asChild
          >
            <Link href="/analysis">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              자세히 보기
            </Link>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 text-xs"
            asChild
          >
            <Link href="/chat">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              점장에게 물어보기
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

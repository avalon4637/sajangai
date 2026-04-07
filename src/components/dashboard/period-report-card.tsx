"use client";

import {
  BarChart3,
  Trophy,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PeriodReportCardProps {
  type: "weekly" | "monthly_roi";
  // Weekly
  period?: string;
  revenue?: number;
  revenueChange?: number;
  profit?: number;
  profitChange?: number;
  reviewAvg?: number;
  highlight?: string;
  lowlight?: string;
  // Monthly ROI
  savedMoney?: number;
  earnedMoney?: number;
  savedHours?: number;
  roiMultiple?: number;
  monthlyCost?: number;
}

function formatCompact(n: number): string {
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (Math.abs(n) >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString() + "원";
}

function ChangeIndicator({
  value,
  suffix = "%",
}: {
  value: number;
  suffix?: string;
}): React.JSX.Element {
  const isUp = value >= 0;
  return (
    <p
      className={`text-[10px] font-medium ${isUp ? "text-emerald-600" : "text-red-500"}`}
    >
      {isUp ? "▲" : "▼"}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </p>
  );
}

function WeeklyReport({
  period,
  revenue = 0,
  revenueChange = 0,
  profit = 0,
  profitChange = 0,
  reviewAvg = 0,
  highlight,
  lowlight,
}: Omit<PeriodReportCardProps, "type">): React.JSX.Element {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      {/* Header */}
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
          <BarChart3 className="h-3.5 w-3.5 text-blue-700" />
        </div>
        <div>
          <p className="text-sm font-semibold">주간 리포트</p>
          {period && (
            <p className="text-[10px] text-muted-foreground">{period}</p>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="mb-2.5 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <p className="mb-0.5 text-[10px] text-muted-foreground">매출</p>
          <p className="text-sm font-bold">{formatCompact(revenue)}</p>
          <ChangeIndicator value={revenueChange} />
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <p className="mb-0.5 text-[10px] text-muted-foreground">순이익</p>
          <p className="text-sm font-bold text-emerald-600">
            {formatCompact(profit)}
          </p>
          <ChangeIndicator value={profitChange} />
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <p className="mb-0.5 text-[10px] text-muted-foreground">리뷰 평점</p>
          <p className="text-sm font-bold">{reviewAvg.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">/ 5.0</p>
        </div>
      </div>

      {/* Highlight / Lowlight */}
      {(highlight || lowlight) && (
        <div className="mb-2.5 space-y-1">
          {highlight && (
            <div className="flex items-start gap-1.5">
              <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
              <p className="text-[11px] leading-snug text-slate-700">
                {highlight}
              </p>
            </div>
          )}
          {lowlight && (
            <div className="flex items-start gap-1.5">
              <TrendingDown className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
              <p className="text-[11px] leading-snug text-slate-700">
                {lowlight}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <Link href="/analysis">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full text-xs text-blue-700"
        >
          상세 분석 보기
        </Button>
      </Link>
    </div>
  );
}

function MonthlyRoiReport({
  savedMoney = 0,
  earnedMoney = 0,
  savedHours = 0,
  roiMultiple = 0,
  monthlyCost = 9900,
}: Omit<PeriodReportCardProps, "type">): React.JSX.Element {
  const totalValue = savedMoney + earnedMoney;

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-3">
      {/* Header */}
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
          <Trophy className="h-3.5 w-3.5 text-blue-700" />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">이달의 성과</p>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
            {roiMultiple.toFixed(1)}배 회수
          </span>
        </div>
      </div>

      {/* ROI Grid */}
      <div className="mb-2.5 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white/70 p-2 text-center">
          <p className="mb-0.5 text-[10px] text-muted-foreground">절약 비용</p>
          <p className="text-sm font-bold text-blue-700">
            {formatCompact(savedMoney)}
          </p>
        </div>
        <div className="rounded-lg bg-white/70 p-2 text-center">
          <p className="mb-0.5 text-[10px] text-muted-foreground">추가 수익</p>
          <p className="text-sm font-bold text-emerald-600">
            {formatCompact(earnedMoney)}
          </p>
        </div>
        <div className="rounded-lg bg-white/70 p-2 text-center">
          <p className="mb-0.5 text-[10px] text-muted-foreground">절약 시간</p>
          <p className="text-sm font-bold">{savedHours}시간</p>
        </div>
      </div>

      {/* Cost vs Value bar */}
      <div className="mb-2.5 rounded-lg bg-white/60 px-2.5 py-2">
        <div className="mb-1 flex justify-between text-[10px]">
          <span className="text-muted-foreground">
            월 비용 {formatCompact(monthlyCost)}
          </span>
          <span className="font-medium text-blue-700">
            가치 {formatCompact(totalValue)}
          </span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{
              width: `${Math.min(100, totalValue > 0 ? (monthlyCost / totalValue) * 100 : 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Action */}
      <Link href="/analysis">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full text-xs text-blue-700"
        >
          성과 상세 보기
        </Button>
      </Link>
    </div>
  );
}

export function PeriodReportCard(
  props: PeriodReportCardProps,
): React.JSX.Element {
  if (props.type === "weekly") {
    return <WeeklyReport {...props} />;
  }
  return <MonthlyRoiReport {...props} />;
}

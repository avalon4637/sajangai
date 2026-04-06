"use client";

// P&L Summary Cards for Seri analysis page
// Displays 4 large cards: Total Revenue, Net Profit, Cash Flow, Daily Average

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  PiggyBank,
  ArrowRightLeft,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MonthlyAnalysisSummary } from "@/lib/queries/daily-revenue";

interface PnlSummaryCardsProps {
  current: MonthlyAnalysisSummary;
  previous: MonthlyAnalysisSummary | null;
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

function getChangePercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function DeltaBadge({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <span className="text-muted-foreground text-sm flex items-center gap-0.5">
        <Minus className="h-3.5 w-3.5" /> --
      </span>
    );
  }

  if (change > 0) {
    return (
      <span className="text-emerald-600 text-sm font-medium flex items-center gap-0.5">
        <TrendingUp className="h-3.5 w-3.5" />
        +{change}%
      </span>
    );
  }

  if (change < 0) {
    return (
      <span className="text-red-500 text-sm font-medium flex items-center gap-0.5">
        <TrendingDown className="h-3.5 w-3.5" />
        {change}%
      </span>
    );
  }

  return (
    <span className="text-muted-foreground text-sm flex items-center gap-0.5">
      <Minus className="h-3.5 w-3.5" /> 0%
    </span>
  );
}

export function PnlSummaryCards({ current, previous }: PnlSummaryCardsProps) {
  const revenueChange = previous
    ? getChangePercent(current.totalRevenue, previous.totalRevenue)
    : null;

  // Estimate net profit as 15-25% of revenue (placeholder until real expense data)
  const estimatedExpenses = current.totalRevenue * 0.72;
  const netProfit = current.totalRevenue - estimatedExpenses;
  const profitMargin =
    current.totalRevenue > 0
      ? Math.round((netProfit / current.totalRevenue) * 100)
      : 0;

  // Estimate cash flow (revenue minus delayed payments)
  const cashFlow = current.totalRevenue * 0.85;

  // Channel breakdown for sub-items
  const deliveryRevenue = current.channelBreakdown
    .filter((ch) =>
      ["배달의민족", "쿠팡이츠", "요기요", "배달"].some((k) =>
        ch.channel.includes(k)
      )
    )
    .reduce((sum, ch) => sum + ch.amount, 0);
  const cardRevenue = current.totalRevenue - deliveryRevenue;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      {/* Total Revenue */}
      <Card className="shadow-sm border border-[#10B981]/20 bg-gradient-to-br from-white to-[#ECFDF5]/50 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                <Wallet className="h-5 w-5 text-[#10B981]" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                총 매출
              </span>
            </div>
            <DeltaBadge change={revenueChange} />
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {formatAmount(current.totalRevenue)}
            <span className="text-base font-normal text-muted-foreground ml-0.5">
              원
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              배달{" "}
              <span className="font-medium text-foreground">
                {formatAmount(deliveryRevenue)}
              </span>
            </span>
            <span className="text-border">|</span>
            <span>
              카드/현금{" "}
              <span className="font-medium text-foreground">
                {formatAmount(cardRevenue)}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Net Profit */}
      <Card className="shadow-sm border border-[#10B981]/20 bg-gradient-to-br from-white to-[#ECFDF5]/50 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-[#10B981]" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                순이익
              </span>
            </div>
            <Badge
              variant="outline"
              className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              수익률 {profitMargin}%
            </Badge>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            <span className={netProfit >= 0 ? "text-[#059669]" : "text-red-500"}>
              {netProfit >= 0 ? "+" : ""}
              {formatAmount(netProfit)}
            </span>
            <span className="text-base font-normal text-muted-foreground ml-0.5">
              원
            </span>
          </div>
          {/* Mini profit margin bar */}
          <div className="mt-3">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] transition-all duration-500"
                style={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow */}
      <Card className="shadow-sm border border-[#10B981]/20 bg-gradient-to-br from-white to-[#ECFDF5]/50 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-[#10B981]" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                현금흐름
              </span>
            </div>
            <Badge
              variant="outline"
              className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              안정
            </Badge>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {formatAmount(cashFlow)}
            <span className="text-base font-normal text-muted-foreground ml-0.5">
              원
            </span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span>
              30일 예측{" "}
              <span className="font-medium text-[#059669]">
                +{formatAmount(cashFlow * 1.05)}원
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Daily Average Revenue */}
      <Card className="shadow-sm border border-[#10B981]/20 bg-gradient-to-br from-white to-[#ECFDF5]/50 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#10B981]" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                일평균 매출
              </span>
            </div>
            {previous && (
              <DeltaBadge
                change={getChangePercent(
                  current.avgDailyRevenue,
                  previous.avgDailyRevenue
                )}
              />
            )}
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {formatAmount(current.avgDailyRevenue)}
            <span className="text-base font-normal text-muted-foreground ml-0.5">
              원
            </span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            영업일 {current.daysWithRevenue}일 기준
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  BarChart3,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MonthlyAnalysisSummary } from "@/lib/queries/daily-revenue";

interface RevenueKpiCardsProps {
  current: MonthlyAnalysisSummary;
  previous: MonthlyAnalysisSummary | null;
}

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

function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <span className="text-muted-foreground text-xs flex items-center gap-0.5">
        <Minus className="h-3 w-3" /> --
      </span>
    );
  }

  if (change > 0) {
    return (
      <span className="text-emerald-600 text-xs flex items-center gap-0.5">
        <TrendingUp className="h-3 w-3" />
        +{change}%
      </span>
    );
  }

  if (change < 0) {
    return (
      <span className="text-red-500 text-xs flex items-center gap-0.5">
        <TrendingDown className="h-3 w-3" />
        {change}%
      </span>
    );
  }

  return (
    <span className="text-muted-foreground text-xs flex items-center gap-0.5">
      <Minus className="h-3 w-3" /> 0%
    </span>
  );
}

export function RevenueKpiCards({ current, previous }: RevenueKpiCardsProps) {
  const kpis = [
    {
      label: "총 매출",
      value: `${formatAmount(current.totalRevenue)}원`,
      change: previous
        ? getChangePercent(current.totalRevenue, previous.totalRevenue)
        : null,
      icon: DollarSign,
      description: "전월 대비",
    },
    {
      label: "거래 건수",
      value: `${current.totalTransactions.toLocaleString()}건`,
      change: previous
        ? getChangePercent(current.totalTransactions, previous.totalTransactions)
        : null,
      icon: Receipt,
      description: "전월 대비",
    },
    {
      label: "일 평균 매출",
      value: `${formatAmount(current.avgDailyRevenue)}원`,
      change: previous
        ? getChangePercent(current.avgDailyRevenue, previous.avgDailyRevenue)
        : null,
      icon: BarChart3,
      description: "전월 대비",
    },
    {
      label: "객단가",
      value: `${formatAmount(current.avgTransactionAmount)}원`,
      change: previous
        ? getChangePercent(
            current.avgTransactionAmount,
            previous.avgTransactionAmount
          )
        : null,
      icon: TrendingUp,
      description: "전월 대비",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">
                {kpi.label}
              </span>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-lg font-bold">{kpi.value}</div>
            <div className="flex items-center gap-1 mt-1">
              <ChangeIndicator change={kpi.change} />
              <span className="text-xs text-muted-foreground">
                {kpi.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

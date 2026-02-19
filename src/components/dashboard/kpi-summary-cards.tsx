"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PiggyBank,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlySummary } from "@/types/data-entry";

interface KpiSummaryCardsProps {
  current: MonthlySummary;
  previous: MonthlySummary | null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function calculateChange(
  current: number,
  previous: number | undefined
): { value: number; label: string } | null {
  if (previous === undefined || previous === 0) return null;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return {
    value: Math.round(change * 10) / 10,
    label: `${change >= 0 ? "+" : ""}${(Math.round(change * 10) / 10).toFixed(1)}%`,
  };
}

interface KpiCardProps {
  title: string;
  value: string;
  suffix?: string;
  change: { value: number; label: string } | null;
  icon: React.ReactNode;
  valueColor?: string;
}

function KpiCard({
  title,
  value,
  suffix = "원",
  change,
  icon,
  valueColor,
}: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`text-2xl font-bold ${valueColor ?? ""}`}>
          {value}
          {suffix && (
            <span className="text-base font-normal text-muted-foreground ml-1">
              {suffix}
            </span>
          )}
        </div>
        {change && (
          <div className="flex items-center gap-1 mt-1">
            {change.value >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span
              className={`text-xs ${
                change.value >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {change.label} 전월 대비
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiSummaryCards({ current, previous }: KpiSummaryCardsProps) {
  const totalCost = current.total_expense + current.total_fixed_cost;
  const previousTotalCost = previous
    ? previous.total_expense + previous.total_fixed_cost
    : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="총매출"
        value={formatCurrency(current.total_revenue)}
        change={calculateChange(
          current.total_revenue,
          previous?.total_revenue
        )}
        icon={<DollarSign className="h-4 w-4" />}
      />
      <KpiCard
        title="총비용"
        value={formatCurrency(totalCost)}
        change={calculateChange(totalCost, previousTotalCost)}
        icon={<Wallet className="h-4 w-4" />}
      />
      <KpiCard
        title="순이익"
        value={formatCurrency(current.net_profit)}
        change={calculateChange(current.net_profit, previous?.net_profit)}
        icon={<PiggyBank className="h-4 w-4" />}
        valueColor={
          current.net_profit >= 0 ? "text-green-600" : "text-red-600"
        }
      />
      <KpiCard
        title="생존점수"
        value={current.survival_score.toFixed(1)}
        suffix="점"
        change={calculateChange(
          current.survival_score,
          previous?.survival_score
        )}
        icon={<Shield className="h-4 w-4" />}
        valueColor={
          current.survival_score >= 61
            ? "text-green-600"
            : current.survival_score >= 31
              ? "text-yellow-600"
              : "text-red-600"
        }
      />
    </div>
  );
}

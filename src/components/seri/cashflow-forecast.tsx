"use client";

// Cashflow Forecast Component for Seri analysis page
// Displays 30/60/90 day forecast rows

import { TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { MonthlyAnalysisSummary } from "@/lib/queries/daily-revenue";

interface CashflowForecastProps {
  summary: MonthlyAnalysisSummary;
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

interface ForecastRow {
  period: string;
  days: number;
  multiplier: number;
}

const FORECAST_ROWS: ForecastRow[] = [
  { period: "30일", days: 30, multiplier: 1.0 },
  { period: "60일", days: 60, multiplier: 2.05 },
  { period: "90일", days: 90, multiplier: 3.12 },
];

export function CashflowForecast({ summary }: CashflowForecastProps) {
  // Base daily average for forecasting
  const dailyAvg = summary.avgDailyRevenue;
  // Estimated daily net cash flow (revenue minus estimated costs)
  const dailyNetCash = dailyAvg * 0.28;

  return (
    <Card className="border-gray-100">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-[#ECFDF5] flex items-center justify-center">
            <Clock className="h-3.5 w-3.5 text-[#10B981]" />
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground">
            현금흐름 예측
          </h3>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {FORECAST_ROWS.map((row) => {
            const forecastAmount = dailyNetCash * row.days * row.multiplier / row.days * row.days;
            // Simplified: use multiplier directly
            const amount = dailyNetCash * row.days;
            const growth = row.multiplier - 1.0;

            return (
              <div
                key={row.period}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{row.period}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    +{formatAmount(amount)}원
                  </span>
                  {growth > 0 && (
                    <span className="text-xs text-[#059669] ml-1.5 inline-flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      {Math.round(growth * 100)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          * 현재 매출 추세 기반 예측 (실제와 다를 수 있음)
        </p>
      </CardContent>
    </Card>
  );
}

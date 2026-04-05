"use client";

// Cashflow Forecast Component for Seri analysis page
// Displays current cash, 30/60/90 day projections with 3 scenarios

import { useState } from "react";
import {
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CashflowData {
  currentCash: number;
  monthlyIncome: number;
  monthlyBurn: number;
  netMonthlyCashflow: number;
  scenarios: {
    baseline: { day30: number; day60: number; day90: number };
    pessimistic: { day30: number; day60: number; day90: number };
    optimistic: { day30: number; day60: number; day90: number };
  };
  isNegativeAt90Days: boolean;
  dataMonths: number;
}

// Format Korean currency with man/eok units
function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(1)}억`;
  }
  if (abs >= 10_000) {
    return `${sign}${Math.round(abs / 10_000).toLocaleString()}만`;
  }
  return `${sign}${abs.toLocaleString()}`;
}

interface ForecastRowProps {
  label: string;
  amount: number;
}

function ForecastRow({ label, amount }: ForecastRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          amount < 0 ? "text-red-500" : ""
        }`}
      >
        {formatAmount(amount)}원
      </span>
    </div>
  );
}

export function CashflowForecast({
  cashflow,
}: {
  cashflow: CashflowData | null;
}) {
  const [showScenarios, setShowScenarios] = useState(false);

  // Empty state
  if (!cashflow) {
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
          <p className="text-xs text-muted-foreground">
            데이터가 부족합니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[#ECFDF5] flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-[#10B981]" />
            </div>
            <h3 className="text-sm font-semibold text-muted-foreground">
              현금흐름 예측
            </h3>
          </div>
          {cashflow.isNegativeAt90Days && (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-600 border-red-200 gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              주의
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Current estimated cash balance */}
        <div className="mb-3 p-3 rounded-lg bg-[#ECFDF5]">
          <span className="text-xs text-[#059669]">현재 추정 잔액</span>
          <div className="text-lg font-bold text-[#059669]">
            {formatAmount(cashflow.currentCash)}원
          </div>
        </div>

        {/* Baseline projections */}
        <div className="space-y-0">
          <ForecastRow
            label="30일 후"
            amount={cashflow.scenarios.baseline.day30}
          />
          <ForecastRow
            label="60일 후"
            amount={cashflow.scenarios.baseline.day60}
          />
          <ForecastRow
            label="90일 후"
            amount={cashflow.scenarios.baseline.day90}
          />
        </div>

        {/* Scenario toggle */}
        <button
          onClick={() => setShowScenarios(!showScenarios)}
          className="flex items-center gap-1 text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
        >
          {showScenarios ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          시나리오별 예측
        </button>

        {showScenarios && (
          <div className="mt-2 space-y-3">
            {/* Pessimistic */}
            <div>
              <span className="text-xs font-medium text-red-500">
                비관적 (매출 -20%)
              </span>
              <div className="space-y-0">
                <ForecastRow
                  label="30일"
                  amount={cashflow.scenarios.pessimistic.day30}
                />
                <ForecastRow
                  label="60일"
                  amount={cashflow.scenarios.pessimistic.day60}
                />
                <ForecastRow
                  label="90일"
                  amount={cashflow.scenarios.pessimistic.day90}
                />
              </div>
            </div>

            {/* Optimistic */}
            <div>
              <span className="text-xs font-medium text-blue-500">
                낙관적 (매출 +20%)
              </span>
              <div className="space-y-0">
                <ForecastRow
                  label="30일"
                  amount={cashflow.scenarios.optimistic.day30}
                />
                <ForecastRow
                  label="60일"
                  amount={cashflow.scenarios.optimistic.day60}
                />
                <ForecastRow
                  label="90일"
                  amount={cashflow.scenarios.optimistic.day90}
                />
              </div>
            </div>
          </div>
        )}

        {/* Data confidence notice */}
        {cashflow.dataMonths < 3 && (
          <div className="flex items-start gap-1.5 mt-3 text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{cashflow.dataMonths}개월 데이터 기반 (3개월 이상 권장)</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          * 현재 매출/지출 추세 기반 예측 (실제와 다를 수 있음)
        </p>
      </CardContent>
    </Card>
  );
}

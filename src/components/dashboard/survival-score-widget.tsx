"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlySummary } from "@/types/data-entry";
import {
  calculateSurvivalScoreBreakdown,
  type SurvivalScoreBreakdown,
} from "@/types/dashboard";

interface SurvivalScoreWidgetProps {
  data: MonthlySummary;
}

function getScoreStatus(score: number): {
  label: string;
  color: string;
  bgColor: string;
  ringColor: string;
} {
  if (score >= 81)
    return {
      label: "우수",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      ringColor: "stroke-blue-500",
    };
  if (score >= 61)
    return {
      label: "양호",
      color: "text-green-600",
      bgColor: "bg-green-100",
      ringColor: "stroke-green-500",
    };
  if (score >= 31)
    return {
      label: "주의",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      ringColor: "stroke-yellow-500",
    };
  return {
    label: "위험",
    color: "text-red-600",
    bgColor: "bg-red-100",
    ringColor: "stroke-red-500",
  };
}

function CircularProgress({
  score,
  ringColor,
}: {
  score: number;
  ringColor: string;
}) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        className="stroke-muted"
        strokeWidth="10"
      />
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        className={ringColor}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function BreakdownBar({
  label,
  score,
  maxScore,
  color,
}: {
  label: string;
  score: number;
  maxScore: number;
  color: string;
}) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {score.toFixed(1)}/{maxScore}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

export function SurvivalScoreWidget({ data }: SurvivalScoreWidgetProps) {
  const breakdown: SurvivalScoreBreakdown = calculateSurvivalScoreBreakdown({
    grossMargin: data.gross_margin,
    laborRatio: data.labor_ratio,
    fixedCostRatio: data.fixed_cost_ratio,
    netProfit: data.net_profit,
    totalRevenue: data.total_revenue,
  });

  const status = getScoreStatus(data.survival_score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">생존 점수 분석</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <CircularProgress
              score={data.survival_score}
              ringColor={status.ringColor}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
              <span className="text-3xl font-bold">
                {data.survival_score.toFixed(1)}
              </span>
              <span
                className={`text-sm font-medium px-2 py-0.5 rounded-full ${status.bgColor} ${status.color}`}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <BreakdownBar
            label="순이익 점수"
            score={breakdown.netProfitScore}
            maxScore={30}
            color="bg-blue-500"
          />
          <BreakdownBar
            label="매출총이익률 점수"
            score={breakdown.grossMarginScore}
            maxScore={25}
            color="bg-green-500"
          />
          <BreakdownBar
            label="인건비 비율 점수"
            score={breakdown.laborRatioScore}
            maxScore={20}
            color="bg-yellow-500"
          />
          <BreakdownBar
            label="고정비 비율 점수"
            score={breakdown.fixedCostRatioScore}
            maxScore={25}
            color="bg-purple-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

// Survival Score Gauge - Half-circle SVG gauge with 5 factor bars
// Displays the 5-factor survival score from survival-score.ts

import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SurvivalScoreResult } from "@/lib/kpi/survival-score";

interface SurvivalGaugeProps {
  score: SurvivalScoreResult | null;
  previousScore?: number | null;
}

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  B: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  C: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  D: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  F: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

interface FactorBarProps {
  label: string;
  score: number;
  max: number;
}

function FactorBar({ label, score, max }: FactorBarProps) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 shrink-0 text-right">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#10B981] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium w-12 shrink-0 tabular-nums">
        {score}/{max}
      </span>
    </div>
  );
}

// SVG half-circle gauge
function HalfCircleGauge({ value }: { value: number }) {
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10; // slight offset down

  // Arc from 180 degrees (left) to 0 degrees (right)
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweepAngle = startAngle - endAngle;
  const filledAngle = startAngle - sweepAngle * (value / 100);

  const bgStartX = cx + radius * Math.cos(startAngle);
  const bgStartY = cy - radius * Math.sin(startAngle);
  const bgEndX = cx + radius * Math.cos(endAngle);
  const bgEndY = cy - radius * Math.sin(endAngle);

  const fillEndX = cx + radius * Math.cos(filledAngle);
  const fillEndY = cy - radius * Math.sin(filledAngle);
  const largeArc = value > 50 ? 1 : 0;

  return (
    <svg
      viewBox={`0 0 ${size} ${size / 2 + 30}`}
      className="w-full max-w-[220px] mx-auto"
    >
      {/* Background arc */}
      <path
        d={`M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 1 1 ${bgEndX} ${bgEndY}`}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      {value > 0 && (
        <path
          d={`M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 ${largeArc} 1 ${fillEndX} ${fillEndY}`}
          fill="none"
          stroke="#10B981"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function SurvivalGauge({ score, previousScore }: SurvivalGaugeProps) {
  // Empty state
  if (!score || score.total === 0) {
    return (
      <Card className="border-gray-100">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">생존 점수</h3>
              <p className="text-xs text-muted-foreground mt-1">
                데이터가 부족합니다
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const gradeColor = GRADE_COLORS[score.grade];
  const delta =
    previousScore != null ? Math.round((score.total - previousScore) * 10) / 10 : null;

  return (
    <Card className="border-gray-100">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          {/* Gauge */}
          <div className="relative w-full max-w-[220px]">
            <HalfCircleGauge value={score.total} />
            {/* Score text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <span className="text-3xl font-bold tabular-nums">
                {Math.round(score.total)}
                <span className="text-base font-normal text-muted-foreground">
                  점
                </span>
              </span>
              <Badge
                variant="outline"
                className={`mt-1 ${gradeColor.bg} ${gradeColor.text} ${gradeColor.border}`}
              >
                {score.grade}등급
              </Badge>
            </div>
          </div>

          {/* Delta indicator */}
          {delta !== null && (
            <div
              className={`flex items-center gap-1 text-xs mt-2 ${
                delta >= 0 ? "text-[#059669]" : "text-red-500"
              }`}
            >
              {delta >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                전월 대비 {delta >= 0 ? "+" : ""}
                {delta}점
              </span>
            </div>
          )}
        </div>

        {/* Factor bars */}
        <div className="mt-5 space-y-2.5">
          <FactorBar
            label="수익성"
            score={score.factors.profitability.score}
            max={score.factors.profitability.max}
          />
          <FactorBar
            label="고정비안정"
            score={score.factors.fixedCostStability.score}
            max={score.factors.fixedCostStability.max}
          />
          <FactorBar
            label="인건비적정"
            score={score.factors.laborAppropriateness.score}
            max={score.factors.laborAppropriateness.max}
          />
          <FactorBar
            label="현금유동성"
            score={score.factors.cashLiquidity.score}
            max={score.factors.cashLiquidity.max}
          />
          <FactorBar
            label="성장성"
            score={score.factors.growth.score}
            max={score.factors.growth.max}
          />
        </div>
      </CardContent>
    </Card>
  );
}

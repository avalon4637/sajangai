"use client";

// Survival Score Gauge - Half-circle SVG gauge with 5 factor bars
// Displays the 5-factor survival score from survival-score.ts

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  SurvivalScoreResult,
  SurvivalFactorDetail,
} from "@/lib/kpi/survival-score";

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

        {/* Context text */}
        <ScoreContext total={score.total} />

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

        {/* CTA - score improvement tips */}
        <ScoreImprovementCTA factors={score.factors} />
      </CardContent>
    </Card>
  );
}

// Context text based on score range
function ScoreContext({ total }: { total: number }) {
  const rounded = Math.round(total);

  let text: string;
  let colorClass: string;

  if (rounded >= 80) {
    text = "안정적인 상태입니다";
    colorClass = "text-green-600";
  } else if (rounded >= 50) {
    text = "개선이 필요합니다";
    colorClass = "text-amber-600";
  } else {
    text = "위험 구간입니다. 지출 점검이 필요해요";
    colorClass = "text-red-600";
  }

  return (
    <p className={`text-sm font-medium text-center mt-2 ${colorClass}`}>
      {text}
    </p>
  );
}

// Factor label mapping for tips
const FACTOR_LABELS: Record<string, string> = {
  profitability: "수익성",
  fixedCostStability: "고정비안정",
  laborAppropriateness: "인건비적정",
  cashLiquidity: "현금유동성",
  growth: "성장성",
};

const FACTOR_TIPS: Record<string, string> = {
  profitability: "매출을 늘리거나 비용을 줄여보세요",
  fixedCostStability: "고정비 비중을 낮춰보세요 (임대료, 구독료 등)",
  laborAppropriateness: "인건비 비율을 조정해보세요",
  cashLiquidity: "현금 유보를 늘리거나 지출 시기를 조절해보세요",
  growth: "신규 고객 확보나 객단가 향상을 시도해보세요",
};

interface ScoreImprovementCTAProps {
  factors: SurvivalScoreResult["factors"];
}

function ScoreImprovementCTA({ factors }: ScoreImprovementCTAProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Sort factors by score/max ratio (lowest first) and pick top 3
  const sortedFactors = Object.entries(factors)
    .map(([key, detail]) => ({
      key,
      label: FACTOR_LABELS[key] ?? key,
      score: (detail as SurvivalFactorDetail).score,
      max: (detail as SurvivalFactorDetail).max,
      tip: FACTOR_TIPS[key] ?? "",
    }))
    .sort((a, b) => {
      const ratioA = a.max > 0 ? a.score / a.max : 0;
      const ratioB = b.max > 0 ? b.score / b.max : 0;
      return ratioA - ratioB;
    })
    .slice(0, 3);

  return (
    <div className="mt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Lightbulb className="size-3.5" />
        이 점수를 올리려면?
        <ChevronRight
          className={`size-3 transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </Button>

      {isOpen && (
        <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-3">
          {sortedFactors.map((f) => (
            <div key={f.key} className="text-xs">
              <span className="font-medium text-foreground">
                {f.label} {f.score}/{f.max}
              </span>
              <span className="text-muted-foreground"> &rarr; {f.tip}</span>
            </div>
          ))}

          <div className="pt-2 border-t border-gray-200">
            <Link
              href="/chat"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline"
            >
              점장에게 자세히 물어보기
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

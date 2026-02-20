"use client";

import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SurvivalScoreComparisonProps {
  beforeScore: number;
  afterScore: number;
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

function CircularGauge({
  score,
  ringColor,
  size = "default",
}: {
  score: number;
  ringColor: string;
  size?: "default" | "small";
}) {
  const isSmall = size === "small";
  const radius = isSmall ? 50 : 60;
  const viewBoxSize = isSmall ? 120 : 140;
  const center = viewBoxSize / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;
  const svgClass = isSmall ? "w-28 h-28" : "w-36 h-36";

  return (
    <svg
      className={cn(svgClass, "-rotate-90")}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        className="stroke-muted"
        strokeWidth="8"
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        className={ringColor}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ScoreGauge({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const status = getScoreStatus(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="relative">
        <CircularGauge score={score} ringColor={status.ringColor} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score.toFixed(1)}</span>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              status.bgColor,
              status.color
            )}
          >
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SurvivalScoreComparison({
  beforeScore,
  afterScore,
}: SurvivalScoreComparisonProps) {
  const diff = afterScore - beforeScore;
  const isImproved = diff > 0.01;
  const isWorsened = diff < -0.01;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">생존점수 변화</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <ScoreGauge score={beforeScore} label="현재" />

          <div className="flex flex-col items-center gap-1">
            <ArrowRight className="size-6 text-muted-foreground" />
            <span
              className={cn(
                "text-sm font-bold",
                isImproved && "text-green-600",
                isWorsened && "text-red-600",
                !isImproved && !isWorsened && "text-muted-foreground"
              )}
            >
              {diff >= 0 ? "+" : ""}
              {diff.toFixed(1)}
            </span>
          </div>

          <ScoreGauge score={afterScore} label="시뮬레이션" />
        </div>
      </CardContent>
    </Card>
  );
}

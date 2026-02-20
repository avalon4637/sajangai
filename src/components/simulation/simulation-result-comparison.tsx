"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SimulationResult } from "@/lib/simulation/engine";
import { cn } from "@/lib/utils";

interface SimulationResultComparisonProps {
  result: SimulationResult;
}

/** Format a number as 만원 (divide by 10000 and show 1 decimal). */
function formatManwon(value: number): string {
  const manwon = value / 10000;
  if (Math.abs(manwon) >= 1000) {
    return `${manwon.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}만원`;
  }
  return `${manwon.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만원`;
}

/** Format a percentage value with 1 decimal. */
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Format a score out of 100. */
function formatScore(value: number): string {
  return `${value.toFixed(1)}/100`;
}

interface MetricRow {
  label: string;
  before: string;
  after: string;
  diff: number;
  formattedDiff: string;
  /** true if a positive diff means improvement (e.g., net profit); false if lower is better (e.g., labor ratio). */
  positiveIsGood: boolean;
}

function getChangeIndicator(
  diff: number,
  positiveIsGood: boolean
): { color: string; Icon: typeof ArrowUp } {
  if (Math.abs(diff) < 0.01) {
    return { color: "text-muted-foreground", Icon: Minus };
  }
  const isImprovement = positiveIsGood ? diff > 0 : diff < 0;
  if (isImprovement) {
    return { color: "text-green-600", Icon: ArrowUp };
  }
  return { color: "text-red-600", Icon: ArrowDown };
}

export function SimulationResultComparison({
  result,
}: SimulationResultComparisonProps) {
  const metrics: MetricRow[] = [
    {
      label: "순이익",
      before: formatManwon(result.before.netProfit),
      after: formatManwon(result.after.netProfit),
      diff: result.changes.netProfitDiff,
      formattedDiff: `${result.changes.netProfitDiff >= 0 ? "+" : ""}${formatManwon(result.changes.netProfitDiff)}`,
      positiveIsGood: true,
    },
    {
      label: "생존점수",
      before: formatScore(result.before.survivalScore),
      after: formatScore(result.after.survivalScore),
      diff: result.changes.survivalScoreDiff,
      formattedDiff: `${result.changes.survivalScoreDiff >= 0 ? "+" : ""}${result.changes.survivalScoreDiff.toFixed(1)}`,
      positiveIsGood: true,
    },
    {
      label: "매출총이익률",
      before: formatPercent(result.before.grossMargin),
      after: formatPercent(result.after.grossMargin),
      diff: result.changes.grossMarginDiff,
      formattedDiff: `${result.changes.grossMarginDiff >= 0 ? "+" : ""}${result.changes.grossMarginDiff.toFixed(1)}%p`,
      positiveIsGood: true,
    },
    {
      label: "인건비 비율",
      before: formatPercent(result.before.laborRatio),
      after: formatPercent(result.after.laborRatio),
      diff: result.changes.laborRatioDiff,
      formattedDiff: `${result.changes.laborRatioDiff >= 0 ? "+" : ""}${result.changes.laborRatioDiff.toFixed(1)}%p`,
      positiveIsGood: false,
    },
    {
      label: "고정비 비율",
      before: formatPercent(result.before.fixedCostRatio),
      after: formatPercent(result.after.fixedCostRatio),
      diff: result.changes.fixedCostRatioDiff,
      formattedDiff: `${result.changes.fixedCostRatioDiff >= 0 ? "+" : ""}${result.changes.fixedCostRatioDiff.toFixed(1)}%p`,
      positiveIsGood: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">시뮬레이션 결과 비교</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>지표</TableHead>
              <TableHead className="text-right">현재</TableHead>
              <TableHead className="text-right">시뮬레이션</TableHead>
              <TableHead className="text-right">변화</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => {
              const { color, Icon } = getChangeIndicator(
                metric.diff,
                metric.positiveIsGood
              );
              return (
                <TableRow key={metric.label}>
                  <TableCell className="font-medium">{metric.label}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {metric.before}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {metric.after}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-medium",
                        color
                      )}
                    >
                      <Icon className="size-3.5" />
                      {metric.formattedDiff}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

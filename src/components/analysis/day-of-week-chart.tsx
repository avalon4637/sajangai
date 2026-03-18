"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyAnalysisSummary } from "@/lib/queries/daily-revenue";

interface DayOfWeekChartProps {
  data: MonthlyAnalysisSummary["dayOfWeekAverage"];
}

function formatAmount(amount: number): string {
  if (amount >= 10_000) return `${Math.round(amount / 10_000)}만`;
  return amount.toLocaleString();
}

const COLORS = [
  "hsl(var(--chart-5))", // Sun - red-ish
  "hsl(var(--chart-1))", // Mon
  "hsl(var(--chart-1))", // Tue
  "hsl(var(--chart-1))", // Wed
  "hsl(var(--chart-1))", // Thu
  "hsl(var(--chart-1))", // Fri
  "hsl(var(--chart-2))", // Sat - blue-ish
];

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const maxIdx = data.reduce(
    (maxI, d, i, arr) => (d.avgAmount > arr[maxI].avgAmount ? i : maxI),
    0
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">요일별 평균 매출</CardTitle>
          {data[maxIdx] && (
            <span className="text-xs text-muted-foreground">
              최고: {data[maxIdx].label}요일
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatAmount(v)}
              width={50}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()}원`, "평균 매출"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="avgAmount" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.day}
                  fill={
                    index === maxIdx
                      ? "hsl(var(--chart-3))"
                      : COLORS[entry.day] ?? "hsl(var(--chart-1))"
                  }
                  opacity={index === maxIdx ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

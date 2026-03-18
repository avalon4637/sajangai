"use client";

// Expense category stacked bar chart for SPEC-SERI-002
// Shows monthly expense breakdown by 9 categories

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MAJOR_CATEGORIES, CATEGORY_COLORS } from "@/types/bookkeeping";
import type { MajorCategory } from "@/types/bookkeeping";

interface MonthlyExpenseData {
  yearMonth: string; // YYYY-MM
  categories: Partial<Record<MajorCategory, number>>;
}

interface ExpenseCategoryChartProps {
  data: MonthlyExpenseData[];
}

type PeriodFilter = "3" | "6" | "12";

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}백만`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(0)}만`;
  return String(value);
}

function formatMonth(yearMonth: string): string {
  const [, month] = yearMonth.split("-");
  return `${parseInt(month, 10)}월`;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0);

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ background: entry.fill }}
            />
            <span className="text-muted-foreground text-xs">{entry.name}</span>
          </div>
          <span className="font-medium text-xs">
            {new Intl.NumberFormat("ko-KR").format(entry.value)}원
          </span>
        </div>
      ))}
      <div className="border-t mt-2 pt-2 flex justify-between">
        <span className="text-xs text-muted-foreground">합계</span>
        <span className="font-semibold text-xs">
          {new Intl.NumberFormat("ko-KR").format(total)}원
        </span>
      </div>
    </div>
  );
}

export function ExpenseCategoryChart({ data }: ExpenseCategoryChartProps) {
  const [period, setPeriod] = useState<PeriodFilter>("3");

  const periodCount = parseInt(period, 10);
  const filteredData = data.slice(-periodCount);

  // Prepare chart data
  const chartData = filteredData.map((d) => ({
    month: formatMonth(d.yearMonth),
    yearMonth: d.yearMonth,
    ...d.categories,
  }));

  // Find categories that have any data in the filtered period
  const activeCategories = MAJOR_CATEGORIES.filter((cat) =>
    filteredData.some((d) => (d.categories[cat] ?? 0) > 0)
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">월별 지출 분류</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            명세서를 업로드하면 지출 분류 차트가 표시됩니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">월별 지출 분류</CardTitle>
          <div className="flex gap-1">
            {(["3", "6", "12"] as PeriodFilter[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setPeriod(p)}
              >
                {p}개월
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
            {activeCategories.map((cat) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="expenses"
                fill={CATEGORY_COLORS[cat]}
                name={cat}
                radius={cat === activeCategories[activeCategories.length - 1] ? [2, 2, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

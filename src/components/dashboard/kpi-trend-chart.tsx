"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MonthlySummary } from "@/types/data-entry";

interface KpiTrendChartProps {
  data: MonthlySummary[];
}

function formatMonth(yearMonth: string): string {
  const [, month] = yearMonth.split("-");
  return `${parseInt(month)}월`;
}

function formatTooltipValue(value: number, name: string): [string, string] {
  const labelMap: Record<string, string> = {
    gross_margin: "매출총이익률",
    labor_ratio: "인건비 비율",
    fixed_cost_ratio: "고정비 비율",
    survival_score: "생존점수",
  };
  const suffix = name === "survival_score" ? "점" : "%";
  return [`${value.toFixed(1)}${suffix}`, labelMap[name] ?? name];
}

const legendLabelMap: Record<string, string> = {
  gross_margin: "매출총이익률",
  labor_ratio: "인건비 비율",
  fixed_cost_ratio: "고정비 비율",
  survival_score: "생존점수",
};

export function KpiTrendChart({ data }: KpiTrendChartProps) {
  const [period, setPeriod] = useState<"6" | "12">("6");

  if (data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">KPI 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            추이를 확인하려면 최소 2개월 이상의 데이터가 필요합니다
          </p>
        </CardContent>
      </Card>
    );
  }

  const monthsToShow = parseInt(period);
  const displayData = data.slice(-monthsToShow);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">KPI 추이</CardTitle>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as "6" | "12")}
        >
          <TabsList>
            <TabsTrigger value="6">6개월</TabsTrigger>
            <TabsTrigger value="12">12개월</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="year_month"
              tickFormatter={formatMonth}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip
              formatter={(value, name) =>
                formatTooltipValue(Number(value), String(name))
              }
              labelFormatter={(label) => {
                const str = String(label);
                const [year, month] = str.split("-");
                return `${year}년 ${parseInt(month)}월`;
              }}
            />
            <Legend
              formatter={(value: string) => legendLabelMap[value] ?? value}
            />
            <Line
              type="monotone"
              dataKey="gross_margin"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="labor_ratio"
              stroke="#eab308"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="fixed_cost_ratio"
              stroke="#a855f7"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="survival_score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlySummary } from "@/types/data-entry";

interface RevenueExpenseChartProps {
  data: MonthlySummary[];
}

function formatCurrency(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만`;
  }
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatTooltipValue(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

function formatMonth(yearMonth: string): string {
  const [, month] = yearMonth.split("-");
  return `${parseInt(month)}월`;
}

export function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
  if (data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">매출 vs 비용</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            추이를 확인하려면 최소 2개월 이상의 데이터가 필요합니다
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    year_month: item.year_month,
    revenue: item.total_revenue,
    cost: item.total_expense + item.total_fixed_cost,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">매출 vs 비용</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="year_month"
              tickFormatter={formatMonth}
              className="text-xs"
            />
            <YAxis tickFormatter={formatCurrency} className="text-xs" />
            <Tooltip
              formatter={(value, name) => [
                formatTooltipValue(Number(value)),
                name === "revenue" ? "매출" : "비용",
              ]}
              labelFormatter={(label) => {
                const str = String(label);
                const [year, month] = str.split("-");
                return `${year}년 ${parseInt(month)}월`;
              }}
            />
            <Legend
              formatter={(value: string) =>
                value === "revenue" ? "매출" : "비용"
              }
            />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

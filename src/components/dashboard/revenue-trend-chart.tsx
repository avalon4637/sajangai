"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlySummary } from "@/types/data-entry";

interface RevenueTrendChartProps {
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

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">매출 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            추이를 확인하려면 최소 2개월 이상의 데이터가 필요합니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">매출 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="year_month"
              tickFormatter={formatMonth}
              className="text-xs"
            />
            <YAxis tickFormatter={formatCurrency} className="text-xs" />
            <Tooltip
              formatter={(value) => [
                formatTooltipValue(Number(value)),
                "매출",
              ]}
              labelFormatter={(label) => {
                const str = String(label);
                const [year, month] = str.split("-");
                return `${year}년 ${parseInt(month)}월`;
              }}
            />
            <Line
              type="monotone"
              dataKey="total_revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

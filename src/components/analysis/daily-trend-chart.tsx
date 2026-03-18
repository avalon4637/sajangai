"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyRevenueSummary } from "@/lib/queries/daily-revenue";

interface DailyTrendChartProps {
  data: DailyRevenueSummary[];
  previousData: DailyRevenueSummary[];
  yearMonth: string;
}

function formatAmount(amount: number): string {
  if (amount >= 10_000) return `${Math.round(amount / 10_000)}만`;
  return amount.toLocaleString();
}

export function DailyTrendChart({
  data,
  previousData,
  yearMonth,
}: DailyTrendChartProps) {
  const [year, month] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonth = month === 1 ? 12 : month - 1;

  // Build data for all days in month
  const currentMap = new Map(data.map((d) => [parseInt(d.date.slice(8, 10)), d.totalAmount]));
  const prevMap = new Map(
    previousData.map((d) => [parseInt(d.date.slice(8, 10)), d.totalAmount])
  );

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      day: `${day}일`,
      current: currentMap.get(day) ?? 0,
      previous: prevMap.get(day) ?? 0,
    };
  });

  // Calculate average
  const totalRevenue = data.reduce((sum, d) => sum + d.totalAmount, 0);
  const avgRevenue = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">일별 매출 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              interval={4}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatAmount(v)}
              width={50}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toLocaleString()}원`,
                name === "current" ? `${month}월` : `${prevMonth}월`,
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend
              formatter={(value: string) =>
                value === "current" ? `${month}월` : `${prevMonth}월 (전월)`
              }
              iconType="line"
            />
            {avgRevenue > 0 && (
              <ReferenceLine
                y={avgRevenue}
                stroke="hsl(var(--chart-3))"
                strokeDasharray="5 5"
                label={{
                  value: `평균 ${formatAmount(avgRevenue)}`,
                  position: "right",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="current"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="hsl(var(--chart-2))"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              opacity={0.5}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

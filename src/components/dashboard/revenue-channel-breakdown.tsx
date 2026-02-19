"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueChannelBreakdownProps {
  data: { channel: string; total: number }[];
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

export function RevenueChannelBreakdown({
  data,
}: RevenueChannelBreakdownProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">채널별 매출</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            채널별 매출 데이터가 없습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">채널별 매출</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={formatCurrency}
              className="text-xs"
            />
            <YAxis
              type="category"
              dataKey="channel"
              className="text-xs"
              width={80}
            />
            <Tooltip
              formatter={(value) => [formatTooltipValue(Number(value)), "매출"]}
            />
            <Bar
              dataKey="total"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseBreakdownChartProps {
  data: { variable: number; fixed: number; labor: number };
}

const COLORS = ["#3b82f6", "#a855f7", "#f97316"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs fill-foreground"
    >
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const total = data.variable + data.fixed + data.labor;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">비용 구성</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            비용 데이터가 없습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: "변동비", value: data.variable },
    { name: "인건비", value: data.labor },
    { name: "기타 고정비", value: data.fixed },
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">비용 구성</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={renderLabel}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Phase 3.3 — AI call 7-day trend section
//
// Shows daily totals for calls, cost, and error rate over the last 7 days.
// Uses recharts (already installed) so no new deps.

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface AiTrendDay {
  date: string; // YYYY-MM-DD
  calls: number;
  errors: number;
  costKrw: number;
  avgLatencyMs: number;
}

export function AiTrendSection({ trend }: { trend: AiTrendDay[] }) {
  const hasData = trend.length > 0 && trend.some((d) => d.calls > 0);

  // Derived totals for the header
  const totals = trend.reduce(
    (acc, d) => ({
      calls: acc.calls + d.calls,
      errors: acc.errors + d.errors,
      costKrw: acc.costKrw + d.costKrw,
    }),
    { calls: 0, errors: 0, costKrw: 0 }
  );

  const successRate =
    totals.calls > 0
      ? Math.round(((totals.calls - totals.errors) / totals.calls) * 1000) / 10
      : 100;

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-zinc-900">AI 사용 추이</h2>
        <span className="text-xs text-zinc-500">최근 7일</span>
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-sm text-zinc-400">
            최근 7일간 AI 호출 기록이 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header totals */}
          <div className="grid grid-cols-3 gap-3">
            <MiniStat
              label="7일 호출"
              value={`${totals.calls.toLocaleString()}건`}
            />
            <MiniStat label="성공률" value={`${successRate.toFixed(1)}%`} />
            <MiniStat
              label="7일 비용"
              value={`₩${Math.round(totals.costKrw).toLocaleString()}`}
            />
          </div>

          {/* Daily call volume + error overlay */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold text-zinc-500">
              일별 호출 / 오류
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  fontSize={11}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  labelStyle={{ color: "#3f3f46" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="calls" name="호출" fill="#6366f1" />
                <Bar dataKey="errors" name="오류" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cost & latency trend */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="mb-3 text-xs font-semibold text-zinc-500">
                일별 비용 (원)
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    fontSize={11}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Line
                    type="monotone"
                    dataKey="costKrw"
                    stroke="#0891b2"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="mb-3 text-xs font-semibold text-zinc-500">
                일별 평균 지연 (ms)
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    fontSize={11}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Line
                    type="monotone"
                    dataKey="avgLatencyMs"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200">
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-zinc-900">{value}</p>
    </div>
  );
}

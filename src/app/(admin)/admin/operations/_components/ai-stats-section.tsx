// Phase 3.2 — AI call stats section (extracted from operations-client.tsx)

import { AiStatCard, AiBreakdownCard } from "./stat-cards";

export interface AiCallStats {
  total: number;
  successRate: number;
  avgLatencyMs: number;
  totalCostKrw: number;
  byModel: Record<string, number>;
  byFunction: Record<string, number>;
}

export function AiStatsSection({ stats }: { stats: AiCallStats }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-zinc-900">AI 호출 통계</h2>
        <span className="text-xs text-zinc-500">최근 24시간</span>
      </div>

      {stats.total === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-sm text-zinc-400">
            최근 24시간 동안 집계된 AI 호출이 없습니다.
          </p>
          <p className="mt-1 text-xs text-zinc-300">
            ai_call_logs 테이블에 데이터가 쌓이면 자동으로 표시됩니다.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <AiStatCard
              label="총 호출"
              value={stats.total.toLocaleString()}
              unit="건"
              tone="indigo"
            />
            <AiStatCard
              label="성공률"
              value={stats.successRate.toFixed(1)}
              unit="%"
              tone={
                stats.successRate >= 99
                  ? "emerald"
                  : stats.successRate >= 95
                    ? "amber"
                    : "rose"
              }
            />
            <AiStatCard
              label="평균 지연"
              value={stats.avgLatencyMs.toLocaleString()}
              unit="ms"
              tone={
                stats.avgLatencyMs < 3000
                  ? "emerald"
                  : stats.avgLatencyMs < 8000
                    ? "amber"
                    : "rose"
              }
            />
            <AiStatCard
              label="추정 비용"
              value={`₩${stats.totalCostKrw.toLocaleString()}`}
              unit=""
              tone="cyan"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <AiBreakdownCard title="모델별" entries={stats.byModel} />
            <AiBreakdownCard title="함수별" entries={stats.byFunction} />
          </div>
        </>
      )}
    </section>
  );
}

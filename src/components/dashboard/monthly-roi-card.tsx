// Phase 2.3 — Monthly ROI Report card
// Hero-style ROI card that appears at the end of each month once
// saveMonthlyRoiReport() has run. Designed to be the "conversion lever"
// that turns trial users into paying customers.

import type { RoiBreakdown } from "@/lib/roi/calculator";

interface MonthlyRoiCardProps {
  yearMonth: string;
  breakdown: RoiBreakdown;
  generatedAt: string;
}

function formatKrw(amount: number): string {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억`;
  if (amount >= 10_000) return `${Math.round(amount / 10_000).toLocaleString()}만`;
  return amount.toLocaleString();
}

function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  return `${y}년 ${Number(m)}월`;
}

export function MonthlyRoiCard({
  yearMonth,
  breakdown,
}: MonthlyRoiCardProps) {
  const monthLabel = formatMonthLabel(yearMonth);
  const multiple = breakdown.roiMultiple;
  const isPositive = breakdown.totalValue > breakdown.subscriptionCost;

  return (
    <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-indigo-100">
      {/* Header — gradient hero */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 px-5 py-6 text-center">
        <p className="text-xs font-semibold tracking-wide text-blue-200">
          🏆 {monthLabel} 점장 성과표
        </p>

        <div className="mt-3 flex items-baseline justify-center gap-2">
          <span className="text-4xl font-bold text-white">
            {formatKrw(breakdown.totalValue)}원
          </span>
        </div>
        <p className="mt-1 text-xs text-blue-100">
          점장이 만든 가치
        </p>

        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-blue-100">
          <span>점장 월급 {breakdown.subscriptionCost.toLocaleString()}원</span>
          <span className="text-blue-300">→</span>
          <span className="font-semibold text-amber-300">
            {multiple}배 회수
          </span>
        </div>
      </div>

      {/* Breakdown body */}
      <div className="bg-white px-5 py-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <BreakdownRow
            color="emerald"
            label="수수료 절감"
            amount={breakdown.feeSavings}
          />
          <BreakdownRow
            color="amber"
            label="이상 감지 예방"
            amount={breakdown.anomalyPrevention}
          />
          <BreakdownRow
            color="blue"
            label="비용 절감"
            amount={breakdown.costSavings}
          />
          <BreakdownRow
            color="rose"
            label="단골 복귀"
            amount={breakdown.customerRetention}
          />
          <BreakdownRow
            color="indigo"
            label="시간 절약"
            amount={breakdown.timeSavings}
          />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          {isPositive
            ? "* 보수적 기준으로 계산했어요. 실제 가치는 더 클 수 있어요."
            : "* 이번 달은 아직 데이터가 쌓이는 중이에요. 다음 달 리포트를 기대해주세요."}
        </p>
      </div>
    </div>
  );
}

// ─── Breakdown row helper ────────────────────────────────────────────────────

const ROW_COLOR: Record<string, string> = {
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  blue: "text-blue-600",
  rose: "text-rose-600",
  indigo: "text-indigo-600",
};

function BreakdownRow({
  color,
  label,
  amount,
}: {
  color: string;
  label: string;
  amount: number;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <span className={`mt-0.5 text-sm ${ROW_COLOR[color] ?? "text-slate-600"}`}>
        ●
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900 truncate">
          {amount > 0 ? `${formatKrw(amount)}원` : "-"}
        </p>
      </div>
    </div>
  );
}

"use client";

import { AlertTriangle, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UpcomingExpense {
  name: string;
  amount: number;
  date: string;
}

interface CashflowWarningCardProps {
  currentBalance: number;
  projectedBalance: number;
  daysUntilDanger: number;
  threshold: number;
  upcomingExpenses: UpcomingExpense[];
}

function formatCompact(n: number): string {
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (Math.abs(n) >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString() + "원";
}

export function CashflowWarningCard({
  currentBalance,
  projectedBalance,
  daysUntilDanger,
  threshold,
  upcomingExpenses,
}: CashflowWarningCardProps): React.JSX.Element {
  // Progress: how close current balance is to the danger threshold
  // 1.0 = at threshold (danger), 0.0 = far from threshold (safe)
  const ratio =
    currentBalance <= 0
      ? 1
      : Math.max(0, Math.min(1, 1 - (currentBalance - threshold) / currentBalance));
  const barColor =
    ratio >= 0.8
      ? "bg-red-500"
      : ratio >= 0.5
        ? "bg-amber-500"
        : "bg-emerald-500";

  const displayExpenses = upcomingExpenses.slice(0, 3);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
      {/* Header */}
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900">자금 주의</p>
          <p className="text-[10px] text-amber-600">
            {daysUntilDanger}일 후 위험 구간 진입 예상
          </p>
        </div>
      </div>

      {/* Balance comparison */}
      <div className="mb-2.5 flex items-center gap-2 text-xs">
        <div className="flex-1 rounded-lg bg-white/60 px-2.5 py-1.5 text-center">
          <p className="mb-0.5 text-[10px] text-muted-foreground">현재 잔액</p>
          <p className="font-bold text-slate-900">{formatCompact(currentBalance)}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <div className="flex-1 rounded-lg bg-white/60 px-2.5 py-1.5 text-center">
          <p className="mb-0.5 text-[10px] text-muted-foreground">예상 잔액</p>
          <p
            className={`font-bold ${projectedBalance < 0 ? "text-red-600" : "text-amber-700"}`}
          >
            {formatCompact(projectedBalance)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2.5">
        <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
          <span>안전</span>
          <span>위험 기준 {formatCompact(threshold)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-amber-100">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </div>

      {/* Upcoming expenses */}
      {displayExpenses.length > 0 && (
        <div className="mb-2.5 space-y-1">
          <p className="text-[10px] font-medium text-amber-700">
            예정된 지출
          </p>
          {displayExpenses.map((expense, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-md bg-white/50 px-2 py-1"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-amber-400" />
                <span className="text-[11px] text-slate-700">{expense.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {expense.date}
                </span>
                <span className="text-[11px] font-medium text-slate-900">
                  {formatCompact(expense.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/analysis" className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs text-amber-700"
          >
            자금 현황 보기
          </Button>
        </Link>
        <Link href="/analysis" className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs text-amber-700"
          >
            시뮬레이션
          </Button>
        </Link>
      </div>
    </div>
  );
}

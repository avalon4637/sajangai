"use client";

import { AlertTriangle, Eye, UserCheck } from "lucide-react";

interface ChurnRiskCardsProps {
  criticalCount: number;
  warningCount: number;
  recentRevisits: number;
}

/**
 * Three large alert cards showing churn risk summary.
 * Critical (red), Warning (amber), Recent revisits (green).
 */
export function ChurnRiskCards({
  criticalCount,
  warningCount,
  recentRevisits,
}: ChurnRiskCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Critical - 21+ days */}
      <div className="relative overflow-hidden rounded-xl bg-red-50 dark:bg-red-950/30 border-l-4 border-l-red-500 p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              이탈 위험 고객
            </p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {criticalCount}
              <span className="text-base font-medium ml-0.5">명</span>
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">
              21일+ 미방문
            </p>
          </div>
          <div className="rounded-lg bg-red-100 dark:bg-red-900/40 p-2">
            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Warning - 14-21 days */}
      <div className="relative overflow-hidden rounded-xl bg-amber-50 dark:bg-amber-950/30 border-l-4 border-l-amber-500 p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              이탈 주의 고객
            </p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {warningCount}
              <span className="text-base font-medium ml-0.5">명</span>
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
              14-21일 미방문
            </p>
          </div>
          <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 p-2">
            <Eye className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* Recent revisits */}
      <div className="relative overflow-hidden rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500 p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              최근 재방문
            </p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {recentRevisits}
              <span className="text-base font-medium ml-0.5">명</span>
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
              이번 주 재방문 성공
            </p>
          </div>
          <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 p-2">
            <UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

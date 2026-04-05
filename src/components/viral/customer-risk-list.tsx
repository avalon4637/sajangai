"use client";

import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export interface CustomerRisk {
  id: string;
  name: string;
  platform: string;
  lastVisit: string;
  daysSinceVisit: number;
  riskLevel: "critical" | "warning" | "watching";
  channel: string;
  recommendedAction: string;
  orderCount: number;
}

interface CustomerRiskListProps {
  customers: CustomerRisk[];
  selectedId: string | null;
  onSelect: (customer: CustomerRisk) => void;
}

/**
 * Customer risk table with row selection.
 * Critical rows have red tint, warning rows have amber tint.
 * "watching" rows show disabled "message prepare" button with tooltip.
 */
export function CustomerRiskList({
  customers,
  selectedId,
  onSelect,
}: CustomerRiskListProps) {
  if (customers.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <Users className="mx-auto size-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-semibold mb-1">
          이탈 위험이 감지되지 않았어요
        </h3>
        <p className="text-sm text-muted-foreground">
          모든 채널에서 정상적으로 활동이 이루어지고 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h3 className="font-semibold text-sm">이탈 위험 고객</h3>
        <button className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">
          전체 보기
        </button>
      </div>
      <div className="divide-y">
        {customers.map((customer) => {
          const isSelected = selectedId === customer.id;
          const isCritical = customer.riskLevel === "critical";
          const isWarning = customer.riskLevel === "warning";
          const isWatching = customer.riskLevel === "watching";

          return (
            <button
              key={customer.id}
              onClick={() => onSelect(customer)}
              className={`w-full text-left px-5 py-3 transition-colors hover:bg-muted/50 ${
                isSelected
                  ? "bg-violet-50 dark:bg-violet-950/30 border-l-2 border-l-violet-500"
                  : isCritical
                    ? "bg-red-50/50 dark:bg-red-950/10"
                    : isWarning
                      ? "bg-amber-50/50 dark:bg-amber-950/10"
                      : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">
                      {customer.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        isCritical
                          ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 text-[11px] px-1.5 py-0"
                          : isWarning
                            ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-[11px] px-1.5 py-0"
                            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[11px] px-1.5 py-0"
                      }
                    >
                      {isCritical ? "긴급" : isWarning ? "주의" : "관찰 중"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>마지막 방문: {customer.lastVisit}</span>
                    <span className="text-muted-foreground/40">|</span>
                    <span>{customer.channel}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {isWatching ? (
                    <div className="relative group">
                      <button
                        disabled
                        className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-muted-foreground cursor-not-allowed"
                      >
                        메시지 준비
                      </button>
                      <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-10 w-48">
                        <div className="rounded-md bg-foreground text-background text-[11px] px-2.5 py-1.5 shadow-lg">
                          위험 등급 도달 시 자동 발송 예정
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {customer.recommendedAction}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

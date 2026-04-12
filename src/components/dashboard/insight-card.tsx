"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface InsightCardProps {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  time?: string;
  // Phase 2.5 — 1-click execution support
  insightId?: string;
  oneClickLabel?: string;
  oneClickType?: string; // e.g. 'reply_reviews', 'run_simulation'
}

const colorMap = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-500",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-500",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-500",
  },
};

const iconMap = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

export function InsightCard({
  severity,
  title,
  description,
  actionLabel,
  actionHref,
  time,
  insightId,
  oneClickLabel,
  oneClickType,
}: InsightCardProps): React.JSX.Element {
  const c = colorMap[severity];
  const Icon = iconMap[severity];
  const [isPending, startTransition] = useTransition();
  const [acted, setActed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 2.5 — 1-click execution handler
  function handleOneClick() {
    if (!insightId || !oneClickType || acted) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/insights/act", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ insightId, actionType: oneClickType }),
        });
        if (res.ok) {
          setActed(true);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "실행 실패");
        }
      } catch {
        setError("네트워크 오류");
      }
    });
  }

  return (
    <div
      className={`rounded-2xl border ${c.border} ${c.bg} p-3 transition-opacity ${acted ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 shrink-0 ${c.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{title}</p>
            {time && (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {time}
              </span>
            )}
          </div>
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Phase 2.5 — 1-click execution button */}
            {insightId && oneClickLabel && oneClickType && (
              <Button
                variant="default"
                size="sm"
                className="h-9 px-3 text-xs"
                onClick={handleOneClick}
                disabled={isPending || acted}
              >
                {acted ? (
                  <>
                    <Check className="mr-1 h-3 w-3" /> 완료
                  </>
                ) : isPending ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> 실행 중
                  </>
                ) : (
                  <>{oneClickLabel}</>
                )}
              </Button>
            )}

            {actionLabel && actionHref && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-9 px-2 text-xs"
              >
                <Link href={actionHref}>
                  {actionLabel} <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>

          {error && (
            <p className="mt-1 text-[10px] text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

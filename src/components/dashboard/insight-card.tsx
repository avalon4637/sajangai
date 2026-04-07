"use client";

import { AlertTriangle, AlertCircle, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface InsightCardProps {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  time?: string;
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
}: InsightCardProps): React.JSX.Element {
  const c = colorMap[severity];
  const Icon = iconMap[severity];

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-3`}>
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
          {actionLabel && actionHref && (
            <Link href={actionHref}>
              <Button variant="ghost" size="sm" className="h-9 px-2 text-xs">
                {actionLabel} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { InsightEvent } from "@/lib/insights/types";

const SEVERITY_CONFIG = {
  critical: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "긴급" },
  warning: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", label: "주의" },
  info: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "참고" },
  opportunity: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "기회" },
} as const;

interface InsightCardProps {
  insight: InsightEvent;
  onAction?: (insight: InsightEvent) => void;
  onDismiss?: (insightId: string) => void;
}

export function InsightCard({ insight, onAction, onDismiss }: InsightCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const severity = SEVERITY_CONFIG[insight.severity];

  if (dismissed) return null;

  const timeAgo = getTimeAgo(insight.createdAt);

  return (
    <Card className="border-l-4" style={{ borderLeftColor: getBorderColor(insight.severity) }}>
      <CardContent className="pt-4 pb-3 px-4 space-y-3">
        {/* Header: severity + time */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={severity.color}>
            {severity.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Detection: what was found */}
        <p className="font-semibold text-sm leading-snug">
          {insight.detection.title}
        </p>

        {/* Cause: why it happened */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">원인: {insight.cause.summary}</p>
          {insight.cause.signals.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              {insight.cause.signals.slice(0, 3).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Solution: what to do */}
        <div className="bg-muted/50 rounded-md p-2.5 text-xs space-y-1">
          <p className="font-medium text-foreground">
            {insight.solution.recommendation}
          </p>
          <p className="text-muted-foreground">
            {insight.solution.expectedEffect}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {insight.action && (
            <Button
              size="sm"
              className="text-xs h-8"
              onClick={() => onAction?.(insight)}
            >
              {insight.action.label}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-muted-foreground"
            onClick={() => {
              setDismissed(true);
              onDismiss?.(insight.id);
            }}
          >
            나중에
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getBorderColor(severity: InsightEvent["severity"]): string {
  const colors = {
    critical: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
    opportunity: "#22c55e",
  };
  return colors[severity];
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

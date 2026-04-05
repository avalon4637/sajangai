"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ---------- KpiCard ----------

interface KpiItem {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
}

interface KpiCardProps {
  items: KpiItem[];
}

/**
 * Displays 2-4 KPI metrics in a compact row inside a chat bubble.
 */
export function KpiCard({ items }: KpiCardProps) {
  return (
    <Card className="my-2 p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.slice(0, 4).map((item) => (
          <div key={item.label} className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
            <p className="text-sm font-bold">{item.value}</p>
            {item.delta && (
              <div className="flex items-center gap-0.5">
                {item.trend === "up" && (
                  <TrendingUp className="size-3 text-emerald-500" />
                )}
                {item.trend === "down" && (
                  <TrendingDown className="size-3 text-red-500" />
                )}
                {item.trend === "flat" && (
                  <Minus className="size-3 text-muted-foreground" />
                )}
                <span
                  className={`text-[11px] font-medium ${
                    item.trend === "up"
                      ? "text-emerald-600"
                      : item.trend === "down"
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {item.delta}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------- InsightCard ----------

type Severity = "info" | "warning" | "critical" | "success";

interface InsightCardProps {
  severity: Severity;
  title: string;
  description: string;
  actions?: { label: string; onClick?: () => void }[];
}

const severityConfig: Record<
  Severity,
  { border: string; bg: string; icon: React.ElementType; iconColor: string }
> = {
  info: {
    border: "border-l-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    icon: Info,
    iconColor: "text-blue-500",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  critical: {
    border: "border-l-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: AlertCircle,
    iconColor: "text-red-500",
  },
  success: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
};

/**
 * Insight card with severity-colored left border and optional action buttons.
 */
export function InsightCard({ severity, title, description, actions }: InsightCardProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={`my-2 rounded-lg border-l-4 ${config.border} ${config.bg} p-3`}
    >
      <div className="flex items-start gap-2">
        <Icon className={`mt-0.5 size-4 shrink-0 ${config.iconColor}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
          {actions && actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="rounded-md border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- ReportSummary ----------

interface ReportMetric {
  label: string;
  value: string;
}

interface ReportSummaryProps {
  title: string;
  metrics: ReportMetric[];
  summary: string;
}

/**
 * Mini report card with title, metrics grid, and brief summary paragraph.
 */
export function ReportSummary({ title, metrics, summary }: ReportSummaryProps) {
  return (
    <Card className="my-2 p-3">
      <p className="text-sm font-bold mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-md bg-muted/50 px-2.5 py-1.5 text-center"
          >
            <p className="text-[11px] text-muted-foreground">{metric.label}</p>
            <p className="text-sm font-bold">{metric.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
    </Card>
  );
}

// ---------- DataTable ----------

interface DataTableProps {
  headers: string[];
  rows: string[][];
}

/**
 * Renders tabular data (up to 5 columns) cleanly inside chat.
 */
export function DataTable({ headers, rows }: DataTableProps) {
  const visibleHeaders = headers.slice(0, 5);

  return (
    <div className="my-2 overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 border-b">
          <tr>
            {visibleHeaders.map((header) => (
              <th
                key={header}
                className="px-3 py-1.5 text-left font-semibold text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-muted/30">
              {row.slice(0, 5).map((cell, cellIdx) => (
                <td key={cellIdx} className="px-3 py-1.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Insight deduplication filter (SPEC-AI-002)
// Prevents showing the same insight repeatedly within a time window.
// Exception: critical severity insights always pass through.

import type { InsightEvent, InsightResult } from "./types";

const DEDUP_WINDOW_DAYS = 7;

/**
 * Filter out insights that duplicate recent ones.
 * An insight is a duplicate if:
 *   1. Same scenarioId triggered within DEDUP_WINDOW_DAYS
 *   2. Similar detection metric (within 5% relative difference)
 * Exception: critical severity always passes through.
 */
export function deduplicateInsights(
  insights: InsightResult[],
  recentInsights: InsightEvent[]
): InsightResult[] {
  if (recentInsights.length === 0) return insights;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DEDUP_WINDOW_DAYS);

  // Build a map of recent scenario -> metric values within window
  const recentMap = new Map<string, string[]>();
  for (const recent of recentInsights) {
    const createdAt = new Date(recent.createdAt);
    if (createdAt < cutoff) continue;

    const existing = recentMap.get(recent.scenarioId) ?? [];
    existing.push(recent.detection.metric);
    recentMap.set(recent.scenarioId, existing);
  }

  return insights.filter((insight) => {
    // Critical insights always pass through
    if (insight.severity === "critical") return true;

    const recentMetrics = recentMap.get(insight.scenarioId);
    if (!recentMetrics) return true; // No recent match = not a duplicate

    // Check if any recent metric is similar
    return !recentMetrics.some((recentMetric) =>
      isSimilarMetric(insight.detection.metric, recentMetric)
    );
  });
}

/**
 * Compare two metric strings for similarity.
 * Numeric metrics: within 5% relative difference = similar.
 * Non-numeric metrics: exact string match = similar.
 */
function isSimilarMetric(a: string, b: string): boolean {
  const numA = parseMetricNumber(a);
  const numB = parseMetricNumber(b);

  if (numA !== null && numB !== null) {
    // Both numeric: check relative difference
    const max = Math.max(Math.abs(numA), Math.abs(numB));
    if (max === 0) return true;
    const relDiff = Math.abs(numA - numB) / max;
    return relDiff <= 0.05;
  }

  // Non-numeric: exact match
  return a === b;
}

function parseMetricNumber(metric: string): number | null {
  const cleaned = metric.replace(/[^0-9.\-+]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

export { DEDUP_WINDOW_DAYS };

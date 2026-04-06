// Insight scoring and prioritization (SPEC-AI-002)
// Deterministic scoring: same inputs always produce same scores.
// Formula: severity_weight × confidence × recency_boost × user_interest
// Normalized to 0-100 range. Filter threshold: 20. Max display: 5.

import type {
  InsightResult,
  InsightSeverity,
  ScoredInsight,
  UserInsightHistory,
} from "./types";

const SEVERITY_WEIGHTS: Record<InsightSeverity, number> = {
  critical: 3.0,
  warning: 1.5,
  info: 1.0,
  opportunity: 1.2,
};

// Max possible raw score = severity(3.0) × confidence(1.0) × recency(1.5) × interest(1.5)
const MAX_RAW_SCORE = 3.0 * 1.0 * 1.5 * 1.5; // = 6.75

const SCORE_FILTER_THRESHOLD = 20;
const MAX_DISPLAY_COUNT = 5;

/**
 * Score and rank insights by impact.
 * Pure function — no side effects, deterministic output.
 */
export function scoreInsights(
  insights: InsightResult[],
  userHistory?: UserInsightHistory
): ScoredInsight[] {
  if (insights.length === 0) return [];

  const scored = insights.map((insight) => {
    const raw = computeRawScore(insight, userHistory);
    // Normalize to 0-100
    const score = Math.round(Math.min((raw / MAX_RAW_SCORE) * 100, 100));
    return { insight, score, rank: 0, shouldDisplay: false };
  });

  // Sort by score descending (stable sort preserves order for equal scores)
  scored.sort((a, b) => b.score - a.score);

  // Assign ranks and display flags
  for (let i = 0; i < scored.length; i++) {
    scored[i].rank = i + 1;
    scored[i].shouldDisplay =
      scored[i].score >= SCORE_FILTER_THRESHOLD && i < MAX_DISPLAY_COUNT;
  }

  return scored;
}

function computeRawScore(
  insight: InsightResult,
  history?: UserInsightHistory
): number {
  const severityWeight = SEVERITY_WEIGHTS[insight.severity] ?? 1.0;
  const confidence = Math.max(0, Math.min(1, insight.cause.confidence));
  const recencyBoost = computeRecencyBoost(insight);
  const userInterest = computeUserInterest(insight.scenarioId, history);

  return severityWeight * confidence * recencyBoost * userInterest;
}

/**
 * Insights about recent changes (detection metric shows larger deltas) get boost.
 * Uses the detection.metric field — larger absolute values = more recent/impactful.
 */
function computeRecencyBoost(insight: InsightResult): number {
  // Parse numeric metric value (e.g., "-18%", "+25%", "3.2")
  const metricStr = insight.detection.metric.replace(/[^0-9.\-+]/g, "");
  const metricVal = parseFloat(metricStr);

  if (isNaN(metricVal)) return 1.0;

  const absVal = Math.abs(metricVal);

  // Large changes (>20) get 1.5x boost, medium (>10) get 1.2x
  if (absVal > 20) return 1.5;
  if (absVal > 10) return 1.2;
  return 1.0;
}

/**
 * Adjust score based on user's past actions on this scenario type.
 * - Scenarios user acted on: 1.2x (user finds these valuable)
 * - Scenarios user dismissed: 0.8x (user finds these noisy)
 * - Default: 1.0x
 */
function computeUserInterest(
  scenarioId: string,
  history?: UserInsightHistory
): number {
  if (!history) return 1.0;

  // Check explicit weights first
  if (history.scenarioWeights[scenarioId] !== undefined) {
    return Math.max(0.5, Math.min(1.5, history.scenarioWeights[scenarioId]));
  }

  // Fall back to acted/dismissed lists
  if (history.actedOn.includes(scenarioId)) return 1.2;
  if (history.dismissed.includes(scenarioId)) return 0.8;

  return 1.0;
}

export { SCORE_FILTER_THRESHOLD, MAX_DISPLAY_COUNT };

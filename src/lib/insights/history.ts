// User insight history tracking (SPEC-AI-002)
// Tracks which insights users acted on vs dismissed to learn preferences.
// Uses existing insight_events table status field — no new tables needed.

import { createClient } from "@/lib/supabase/server";
import type { UserInsightHistory } from "./types";

/**
 * Track a user action on an insight.
 * Updates insight_events status and acted_at timestamp.
 */
export async function trackInsightAction(
  businessId: string,
  insightId: string,
  action: "viewed" | "acted" | "dismissed"
): Promise<void> {
  const supabase = await createClient();

  const statusMap: Record<string, string> = {
    viewed: "seen",
    acted: "acted",
    dismissed: "dismissed",
  };

  const update: Record<string, unknown> = {
    status: statusMap[action],
  };

  if (action === "acted") {
    update.acted_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("insight_events")
    .update(update)
    .eq("id", insightId)
    .eq("business_id", businessId);

  if (error) throw error;
}

/**
 * Compute per-scenario interest weights from historical actions.
 * Weight formula:
 *   base = 1.0
 *   +0.1 per acted event (max +0.5)
 *   -0.1 per dismissed event (max -0.5)
 *   Clamped to [0.5, 1.5]
 */
export async function getUserInsightWeights(
  businessId: string
): Promise<Record<string, number>> {
  const supabase = await createClient();

  // Fetch recent acted/dismissed events (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("insight_events")
    .select("scenario_id, status")
    .eq("business_id", businessId)
    .in("status", ["acted", "dismissed"])
    .gte("created_at", ninetyDaysAgo.toISOString());

  if (error) throw error;
  if (!data || data.length === 0) return {};

  const weights: Record<string, number> = {};

  for (const row of data as { scenario_id: string; status: string }[]) {
    const current = weights[row.scenario_id] ?? 1.0;
    if (row.status === "acted") {
      weights[row.scenario_id] = Math.min(1.5, current + 0.1);
    } else if (row.status === "dismissed") {
      weights[row.scenario_id] = Math.max(0.5, current - 0.1);
    }
  }

  return weights;
}

/**
 * Build complete user insight history for scoring.
 */
export async function getUserInsightHistory(
  businessId: string
): Promise<UserInsightHistory> {
  const supabase = await createClient();

  // Fetch acted and dismissed scenario IDs (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("insight_events")
    .select("scenario_id, status")
    .eq("business_id", businessId)
    .in("status", ["acted", "dismissed"])
    .gte("created_at", ninetyDaysAgo.toISOString());

  if (error) throw error;

  const actedOn = new Set<string>();
  const dismissed = new Set<string>();
  const scenarioWeights: Record<string, number> = {};

  for (const row of (data ?? []) as { scenario_id: string; status: string }[]) {
    if (row.status === "acted") {
      actedOn.add(row.scenario_id);
    } else {
      dismissed.add(row.scenario_id);
    }

    const current = scenarioWeights[row.scenario_id] ?? 1.0;
    if (row.status === "acted") {
      scenarioWeights[row.scenario_id] = Math.min(1.5, current + 0.1);
    } else {
      scenarioWeights[row.scenario_id] = Math.max(0.5, current - 0.1);
    }
  }

  return {
    businessId,
    actedOn: [...actedOn],
    dismissed: [...dismissed],
    scenarioWeights,
  };
}

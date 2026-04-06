import { createClient } from "@/lib/supabase/server";
import type {
  InsightEvent,
  InsightResult,
  InsightStatus,
  ScenarioContext,
  ScoredInsightEvent,
} from "./types";
import { scoreInsights } from "./scoring";
import { getUserInsightHistory } from "./history";

// insight_events and action_results are not yet in generated DB types.
// Use untyped queries until types are regenerated after migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rawClient(): Promise<any> {
  return await createClient();
}

// --- Read ---

export async function getActiveInsights(
  businessId: string
): Promise<ScoredInsightEvent[]> {
  const supabase = await rawClient();

  const { data, error } = await supabase
    .from("insight_events")
    .select("*")
    .eq("business_id", businessId)
    .in("status", ["new", "seen"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  const events = (data ?? []).map(mapRow);

  // Apply scoring and filtering (SPEC-AI-002)
  const userHistory = await getUserInsightHistory(businessId);
  const insightResults = events.map(eventToInsightResult);
  const scored = scoreInsights(insightResults, userHistory);

  // Map scored results back to events, filtered and ranked
  return scored
    .filter((s) => s.shouldDisplay)
    .map((s) => {
      const event = events.find(
        (e: InsightEvent) => e.scenarioId === s.insight.scenarioId
      )!;
      return {
        event,
        score: s.score,
        rank: s.rank,
        shouldDisplay: s.shouldDisplay,
      };
    });
}

/**
 * Get active insights without scoring (legacy compatibility).
 */
export async function getActiveInsightsRaw(
  businessId: string
): Promise<InsightEvent[]> {
  const supabase = await rawClient();

  const { data, error } = await supabase
    .from("insight_events")
    .select("*")
    .eq("business_id", businessId)
    .in("status", ["new", "seen"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapRow);
}

/**
 * Get recent insights for deduplication (last 7 days, all statuses).
 */
export async function getRecentInsightsForDedup(
  businessId: string
): Promise<InsightEvent[]> {
  const supabase = await rawClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("insight_events")
    .select("*")
    .eq("business_id", businessId)
    .gte("created_at", sevenDaysAgo.toISOString());

  if (error) throw error;

  return (data ?? []).map(mapRow);
}

export async function getInsightCount(businessId: string): Promise<number> {
  const supabase = await rawClient();

  const { count, error } = await supabase
    .from("insight_events")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "new");

  if (error) throw error;
  return count ?? 0;
}

// --- Write ---

export async function upsertInsight(
  businessId: string,
  result: InsightResult
): Promise<void> {
  const supabase = await rawClient();

  // Expire existing active insight for same scenario (safe dedup, no delete)
  await supabase
    .from("insight_events")
    .update({ status: "expired" })
    .eq("business_id", businessId)
    .eq("scenario_id", result.scenarioId)
    .in("status", ["new", "seen"]);

  const { error } = await supabase.from("insight_events").insert({
    business_id: businessId,
    scenario_id: result.scenarioId,
    category: result.category,
    severity: result.severity,
    detection: result.detection,
    cause: result.cause,
    solution: result.solution,
    action: result.action ?? null,
    status: "new",
  });

  if (error) throw error;
}

export async function updateInsightStatus(
  insightId: string,
  status: InsightStatus
): Promise<void> {
  const supabase = await rawClient();

  const update: Record<string, unknown> = { status };
  if (status === "acted") {
    update.acted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("insight_events")
    .update(update)
    .eq("id", insightId);

  if (error) throw error;
}

export async function createActionResult(params: {
  insightEventId: string;
  businessId: string;
  actionType: string;
  resultData?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await rawClient();

  const { error } = await supabase.from("action_results").insert({
    insight_event_id: params.insightEventId,
    business_id: params.businessId,
    action_type: params.actionType,
    result_data: params.resultData ?? null,
  });

  if (error) throw error;
}

// --- Scenario Context Loader ---

export async function loadScenarioContext(
  businessId: string
): Promise<ScenarioContext> {
  const supabase = await createClient();
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const since = fourWeeksAgo.toISOString().split("T")[0];

  const [revenueRes, expenseRes, fixedCostRes, reviewRes] = await Promise.all([
    supabase
      .from("revenues")
      .select("date, amount, channel, category")
      .eq("business_id", businessId)
      .gte("date", since)
      .order("date"),
    supabase
      .from("expenses")
      .select("date, amount, category, type")
      .eq("business_id", businessId)
      .gte("date", since)
      .order("date"),
    supabase
      .from("fixed_costs")
      .select("category, amount, start_date")
      .eq("business_id", businessId)
      .order("start_date", { ascending: false })
      .limit(20),
    supabase
      .from("delivery_reviews")
      .select("review_date, rating, sentiment_score, keywords, platform, reply_status")
      .eq("business_id", businessId)
      .gte("review_date", since)
      .order("review_date"),
  ]);

  return {
    businessId,
    revenues: (revenueRes.data ?? []).map((r) => ({
      date: r.date,
      amount: Number(r.amount),
      channel: r.channel ?? r.category ?? "unknown",
      fees: undefined,
    })),
    expenses: (expenseRes.data ?? []).map((e) => ({
      date: e.date,
      amount: Number(e.amount),
      category: e.category,
      isFixed: e.type === "fixed",
    })),
    fixedCosts: (fixedCostRes.data ?? []).map((f) => ({
      category: f.category,
      amount: Number(f.amount),
      month: f.start_date ? (f.start_date as string).slice(0, 7) : "unknown",
    })),
    reviews: (reviewRes.data ?? []).map((r) => ({
      date: r.review_date,
      rating: r.rating,
      sentiment: r.sentiment_score ?? 0,
      keywords: r.keywords ?? [],
      platform: r.platform ?? "unknown",
      replyStatus: r.reply_status ?? "none",
    })),
  };
}

// --- Helpers ---

function eventToInsightResult(event: InsightEvent): InsightResult {
  return {
    scenarioId: event.scenarioId,
    category: event.category,
    severity: event.severity,
    detection: event.detection,
    cause: event.cause,
    solution: event.solution,
    action: event.action,
  };
}

function mapRow(row: Record<string, unknown>): InsightEvent {
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    scenarioId: row.scenario_id as string,
    category: row.category as InsightEvent["category"],
    severity: row.severity as InsightEvent["severity"],
    detection: row.detection as InsightEvent["detection"],
    cause: row.cause as InsightEvent["cause"],
    solution: row.solution as InsightEvent["solution"],
    action: (row.action as InsightEvent["action"]) ?? undefined,
    status: row.status as InsightEvent["status"],
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    actedAt: (row.acted_at as string) ?? null,
  };
}

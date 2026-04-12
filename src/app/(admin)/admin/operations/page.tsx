import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  OperationsClient,
  type AiCallStats,
  type HyphenStatus,
  type NotificationLogEntry,
} from "./operations-client";
import type { AiCallLog } from "@/types/schema";
import type { AiTrendDay } from "./_components/ai-trend-section";

export const dynamic = "force-dynamic";

// Phase 3.1 — shape we actually need for stats (subset of AiCallLog)
type AiCallLogRow = Pick<
  AiCallLog,
  "status" | "latency_ms" | "cost_krw" | "model" | "function_name"
>;

// Phase 3.3 — trend aggregation shape
type TrendLogRow = Pick<
  AiCallLog,
  "status" | "latency_ms" | "cost_krw" | "created_at"
>;

/**
 * Group ai_call_logs rows by calendar day (KST) and return 7 buckets.
 * Missing days are zero-filled so the chart always has 7 bars.
 */
function computeAiTrend(rows: TrendLogRow[]): AiTrendDay[] {
  const buckets = new Map<
    string,
    { calls: number; errors: number; costKrw: number; latencySum: number }
  >();

  // Pre-seed 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { calls: 0, errors: 0, costKrw: 0, latencySum: 0 });
  }

  for (const row of rows) {
    const day = (row.created_at ?? "").slice(0, 10);
    if (!buckets.has(day)) continue;
    const bucket = buckets.get(day)!;
    bucket.calls += 1;
    if (row.status === "error") bucket.errors += 1;
    bucket.costKrw += Number(row.cost_krw ?? 0);
    bucket.latencySum += row.latency_ms ?? 0;
  }

  return Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    calls: b.calls,
    errors: b.errors,
    costKrw: Math.round(b.costKrw * 100) / 100,
    avgLatencyMs: b.calls > 0 ? Math.round(b.latencySum / b.calls) : 0,
  }));
}

/**
 * Aggregate raw ai_call_logs rows into dashboard-ready stats.
 * Kept server-side so we can later swap to a SQL view without touching the client.
 */
function computeAiStats(rows: AiCallLogRow[]): AiCallStats {
  const total = rows.length;
  if (total === 0) {
    return {
      total: 0,
      successRate: 0,
      avgLatencyMs: 0,
      totalCostKrw: 0,
      byModel: {},
      byFunction: {},
    };
  }

  let successCount = 0;
  let latencySum = 0;
  let costSum = 0;
  const byModel: Record<string, number> = {};
  const byFunction: Record<string, number> = {};

  for (const row of rows) {
    if (row.status === "success") successCount += 1;
    latencySum += row.latency_ms ?? 0;
    costSum += Number(row.cost_krw ?? 0);
    if (row.model) byModel[row.model] = (byModel[row.model] ?? 0) + 1;
    if (row.function_name)
      byFunction[row.function_name] = (byFunction[row.function_name] ?? 0) + 1;
  }

  return {
    total,
    successRate: Math.round((successCount / total) * 1000) / 10,
    avgLatencyMs: Math.round(latencySum / total),
    totalCostKrw: Math.round(costSum * 100) / 100,
    byModel,
    byFunction,
  };
}

export default async function AdminOperationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch businesses for trigger dropdown
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, naver_place_id, naver_last_synced_at")
    .order("name");

  // Fetch recent reports (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: reports } = await supabase
    .from("daily_reports")
    .select("id, business_id, report_date, report_type, summary, created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(100);

  // Fetch AI call logs (last 24h) for Section D — Phase 0.6
  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 1);
  const { data: aiLogs } = await supabase
    .from("ai_call_logs")
    .select("status, latency_ms, cost_krw, model, function_name")
    .gte("created_at", dayAgo.toISOString())
    .limit(10000);

  const aiStats = computeAiStats((aiLogs ?? []) as AiCallLogRow[]);

  // Phase 3.3 — AI 7-day trend (daily aggregate for charts)
  const weekAgoForTrend = new Date();
  weekAgoForTrend.setDate(weekAgoForTrend.getDate() - 7);
  const { data: trendLogsRaw } = await supabase
    .from("ai_call_logs")
    .select("status, latency_ms, cost_krw, created_at")
    .gte("created_at", weekAgoForTrend.toISOString())
    .limit(50000);

  const aiTrend = computeAiTrend((trendLogsRaw ?? []) as TrendLogRow[]);

  // Phase 1.3 — Recent notification history (last 7 days) from agent_activity_log
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: notifLogsRaw } = await supabase
    .from("agent_activity_log")
    .select("id, business_id, summary, details, created_at")
    .eq("action", "message_sent")
    .gte("created_at", weekAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  const notificationLogs = (notifLogsRaw ?? []).map((row) => {
    const details = row.details as Record<string, unknown> | null;
    return {
      id: row.id,
      businessId: row.business_id,
      summary: row.summary ?? "",
      createdAt: row.created_at,
      templateId: (details?.templateId as string) ?? "",
      channel: (details?.channel as string) ?? "",
      success: details?.success === true,
      error: (details?.error as string) ?? null,
    };
  });

  // Hyphen status (Phase 1.1) — active connections + most recent sync
  const { count: activeConnectionCount } = await supabase
    .from("api_connections")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { data: lastSyncRow } = await supabase
    .from("sync_logs")
    .select("status, sync_type, started_at")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hyphenConfigured =
    !!process.env.HYPHEN_USER_ID && !!process.env.HYPHEN_HKEY;
  const hyphenTestMode = process.env.HYPHEN_TEST_MODE === "true";

  const hyphenStatus: HyphenStatus = {
    configured: hyphenConfigured,
    testMode: hyphenTestMode,
    activeConnectionCount: activeConnectionCount ?? 0,
    lastSyncAt: lastSyncRow?.started_at ?? null,
    lastSyncStatus: lastSyncRow?.status ?? null,
    lastSyncType: lastSyncRow?.sync_type ?? null,
  };

  const bizMap = Object.fromEntries(
    (businesses ?? []).map((b) => [b.id, b.name])
  );

  return (
    <OperationsClient
      businesses={(businesses ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        naverPlaceId: b.naver_place_id,
        naverLastSyncedAt: b.naver_last_synced_at,
      }))}
      reports={(reports ?? []).map((r) => ({
        ...r,
        businessName: bizMap[r.business_id] ?? "Unknown",
      }))}
      aiStats={aiStats}
      aiTrend={aiTrend}
      hyphenStatus={hyphenStatus}
      notificationLogs={notificationLogs.map((log) => ({
        ...log,
        businessName: bizMap[log.businessId] ?? "Unknown",
      })) as NotificationLogEntry[]}
    />
  );
}

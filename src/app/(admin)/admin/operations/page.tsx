import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  OperationsClient,
  type AiCallStats,
  type HyphenStatus,
  type NotificationLogEntry,
} from "./operations-client";

export const dynamic = "force-dynamic";

interface AiCallLogRow {
  status: string | null;
  latency_ms: number | null;
  cost_krw: number | string | null;
  model: string | null;
  function_name: string | null;
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
      hyphenStatus={hyphenStatus}
      notificationLogs={notificationLogs.map((log) => ({
        ...log,
        businessName: bizMap[log.businessId] ?? "Unknown",
      })) as NotificationLogEntry[]}
    />
  );
}

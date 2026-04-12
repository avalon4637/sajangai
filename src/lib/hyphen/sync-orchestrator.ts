// Sync orchestrator
// Coordinates all active sync operations for a business
// Provides error isolation: each sync runs independently with its own error handling

import { createClient } from "@/lib/supabase/server";
import { decryptCredentials } from "./encryption";
import { syncDeliverySales, syncDeliveryReviews } from "./sync-delivery";
import { syncCardSales } from "./sync-card";
import type { DeliveryPlatform } from "./types";

/** Individual sync operation result */
interface SyncOperationResult {
  type: string;
  success: boolean;
  recordsCount: number;
  error?: string;
}

/** Overall sync result for a business */
export interface SyncOrchestratorResult {
  businessId: string;
  startedAt: string;
  completedAt: string;
  operations: SyncOperationResult[];
  totalRecords: number;
  hasErrors: boolean;
}

/** Active API connection with decrypted credentials */
interface ActiveConnection {
  id: string;
  provider: string;
  connection_type: "card_sales" | "delivery";
  last_sync_at: string | null;
  encrypted_credentials: string | null;
  config: Record<string, unknown>;
}

/**
 * Decrypt credentials from a connection record.
 * Returns empty object if credentials are not set or decryption fails.
 */
function getCredentials(
  connection: ActiveConnection
): Record<string, string> | undefined {
  if (!connection.encrypted_credentials) {
    return undefined;
  }
  try {
    return decryptCredentials(connection.encrypted_credentials);
  } catch (error) {
    console.error(
      `[Orchestrator] Failed to decrypt credentials for connection ${connection.id}:`,
      error
    );
    return undefined;
  }
}

/**
 * Log sync result to sync_logs table.
 * Creates a record for tracking sync history.
 */
async function logSyncResult(
  connectionId: string,
  syncType: "card_sales" | "delivery",
  result: SyncOperationResult
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("sync_logs").insert({
      connection_id: connectionId,
      sync_type: syncType,
      status: result.success ? "completed" : "failed",
      records_count: result.recordsCount,
      error_message: result.error ?? null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    // Non-critical - log but continue
    console.error("[Orchestrator] Failed to write sync log:", error);
  }
}

/**
 * Update last_sync_at on successful sync completion.
 */
async function updateLastSyncAt(connectionId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("api_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
        status: "active",
      } as Record<string, unknown>)
      .eq("id", connectionId);
  } catch (error) {
    console.error("[Orchestrator] Failed to update last_sync_at:", error);
  }
}

/**
 * Run all active syncs for a business.
 * Each sync operation is independent - errors in one do not prevent others.
 *
 * @param businessId - Business ID to sync
 * @returns Aggregated sync results with per-operation details
 */
/**
 * Check if sync is allowed based on subscription plan.
 * Trial: max 1 sync per week. Paid: unlimited.
 */
async function isSyncAllowed(businessId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("business_id", businessId)
    .in("status", ["trial", "active"])
    .maybeSingle();

  // No subscription = allow (graceful)
  if (!sub) return true;

  // Paid users: always allowed
  if (sub.plan === "paid" && sub.status === "active") return true;

  // Trial users: check last sync was 7+ days ago
  const { data: lastSync } = await supabase
    .from("sync_logs")
    .select("created_at")
    .eq("business_id", businessId)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastSync) return true; // First sync always allowed

  const daysSinceSync = Math.floor(
    (Date.now() - new Date(lastSync.created_at).getTime()) / 86_400_000
  );

  return daysSinceSync >= 7;
}

export async function runSync(
  businessId: string
): Promise<SyncOrchestratorResult> {
  const startedAt = new Date().toISOString();
  const operations: SyncOperationResult[] = [];

  // Check sync rate limit based on subscription
  const allowed = await isSyncAllowed(businessId);
  if (!allowed) {
    return {
      businessId,
      startedAt,
      completedAt: new Date().toISOString(),
      operations: [
        {
          type: "rate_limit",
          success: false,
          recordsCount: 0,
          error: "Trial plan: sync limited to once per week",
        },
      ],
      totalRecords: 0,
      hasErrors: true,
    };
  }

  const supabase = await createClient();

  // Fetch all active connections for this business
  const { data: connections, error: fetchError } = await supabase
    .from("api_connections")
    .select("id, provider, connection_type, last_sync_at, encrypted_credentials, config")
    .eq("business_id", businessId)
    .eq("status", "active");

  if (fetchError) {
    return {
      businessId,
      startedAt,
      completedAt: new Date().toISOString(),
      operations: [
        {
          type: "fetch_connections",
          success: false,
          recordsCount: 0,
          error: fetchError.message,
        },
      ],
      totalRecords: 0,
      hasErrors: true,
    };
  }

  if (!connections || connections.length === 0) {
    // No active connections.
    // Mock fallback is OFF by default as of Phase 1.1 — opt-in via
    // HYPHEN_ALLOW_MOCK_FALLBACK=true (non-prod demos only).
    // In production, surface the empty state so ops can see missing credentials.
    if (process.env.HYPHEN_ALLOW_MOCK_FALLBACK === "true") {
      const mockOp = await runMockSync(businessId);
      operations.push(...mockOp);
    } else {
      operations.push({
        type: "no_active_connections",
        success: false,
        recordsCount: 0,
        error:
          "No active api_connections for this business. Add credentials in /settings/connections.",
      });
    }
  } else {
    // Process each connection independently
    for (const connection of connections as ActiveConnection[]) {
      const credentials = getCredentials(connection);

      if (connection.connection_type === "card_sales") {
        // Sync card sales
        try {
          const result = await syncCardSales(
            businessId,
            credentials,
            connection.last_sync_at
          );
          const opResult: SyncOperationResult = {
            type: "card_sales",
            success: !result.error,
            recordsCount: result.approvalsCount,
            error: result.error,
          };
          operations.push(opResult);
          await logSyncResult(connection.id, "card_sales", opResult);
          if (!result.error) {
            await updateLastSyncAt(connection.id);
          }
        } catch (error) {
          const opResult: SyncOperationResult = {
            type: "card_sales",
            success: false,
            recordsCount: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          };
          operations.push(opResult);
          await logSyncResult(connection.id, "card_sales", opResult);
        }
      } else if (connection.connection_type === "delivery") {
        // Sync delivery sales and reviews for each platform
        const platforms: DeliveryPlatform[] = ["baemin", "coupangeats", "yogiyo"];

        for (const platform of platforms) {
          // Sync sales
          try {
            const salesResult = await syncDeliverySales(
              businessId,
              platform,
              credentials,
              connection.last_sync_at
            );
            const salesOp: SyncOperationResult = {
              type: `delivery_sales_${platform}`,
              success: !salesResult.error,
              recordsCount: salesResult.salesCount,
              error: salesResult.error,
            };
            operations.push(salesOp);
          } catch (error) {
            operations.push({
              type: `delivery_sales_${platform}`,
              success: false,
              recordsCount: 0,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }

          // Sync reviews
          try {
            const reviewResult = await syncDeliveryReviews(
              businessId,
              platform,
              credentials,
              connection.last_sync_at
            );
            const reviewOp: SyncOperationResult = {
              type: `delivery_reviews_${platform}`,
              success: !reviewResult.error,
              recordsCount: reviewResult.reviewCount,
              error: reviewResult.error,
            };
            operations.push(reviewOp);
          } catch (error) {
            operations.push({
              type: `delivery_reviews_${platform}`,
              success: false,
              recordsCount: 0,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        // Update connection-level sync time
        const allDeliverySuccess = operations
          .filter((op) => op.type.startsWith("delivery_"))
          .every((op) => op.success);
        if (allDeliverySuccess) {
          await updateLastSyncAt(connection.id);
        }
        // Log one aggregate entry for the delivery connection
        const totalDeliveryRecords = operations
          .filter((op) => op.type.startsWith("delivery_"))
          .reduce((sum, op) => sum + op.recordsCount, 0);
        await logSyncResult(connection.id, "delivery", {
          type: "delivery",
          success: allDeliverySuccess,
          recordsCount: totalDeliveryRecords,
        });
      }
    }
  }

  const completedAt = new Date().toISOString();
  const totalRecords = operations.reduce((sum, op) => sum + op.recordsCount, 0);
  const hasErrors = operations.some((op) => !op.success);

  return {
    businessId,
    startedAt,
    completedAt,
    operations,
    totalRecords,
    hasErrors,
  };
}

/**
 * Run mock sync operations when no active connections exist.
 * Provides sample data for demonstration purposes.
 */
async function runMockSync(
  businessId: string
): Promise<SyncOperationResult[]> {
  const operations: SyncOperationResult[] = [];

  // Mock card sales
  try {
    const cardResult = await syncCardSales(businessId, undefined, null);
    operations.push({
      type: "card_sales",
      success: !cardResult.error,
      recordsCount: cardResult.approvalsCount,
      error: cardResult.error,
    });
  } catch (error) {
    operations.push({
      type: "card_sales",
      success: false,
      recordsCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Mock delivery for baemin
  const platforms: DeliveryPlatform[] = ["baemin"];
  for (const platform of platforms) {
    try {
      const result = await syncDeliverySales(businessId, platform, undefined, null);
      operations.push({
        type: `delivery_sales_${platform}`,
        success: !result.error,
        recordsCount: result.salesCount,
        error: result.error,
      });
    } catch (error) {
      operations.push({
        type: `delivery_sales_${platform}`,
        success: false,
        recordsCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return operations;
}

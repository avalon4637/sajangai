import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type ApiConnection = Tables<"api_connections">;
type SyncLog = Tables<"sync_logs">;

/**
 * Get all API connections for a business.
 */
export async function getConnections(
  businessId: string
): Promise<ApiConnection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_connections")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch connections:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get a specific connection by type for a business.
 */
export async function getConnectionByType(
  businessId: string,
  connectionType: "card_sales" | "delivery"
): Promise<ApiConnection | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_connections")
    .select("*")
    .eq("business_id", businessId)
    .eq("connection_type", connectionType)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch connection:", error.message);
    return null;
  }

  return data;
}

/**
 * Get recent sync logs for a connection.
 */
export async function getSyncLogs(
  connectionId: string,
  limit: number = 10
): Promise<SyncLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sync_logs")
    .select("*")
    .eq("connection_id", connectionId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch sync logs:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get all sync logs for a business (across all connections).
 * Uses two-step query since Supabase types lack relationship definitions.
 */
export async function getAllSyncLogs(
  businessId: string,
  limit: number = 10
): Promise<SyncLog[]> {
  const supabase = await createClient();

  // First get all connection IDs for this business
  const { data: connections } = await supabase
    .from("api_connections")
    .select("id")
    .eq("business_id", businessId);

  if (!connections || connections.length === 0) {
    return [];
  }

  const connectionIds = connections.map((c) => c.id);

  const { data, error } = await supabase
    .from("sync_logs")
    .select("*")
    .in("connection_id", connectionIds)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch sync logs:", error.message);
    return [];
  }

  return data ?? [];
}

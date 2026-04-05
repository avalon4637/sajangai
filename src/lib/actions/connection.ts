"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { encryptCredentials } from "@/lib/hyphen/encryption";

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Create a new API connection for the current business.
 */
export async function createConnection(
  connectionType: "card_sales" | "delivery"
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const supabase = await createClient();

    // Check if connection already exists
    const { data: existing } = await supabase
      .from("api_connections")
      .select("id")
      .eq("business_id", businessId)
      .eq("connection_type", connectionType)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "이미 연결이 존재합니다." };
    }

    const { error } = await supabase.from("api_connections").insert({
      business_id: businessId,
      provider: "hyphen",
      connection_type: connectionType,
      status: "inactive",
      config: {},
    });

    if (error) {
      return { success: false, error: `연결 생성 실패: ${error.message}` };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * Save encrypted credentials for an API connection and activate it.
 */
export async function saveConnectionCredentials(
  connectionId: string,
  credentials: Record<string, string>
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const supabase = await createClient();

    const encrypted = encryptCredentials(credentials);

    const { error } = await supabase
      .from("api_connections")
      .update({
        encrypted_credentials: encrypted,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: `자격증명 저장 실패: ${error.message}` };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * Update the status of an API connection.
 */
export async function updateConnectionStatus(
  connectionId: string,
  status: "active" | "inactive" | "error" | "expired"
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("api_connections")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", connectionId)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: `상태 업데이트 실패: ${error.message}` };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * Delete an API connection.
 */
export async function deleteConnection(
  connectionId: string
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("api_connections")
      .delete()
      .eq("id", connectionId)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: `연결 삭제 실패: ${error.message}` };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * Create a sync log entry when starting a sync operation.
 */
export async function createSyncLog(
  connectionId: string,
  syncType: "card_sales" | "delivery"
): Promise<ActionResult & { logId?: string }> {
  try {
    await getCurrentBusinessId(); // Verify authorization
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sync_logs")
      .insert({
        connection_id: connectionId,
        sync_type: syncType,
        status: "pending",
        records_count: 0,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: `동기화 로그 생성 실패: ${error.message}` };
    }

    revalidatePath("/settings");
    return { success: true, logId: data.id };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * Complete a sync log entry with final status and record count.
 */
export async function completeSyncLog(
  logId: string,
  status: "completed" | "failed",
  recordsCount: number,
  errorMessage?: string
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const supabase = await createClient();

    // Verify the sync log belongs to user's business via api_connections
    const { data: log } = await supabase
      .from("sync_logs")
      .select("id, connection_id")
      .eq("id", logId)
      .single();

    if (!log) {
      return { success: false, error: "동기화 로그를 찾을 수 없습니다." };
    }

    const { data: conn } = await supabase
      .from("api_connections")
      .select("id")
      .eq("id", log.connection_id)
      .eq("business_id", businessId)
      .single();

    if (!conn) {
      return { success: false, error: "권한이 없습니다." };
    }

    const { error } = await supabase
      .from("sync_logs")
      .update({
        status,
        records_count: recordsCount,
        error_message: errorMessage ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", logId);

    if (error) {
      return {
        success: false,
        error: `동기화 로그 업데이트 실패: ${error.message}`,
      };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

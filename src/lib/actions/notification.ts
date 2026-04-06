"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import type { NotificationPreferences } from "@/lib/messaging/notification-preferences";
import { DEFAULT_PREFERENCES } from "@/lib/messaging/notification-preferences";

/**
 * Fetch notification preferences for the current business.
 * Returns DEFAULT_PREFERENCES if none are set yet.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const businessId = await getCurrentBusinessId();

  const { data } = await supabase
    .from("user_profiles")
    .select("notification_preferences")
    .eq("business_id", businessId)
    .single();

  if (!data?.notification_preferences) {
    return DEFAULT_PREFERENCES;
  }

  // Merge with defaults to fill any missing keys from schema evolution
  return { ...DEFAULT_PREFERENCES, ...data.notification_preferences };
}

/**
 * Update notification preferences for the current business.
 * Creates user_profiles row if it doesn't exist (upsert).
 */
export async function updateNotificationPreferences(
  prefs: NotificationPreferences
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const businessId = await getCurrentBusinessId();

  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        business_id: businessId,
        notification_preferences: prefs as unknown as Record<string, unknown>,
      },
      { onConflict: "business_id" }
    );

  if (error) {
    console.error("[notification] update preferences error:", error);
    return { success: false, error: "알림 설정 저장에 실패했습니다." };
  }

  revalidatePath("/settings/notifications");
  return { success: true };
}

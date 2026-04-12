// AI daily call limit checker
// Prevents trial users from burning unlimited Claude API tokens.
// Uses the existing ai_call_logs table to count today's calls per business.

import { createClient } from "@/lib/supabase/server";

const DAILY_LIMITS: Record<string, number> = {
  trial: 30,
  active: 200,
};

interface DailyLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

/**
 * Check whether a business has remaining AI calls for today (KST).
 * Counts rows in ai_call_logs where business_id matches and
 * created_at >= today 00:00 KST.
 *
 * @param businessId - The business UUID
 * @param plan - "trial" or "active" (maps to daily limit tier)
 */
export async function checkAiDailyLimit(
  businessId: string,
  plan: "trial" | "active"
): Promise<DailyLimitResult> {
  const limit = DAILY_LIMITS[plan] ?? DAILY_LIMITS.trial;

  // Calculate today's 00:00 KST in UTC
  // KST = UTC+9, so today 00:00 KST = today 00:00 UTC - 9 hours offset
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstTodayStart = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate())
  );
  // Convert KST midnight back to UTC
  const utcTodayStartKst = new Date(kstTodayStart.getTime() - kstOffset);

  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("ai_call_logs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", utcTodayStartKst.toISOString());

    if (error) {
      // On DB error, allow the request (fail open) but log
      console.error("[ai-daily-limit] count query failed:", error.message);
      return { allowed: true, remaining: limit, limit };
    }

    const used = count ?? 0;
    const remaining = Math.max(0, limit - used);

    return {
      allowed: used < limit,
      remaining,
      limit,
    };
  } catch (err) {
    // On unexpected error, fail open
    console.error("[ai-daily-limit] unexpected error:", err);
    return { allowed: true, remaining: limit, limit };
  }
}

// Phase 1.7 — Trial D+1 ~ D+6 nurture cron
//
// Runs once per day at 10:00 KST (after the 08:00 briefing cron so users
// already have fresh data when they get the nurture nudge).
//
// Computes the trial day number from subscriptions.trial_ends_at:
//   day_number = 7 - days_remaining_until_trial_end
//
// Sends SMS (later AlimTalk) on D+1, D+3, D+5, D+6 only. D+2, D+4, D+7
// deliberately have no nurture to avoid fatigue.
//
// Dedup: agent_activity_log.action='message_sent' is checked for today so we
// never send twice if the cron runs twice.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTrialNurture } from "@/lib/messaging/sender";

const NURTURE_DAYS = new Set([1, 3, 5, 6]);
const TRIAL_LENGTH_DAYS = 7;

interface TrialRow {
  id: string;
  business_id: string;
  trial_ends_at: string | null;
}

function computeDayNumber(trialEndsAtIso: string): number {
  const trialEnd = new Date(trialEndsAtIso);
  const now = new Date();
  const msRemaining = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / 86_400_000);
  const dayNumber = TRIAL_LENGTH_DAYS - daysRemaining;
  return dayNumber;
}

export async function GET(request: Request) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Fetch all businesses currently in trial
    const { data: trials } = await supabase
      .from("subscriptions")
      .select("id, business_id, trial_ends_at")
      .eq("status", "trial")
      .not("trial_ends_at", "is", null);

    const typedTrials = (trials ?? []) as TrialRow[];

    const results: Array<{
      businessId: string;
      dayNumber: number;
      status: "sent" | "skipped" | "error";
      reason?: string;
    }> = [];

    // Dedup window: today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartIso = todayStart.toISOString();

    for (const trial of typedTrials) {
      if (!trial.trial_ends_at) continue;

      const dayNumber = computeDayNumber(trial.trial_ends_at);

      if (!NURTURE_DAYS.has(dayNumber)) {
        results.push({
          businessId: trial.business_id,
          dayNumber,
          status: "skipped",
          reason: "not a nurture day",
        });
        continue;
      }

      // Dedup: already sent today?
      const { data: existing } = await supabase
        .from("agent_activity_log")
        .select("id")
        .eq("business_id", trial.business_id)
        .eq("action", "message_sent")
        .gte("created_at", todayStartIso)
        .like("summary", `trial_nurture_d${dayNumber}%`)
        .limit(1)
        .maybeSingle();

      if (existing) {
        results.push({
          businessId: trial.business_id,
          dayNumber,
          status: "skipped",
          reason: "already sent today",
        });
        continue;
      }

      // Load business name
      const { data: biz } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", trial.business_id)
        .single();

      const businessName = biz?.name ?? "매장";

      try {
        const sendResult = await sendTrialNurture(
          trial.business_id,
          dayNumber,
          businessName
        );
        results.push({
          businessId: trial.business_id,
          dayNumber,
          status: sendResult.success ? "sent" : "error",
          reason: sendResult.error,
        });
      } catch (err) {
        results.push({
          businessId: trial.business_id,
          dayNumber,
          status: "error",
          reason: err instanceof Error ? err.message : "unknown",
        });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      processed: results.length,
      sent,
      skipped,
      errors,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}

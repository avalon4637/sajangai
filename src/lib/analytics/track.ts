// Phase 2.7 — Analytics tracking (server-side, SDK-free)
//
// Uses PostHog's public Capture API directly so we don't have to install
// posthog-js yet. When POSTHOG_API_KEY is unset, every call is a no-op so
// nothing blows up in development.
//
// Why fetch instead of SDK: avoids adding a client-side dep + bundle bloat,
// and server-side capture is what we need for D1/D7/D30 cohort tracking
// (every event can be reliably attributed to a user_id).

export type AnalyticsEvent =
  // Onboarding funnel
  | "signup_completed"
  | "onboarding_completed"
  | "trial_started"
  // First-value moments
  | "first_briefing_viewed"
  | "first_insight_viewed"
  | "first_reply_draft_copied"
  // Engagement
  | "briefing_viewed"
  | "insight_acted"
  | "insight_dismissed"
  | "reply_draft_generated"
  | "reply_deeplink_clicked"
  | "cross_diagnosis_requested"
  // Conversion
  | "paywall_viewed"
  | "subscription_started"
  | "subscription_cancelled"
  | "subscription_reactivated"
  // Retention
  | "weekly_roi_viewed"
  | "monthly_roi_viewed";

export interface TrackOptions {
  /** Unique user id — usually auth.users.id */
  distinctId: string;
  event: AnalyticsEvent;
  /** Optional properties to attach to the event */
  properties?: Record<string, unknown>;
}

const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://app.posthog.com";
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;

/**
 * Send an event to PostHog. Non-blocking, best-effort.
 * Returns a promise you can `void` ignore — tracking errors are swallowed
 * and logged to console so a failing analytics call never breaks a UX flow.
 */
export async function track(options: TrackOptions): Promise<void> {
  if (!POSTHOG_API_KEY) {
    // Analytics disabled — keep a single debug line so we know in dev
    if (process.env.NODE_ENV !== "production") {
      console.debug(
        "[analytics] skipped (POSTHOG_API_KEY unset):",
        options.event,
        options.properties
      );
    }
    return;
  }

  try {
    const payload = {
      api_key: POSTHOG_API_KEY,
      event: options.event,
      distinct_id: options.distinctId,
      properties: {
        ...options.properties,
        $source: "sajangai",
        $lib: "sajangai-server",
      },
      timestamp: new Date().toISOString(),
    };

    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Don't let slow analytics block the caller's response
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error("[analytics] capture failed:", err);
  }
}

/**
 * Identify helper — usually called on signup/login to attach user traits.
 */
export async function identify(
  distinctId: string,
  traits: Record<string, unknown>
): Promise<void> {
  if (!POSTHOG_API_KEY) return;

  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_API_KEY,
        event: "$identify",
        distinct_id: distinctId,
        properties: {
          $set: traits,
        },
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error("[analytics] identify failed:", err);
  }
}

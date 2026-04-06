// Notification preference types and helpers
// Stored as JSONB in user_profiles.notification_preferences column
// Controls which AlimTalk/SMS notifications the user receives

export interface NotificationPreferences {
  dailyReport: boolean; // Daily revenue report (DAILY_BRIEFING)
  reviewAlert: boolean; // New review alert (URGENT_REVIEW)
  anomalyAlert: boolean; // Anomaly detection alert (ANOMALY_ALERT, CASHFLOW_WARNING)
  weeklyReport: boolean; // Weekly summary (WEEKLY_SUMMARY)
  insightAlert: boolean; // AI insight alert (INSIGHT_ALERT)
  subscriptionAlert: boolean; // Subscription events (STARTED, EXPIRING, PAYMENT_FAILED)
  quietHoursStart: string; // "HH:mm" format, e.g. "22:00"
  quietHoursEnd: string; // "HH:mm" format, e.g. "08:00"
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  dailyReport: true,
  reviewAlert: true,
  anomalyAlert: true,
  weeklyReport: true,
  insightAlert: true,
  subscriptionAlert: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
};

/**
 * Check if current time (KST) falls within quiet hours.
 * Returns true if notifications should be suppressed.
 */
export function isQuietHours(prefs: NotificationPreferences): boolean {
  const now = new Date();
  // Convert to KST (UTC+9)
  const kstOffset = 9 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const kstMinutes = (utcMinutes + kstOffset) % (24 * 60);

  const startMinutes = parseTimeToMinutes(prefs.quietHoursStart);
  const endMinutes = parseTimeToMinutes(prefs.quietHoursEnd);

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (startMinutes > endMinutes) {
    return kstMinutes >= startMinutes || kstMinutes < endMinutes;
  }
  // Same-day quiet hours (e.g., 13:00 - 15:00)
  return kstMinutes >= startMinutes && kstMinutes < endMinutes;
}

/**
 * Check if a specific notification type is enabled in user preferences.
 * Subscription-related notifications (SUBSCRIPTION_STARTED, SUBSCRIPTION_EXPIRING,
 * PAYMENT_FAILED) bypass quiet hours since they are transactional.
 */
export function isNotificationEnabled(
  prefs: NotificationPreferences,
  templateId: string
): boolean {
  const mapping: Record<string, keyof NotificationPreferences> = {
    DAILY_BRIEFING: "dailyReport",
    URGENT_REVIEW: "reviewAlert",
    ANOMALY_ALERT: "anomalyAlert",
    CASHFLOW_WARNING: "anomalyAlert",
    WEEKLY_SUMMARY: "weeklyReport",
    INSIGHT_ALERT: "insightAlert",
    MONTHLY_ROI: "weeklyReport",
    SUBSCRIPTION_STARTED: "subscriptionAlert",
    SUBSCRIPTION_EXPIRING: "subscriptionAlert",
    PAYMENT_FAILED: "subscriptionAlert",
  };

  const prefKey = mapping[templateId];
  if (!prefKey) return true; // Unknown template - allow by default

  const enabled = prefs[prefKey];
  if (typeof enabled !== "boolean") return true;
  if (!enabled) return false;

  // Transactional messages bypass quiet hours
  const transactional = [
    "SUBSCRIPTION_STARTED",
    "SUBSCRIPTION_EXPIRING",
    "PAYMENT_FAILED",
  ];
  if (transactional.includes(templateId)) return true;

  // Non-transactional messages respect quiet hours
  return !isQuietHours(prefs);
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

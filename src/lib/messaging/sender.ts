// Message sender - wraps Solapi client with business context lookup
// Looks up user phone from Supabase auth metadata or businesses table
// All sends are best-effort (fire and forget), results are logged
// SMS fallback triggered automatically on AlimTalk failure

import { createClient } from "@/lib/supabase/server";
import { sendAlimTalk, sendSMS } from "./solapi-client";
import { TEMPLATES, buildVariables, type TemplateId } from "./templates";
import {
  DEFAULT_PREFERENCES,
  isNotificationEnabled,
  type NotificationPreferences,
} from "./notification-preferences";

export interface SendResult {
  success: boolean;
  channel: "alimtalk" | "sms" | "none";
  error?: string;
}

// @MX:ANCHOR: Phone number lookup - called by all send functions in this module
// @MX:REASON: Fan-in from sendDailyBriefing, sendUrgentAlert, sendWeeklySummary
async function getBusinessPhone(businessId: string): Promise<string | null> {
  const supabase = await createClient();

  // Step 1: Get the user_id for this business
  const { data: business } = await supabase
    .from("businesses")
    .select("user_id")
    .eq("id", businessId)
    .single();

  if (!business) return null;

  // Step 2: Try to get phone from auth user metadata
  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(business.user_id);

  const phone =
    user?.phone ??
    (user?.user_metadata?.phone as string | undefined) ??
    null;

  return phone;
}

/**
 * Phase 1.3 — Respect user notification preferences + quiet hours.
 * Call this at the top of every send* function so we never spam disabled users.
 *
 * Returns { allowed: true } when the send may proceed, or
 * { allowed: false, reason } when it must be skipped.
 */
async function shouldSend(
  businessId: string,
  templateId: TemplateId
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const supabase = await createClient();
    const { data: biz } = await supabase
      .from("businesses")
      .select("user_id")
      .eq("id", businessId)
      .single();
    if (!biz) return { allowed: false, reason: "business not found" };

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("notification_preferences")
      .eq("id", biz.user_id)
      .maybeSingle();

    const prefs: NotificationPreferences = {
      ...DEFAULT_PREFERENCES,
      ...((profile?.notification_preferences as Partial<NotificationPreferences>) ??
        {}),
    };

    if (!isNotificationEnabled(prefs, templateId)) {
      return { allowed: false, reason: "disabled_or_quiet_hours" };
    }
    return { allowed: true };
  } catch (err) {
    console.error("[messaging] shouldSend check failed:", err);
    // On error, fall back to sending (best-effort; error is surfaced in logs)
    return { allowed: true };
  }
}

/**
 * Log message send attempt to sync_logs for audit trail.
 * Non-blocking - errors here do not affect the send result.
 */
async function logMessageSend(
  businessId: string,
  templateId: TemplateId | "sms",
  channel: string,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("agent_activity_log").insert({
      business_id: businessId,
      agent_type: "manager",
      action: "message_sent",
      summary: `${templateId} via ${channel}: ${success ? "성공" : "실패"}`,
      details: { templateId, channel, success, error } as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error("[messaging] log error:", err);
    // Swallow logging errors to avoid breaking the caller
  }
}

/**
 * Send morning daily briefing via KakaoTalk AlimTalk.
 * Falls back to SMS if AlimTalk delivery fails.
 *
 * @param businessId - UUID of the business
 * @param briefingContent - Structured content for the briefing template
 */
export async function sendDailyBriefing(
  businessId: string,
  briefingContent: {
    businessName: string;
    summary: string;
    revenue: string;
    reviewCount: string;
    alert: string;
  }
): Promise<SendResult> {
  const gate = await shouldSend(businessId, "DAILY_BRIEFING");
  if (!gate.allowed) {
    return { success: false, channel: "none", error: gate.reason };
  }
  const phone = await getBusinessPhone(businessId);
  if (!phone) {
    return { success: false, channel: "none", error: "No phone number found" };
  }

  const template = TEMPLATES.DAILY_BRIEFING;
  const variables = buildVariables("DAILY_BRIEFING", {
    business_name: briefingContent.businessName,
    summary: briefingContent.summary,
    revenue: briefingContent.revenue,
    review_count: briefingContent.reviewCount,
    alert: briefingContent.alert,
  });

  // Attempt AlimTalk first
  const alimResult = await sendAlimTalk(
    phone,
    template.templateId,
    variables,
    template.buttons
  );

  if (alimResult.success) {
    await logMessageSend(businessId, "DAILY_BRIEFING", "alimtalk", true);
    return { success: true, channel: "alimtalk" };
  }

  // SMS fallback
  const smsText = `[${briefingContent.businessName}] ${briefingContent.summary}\n매출: ${briefingContent.revenue} | 리뷰: ${briefingContent.reviewCount}건\n${briefingContent.alert}`;
  const smsResult = await sendSMS(phone, smsText);

  await logMessageSend(
    businessId,
    "DAILY_BRIEFING",
    smsResult.success ? "sms" : "none",
    smsResult.success,
    smsResult.error
  );

  return {
    success: smsResult.success,
    channel: smsResult.success ? "sms" : "none",
    error: smsResult.error,
  };
}

/**
 * Send urgent alert (negative review, cash flow warning) via AlimTalk with SMS fallback.
 *
 * @param businessId - UUID of the business
 * @param alertType - Type of alert to send
 * @param content - Alert-specific content for template variables
 */
export async function sendUrgentAlert(
  businessId: string,
  alertType: "URGENT_REVIEW" | "CASHFLOW_WARNING",
  content: Record<string, string>
): Promise<SendResult> {
  const gate = await shouldSend(businessId, alertType);
  if (!gate.allowed) {
    return { success: false, channel: "none", error: gate.reason };
  }
  const phone = await getBusinessPhone(businessId);
  if (!phone) {
    return { success: false, channel: "none", error: "No phone number found" };
  }

  const template = TEMPLATES[alertType];
  const variables = buildVariables(alertType, content);

  const alimResult = await sendAlimTalk(
    phone,
    template.templateId,
    variables,
    template.buttons
  );

  if (alimResult.success) {
    await logMessageSend(businessId, alertType, "alimtalk", true);
    return { success: true, channel: "alimtalk" };
  }

  // SMS fallback with condensed alert text
  const alertLabel =
    alertType === "URGENT_REVIEW"
      ? `[긴급 리뷰] ${content.rating}점 리뷰: ${content.review_excerpt}`
      : `[자금 경고] ${content.alert_date} 예상 잔액 ${content.expected_balance}원`;

  const smsText = `[${content.business_name}] ${alertLabel}`;
  const smsResult = await sendSMS(phone, smsText);

  await logMessageSend(
    businessId,
    alertType,
    smsResult.success ? "sms" : "none",
    smsResult.success,
    smsResult.error
  );

  return {
    success: smsResult.success,
    channel: smsResult.success ? "sms" : "none",
    error: smsResult.error,
  };
}

/**
 * Send weekly performance summary via AlimTalk with SMS fallback.
 *
 * @param businessId - UUID of the business
 * @param summaryContent - Weekly stats for template variables
 */
export async function sendWeeklySummary(
  businessId: string,
  summaryContent: {
    businessName: string;
    weekRevenue: string;
    weekProfit: string;
    reviewAvg: string;
    highlight: string;
  }
): Promise<SendResult> {
  const gate = await shouldSend(businessId, "WEEKLY_SUMMARY");
  if (!gate.allowed) {
    return { success: false, channel: "none", error: gate.reason };
  }
  const phone = await getBusinessPhone(businessId);
  if (!phone) {
    return { success: false, channel: "none", error: "No phone number found" };
  }

  const template = TEMPLATES.WEEKLY_SUMMARY;
  const variables = buildVariables("WEEKLY_SUMMARY", {
    business_name: summaryContent.businessName,
    week_revenue: summaryContent.weekRevenue,
    week_profit: summaryContent.weekProfit,
    review_avg: summaryContent.reviewAvg,
    highlight: summaryContent.highlight,
  });

  const alimResult = await sendAlimTalk(
    phone,
    template.templateId,
    variables,
    template.buttons
  );

  if (alimResult.success) {
    await logMessageSend(businessId, "WEEKLY_SUMMARY", "alimtalk", true);
    return { success: true, channel: "alimtalk" };
  }

  // SMS fallback
  const smsText = `[${summaryContent.businessName}] 주간 요약\n매출: ${summaryContent.weekRevenue} | 순이익: ${summaryContent.weekProfit}\n평균 리뷰: ${summaryContent.reviewAvg}점\n${summaryContent.highlight}`;
  const smsResult = await sendSMS(phone, smsText);

  await logMessageSend(
    businessId,
    "WEEKLY_SUMMARY",
    smsResult.success ? "sms" : "none",
    smsResult.success,
    smsResult.error
  );

  return {
    success: smsResult.success,
    channel: smsResult.success ? "sms" : "none",
    error: smsResult.error,
  };
}

/**
 * Send insight alert notification via KakaoTalk with SMS fallback.
 * Only sends for critical/warning severity insights during active hours.
 */
export async function sendInsightAlert(
  businessId: string,
  content: {
    businessName: string;
    severity: string;
    insightTitle: string;
    recommendation: string;
  }
): Promise<SendResult> {
  const gate = await shouldSend(businessId, "INSIGHT_ALERT");
  if (!gate.allowed) {
    return { success: false, channel: "none", error: gate.reason };
  }
  const phone = await getBusinessPhone(businessId);
  if (!phone) {
    return { success: false, channel: "none", error: "No phone number found" };
  }

  const template = TEMPLATES.INSIGHT_ALERT;
  const variables = buildVariables("INSIGHT_ALERT", {
    business_name: content.businessName,
    severity: content.severity === "critical" ? "긴급" : "주의",
    insight_title: content.insightTitle,
    recommendation: content.recommendation,
  });

  const alimResult = await sendAlimTalk(
    phone,
    template.templateId,
    variables,
    template.buttons
  );

  if (alimResult.success) {
    await logMessageSend(businessId, "INSIGHT_ALERT", "alimtalk", true);
    return { success: true, channel: "alimtalk" };
  }

  const label = content.severity === "critical" ? "긴급" : "주의";
  const smsText = `[${content.businessName}] [${label}] ${content.insightTitle}\n${content.recommendation}`;
  const smsResult = await sendSMS(phone, smsText.slice(0, 90));

  await logMessageSend(
    businessId,
    "INSIGHT_ALERT",
    smsResult.success ? "sms" : "none",
    smsResult.success,
    smsResult.error
  );

  return {
    success: smsResult.success,
    channel: smsResult.success ? "sms" : "none",
    error: smsResult.error,
  };
}

// @MX:ANCHOR: Notification preference loader - called by preference-aware send functions
// @MX:REASON: Fan-in from sendAnomalyAlert, sendSubscriptionStarted, sendSubscriptionExpiring, sendPaymentFailed
async function getPreferences(
  businessId: string
): Promise<NotificationPreferences> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("notification_preferences")
      .eq("business_id", businessId)
      .single();

    if (!data?.notification_preferences) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...data.notification_preferences };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Generic preference-aware send helper.
 * Checks notification preferences and quiet hours before sending.
 */
async function sendWithPreferences(
  businessId: string,
  templateId: TemplateId,
  variables: Record<string, string>,
  smsFallbackText: string
): Promise<SendResult> {
  const prefs = await getPreferences(businessId);
  if (!isNotificationEnabled(prefs, templateId)) {
    return { success: true, channel: "none" }; // Suppressed by user preference
  }

  const phone = await getBusinessPhone(businessId);
  if (!phone) {
    return { success: false, channel: "none", error: "No phone number found" };
  }

  const template = TEMPLATES[templateId];
  const vars = buildVariables(templateId, variables);

  const alimResult = await sendAlimTalk(
    phone,
    template.templateId,
    vars,
    template.buttons
  );

  if (alimResult.success) {
    await logMessageSend(businessId, templateId, "alimtalk", true);
    return { success: true, channel: "alimtalk" };
  }

  // SMS fallback
  const smsResult = await sendSMS(phone, smsFallbackText.slice(0, 90));
  await logMessageSend(
    businessId,
    templateId,
    smsResult.success ? "sms" : "none",
    smsResult.success,
    smsResult.error
  );

  return {
    success: smsResult.success,
    channel: smsResult.success ? "sms" : "none",
    error: smsResult.error,
  };
}

// ─── Phase 1.7 — Trial nurture sequence ─────────────────────────────────────

/**
 * Day-specific copy for the D+1 ~ D+6 trial nurture sequence.
 * These are the messages the Planner defined in the landing brief (S9).
 * Kept SMS-only for now — will upgrade to AlimTalk when TRIAL_NURTURE template
 * is registered in SolAPI (Phase 2).
 */
const TRIAL_NURTURE_COPY: Record<number, (businessName: string) => string> = {
  1: (name) =>
    `[${name}] 사장AI 체험 1일차! 첫 리포트가 준비됐어요. 앱에서 오늘의 브리핑을 확인해보세요.`,
  3: (name) =>
    `[${name}] 체험 3일차! 점장이 매출·리뷰 패턴을 분석하기 시작했어요. 새 인사이트를 확인해보세요.`,
  5: (name) =>
    `[${name}] 체험 5일차! 재무 분석 결과가 준비됐어요. 놓치기 쉬운 지출 패턴을 알려드려요.`,
  6: (name) =>
    `[${name}] 체험 종료까지 1일! 지금까지 점장이 분석한 결과를 성적표로 확인해보세요. 계속 쓰시려면 점장 고용하기.`,
};

/**
 * Send a trial nurture message for a specific trial day.
 * Falls through to SMS because AlimTalk templates for the sequence are not
 * registered yet. Respects notification preferences via shouldSend().
 */
export async function sendTrialNurture(
  businessId: string,
  dayNumber: number,
  businessName: string
): Promise<SendResult> {
  const copyFn = TRIAL_NURTURE_COPY[dayNumber];
  if (!copyFn) {
    return {
      success: false,
      channel: "none",
      error: `unsupported day: ${dayNumber}`,
    };
  }

  // Gate through the same preference path as daily briefing
  const gate = await shouldSend(businessId, "DAILY_BRIEFING");
  if (!gate.allowed) {
    return { success: false, channel: "none", error: gate.reason };
  }

  const phone = await getBusinessPhone(businessId);
  if (!phone) {
    return { success: false, channel: "none", error: "No phone number found" };
  }

  const smsText = copyFn(businessName).slice(0, 90);
  const smsResult = await sendSMS(phone, smsText);

  // Log with a descriptive summary so admin ops can trace each nurture step
  try {
    const supabase = await createClient();
    await supabase.from("agent_activity_log").insert({
      business_id: businessId,
      agent_type: "manager",
      action: "message_sent",
      summary: `trial_nurture_d${dayNumber} via ${smsResult.success ? "sms" : "none"}: ${smsResult.success ? "성공" : "실패"}`,
      details: {
        templateId: `TRIAL_NURTURE_D${dayNumber}`,
        channel: smsResult.success ? "sms" : "none",
        success: smsResult.success,
        error: smsResult.error,
      } as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error("[messaging] trial nurture log error:", err);
  }

  return {
    success: smsResult.success,
    channel: smsResult.success ? "sms" : "none",
    error: smsResult.error,
  };
}

/**
 * Send anomaly alert when revenue/metric deviates significantly from normal.
 */
export async function sendAnomalyAlert(
  businessId: string,
  content: {
    businessName: string;
    anomalyType: string; // "급등" | "급락"
    metricName: string;
    currentValue: string;
    expectedValue: string;
    changeRate: string;
  }
): Promise<SendResult> {
  return sendWithPreferences(
    businessId,
    "ANOMALY_ALERT",
    {
      business_name: content.businessName,
      anomaly_type: content.anomalyType,
      metric_name: content.metricName,
      current_value: content.currentValue,
      expected_value: content.expectedValue,
      change_rate: content.changeRate,
    },
    `[${content.businessName}] ${content.metricName} ${content.anomalyType}: ${content.currentValue} (예상 ${content.expectedValue})`
  );
}

/**
 * Send subscription started confirmation.
 */
export async function sendSubscriptionStarted(
  businessId: string,
  content: {
    businessName: string;
    planName: string;
    startDate: string;
    nextBillingDate: string;
  }
): Promise<SendResult> {
  return sendWithPreferences(
    businessId,
    "SUBSCRIPTION_STARTED",
    {
      business_name: content.businessName,
      plan_name: content.planName,
      start_date: content.startDate,
      next_billing_date: content.nextBillingDate,
    },
    `[${content.businessName}] ${content.planName} 구독이 시작되었습니다. 다음 결제: ${content.nextBillingDate}`
  );
}

/**
 * Send subscription expiring warning (typically 3 days before expiry).
 */
export async function sendSubscriptionExpiring(
  businessId: string,
  content: {
    businessName: string;
    planName: string;
    expireDate: string;
    daysRemaining: string;
  }
): Promise<SendResult> {
  return sendWithPreferences(
    businessId,
    "SUBSCRIPTION_EXPIRING",
    {
      business_name: content.businessName,
      plan_name: content.planName,
      expire_date: content.expireDate,
      days_remaining: content.daysRemaining,
    },
    `[${content.businessName}] ${content.planName} 구독이 ${content.daysRemaining}일 후 만료됩니다.`
  );
}

/**
 * Send payment failure notification.
 */
export async function sendPaymentFailed(
  businessId: string,
  content: {
    businessName: string;
    planName: string;
    failDate: string;
    failReason: string;
    retryDate: string;
  }
): Promise<SendResult> {
  return sendWithPreferences(
    businessId,
    "PAYMENT_FAILED",
    {
      business_name: content.businessName,
      plan_name: content.planName,
      fail_date: content.failDate,
      fail_reason: content.failReason,
      retry_date: content.retryDate,
    },
    `[${content.businessName}] 결제 실패: ${content.failReason}. 재시도: ${content.retryDate}`
  );
}

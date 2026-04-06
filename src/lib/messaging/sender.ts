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

// Subscription lifecycle management for sajang.ai billing
// Framing: "점장 고용" (not "구독")

import { createClient } from "@/lib/supabase/server";
import { requestPayment, PortOneError } from "./portone-client";

const TRIAL_DAYS = 7;
const MONTHLY_AMOUNT = 9900; // KRW

export type SubscriptionPlan = "trial" | "paid";
export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export interface Subscription {
  id: string;
  businessId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingKey: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  portonePaymentId: string | null;
  paidAt: string | null;
  failedReason: string | null;
  retryCount: number;
  createdAt: string;
}

/**
 * Creates a 7-day free trial subscription for a newly registered business.
 * Called automatically after business creation during onboarding.
 */
export async function createTrialSubscription(
  businessId: string
): Promise<Subscription | null> {
  const supabase = await createClient();
  const trialEndsAt = new Date(
    Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      business_id: businessId,
      plan: "trial",
      status: "trial",
      trial_ends_at: trialEndsAt,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create trial subscription:", error);
    return null;
  }

  return mapRow(data);
}

/**
 * Retrieves the current subscription for a business.
 */
export async function getSubscription(
  businessId: string
): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (error || !data) return null;
  return mapRow(data);
}

/**
 * Upgrades a business from trial to paid subscription.
 * Sets billing key, activates subscription, and starts the billing period.
 *
 * @param businessId - The business to activate
 * @param billingKey - PortOne billing key from card registration
 */
export async function activateSubscription(
  businessId: string,
  billingKey: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify subscription exists
  const { data: sub, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("business_id", businessId)
    .single();

  if (fetchError || !sub) {
    return { success: false, error: "구독 정보를 찾을 수 없습니다." };
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Create a payment record first
  const paymentId = `sajang_${businessId}_${Date.now()}`;
  const orderName = `점장 고용 - ${now.getFullYear()}년 ${now.getMonth() + 1}월`;

  let portonePaymentId: string | null = null;
  let paymentStatus: "paid" | "failed" = "paid";
  let failedReason: string | null = null;

  try {
    const paymentResult = await requestPayment(
      billingKey,
      MONTHLY_AMOUNT,
      orderName,
      paymentId
    );
    portonePaymentId = paymentResult.paymentId;
    if (paymentResult.status !== "PAID") {
      paymentStatus = "failed";
      failedReason = paymentResult.failureReason ?? "결제 실패";
    }
  } catch (err) {
    paymentStatus = "failed";
    failedReason =
      err instanceof PortOneError ? err.message : "결제 중 오류가 발생했습니다.";
  }

  // Record payment
  await supabase.from("payments").insert({
    subscription_id: sub.id,
    amount: MONTHLY_AMOUNT,
    status: paymentStatus,
    portone_payment_id: portonePaymentId,
    paid_at: paymentStatus === "paid" ? now.toISOString() : null,
    failed_reason: failedReason,
  });

  if (paymentStatus === "failed") {
    return { success: false, error: failedReason ?? "결제에 실패했습니다." };
  }

  // Update subscription to active
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      plan: "paid",
      status: "active",
      billing_key: billingKey,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq("id", sub.id);

  if (updateError) {
    console.error("Failed to activate subscription:", updateError);
    return { success: false, error: "구독 활성화에 실패했습니다." };
  }

  return { success: true };
}

/**
 * Cancels a subscription. Access continues until the current period ends.
 */
export async function cancelSubscription(
  businessId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: now,
    })
    .eq("business_id", businessId)
    .eq("status", "active");

  if (error) {
    console.error("Failed to cancel subscription:", error);
    return { success: false, error: "구독 취소에 실패했습니다." };
  }

  return { success: true };
}

/**
 * Checks subscription status and updates expired records.
 * Should be called on each API request to gate features.
 */
export async function checkSubscriptionStatus(
  businessId: string
): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (error || !data) return null;

  const now = new Date();
  let updatedStatus: SubscriptionStatus | null = null;

  // Check if trial has expired
  if (data.status === "trial" && data.trial_ends_at) {
    if (new Date(data.trial_ends_at) < now) {
      updatedStatus = "expired";
    }
  }

  // Check if paid period has ended
  if (data.status === "active" && data.current_period_end) {
    if (new Date(data.current_period_end) < now) {
      updatedStatus = "past_due";
    }
  }

  // Cancelled subscriptions expire when period ends
  if (data.status === "cancelled" && data.current_period_end) {
    if (new Date(data.current_period_end) < now) {
      updatedStatus = "expired";
    }
  }

  if (updatedStatus) {
    await supabase
      .from("subscriptions")
      .update({ status: updatedStatus })
      .eq("id", data.id);

    return mapRow({ ...data, status: updatedStatus });
  }

  return mapRow(data);
}

/**
 * Returns whether AI features are available for a business.
 * True if trial is active or subscription is paid/active.
 */
export async function isFeatureAvailable(
  businessId: string
): Promise<boolean> {
  const subscription = await checkSubscriptionStatus(businessId);
  if (!subscription) return false;
  return (
    subscription.status === "trial" || subscription.status === "active" || subscription.status === "cancelled"
  );
}

/**
 * Gets the number of days remaining in trial or current period.
 */
export function getDaysRemaining(subscription: Subscription): number {
  const now = new Date();

  if (subscription.status === "trial" && subscription.trialEndsAt) {
    const diff =
      new Date(subscription.trialEndsAt).getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  if (
    (subscription.status === "active" || subscription.status === "cancelled") &&
    subscription.currentPeriodEnd
  ) {
    const diff =
      new Date(subscription.currentPeriodEnd).getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return 0;
}

// Maps a Supabase row to our Subscription interface
function mapRow(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    plan: row.plan as SubscriptionPlan,
    status: row.status as SubscriptionStatus,
    billingKey: (row.billing_key as string | null) ?? null,
    trialEndsAt: (row.trial_ends_at as string | null) ?? null,
    currentPeriodStart: (row.current_period_start as string | null) ?? null,
    currentPeriodEnd: (row.current_period_end as string | null) ?? null,
    cancelledAt: (row.cancelled_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

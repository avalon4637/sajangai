// Subscription access check utility
// Used by API routes and server components to gate AI features

import { checkSubscriptionStatus, getDaysRemaining } from "./subscription";

export interface AccessResult {
  hasAccess: boolean;
  plan: string;
  status: string;
  daysLeft?: number;
  reason?: string;
}

/**
 * Checks whether a business has access to AI features.
 * Returns access status, plan info, and days remaining.
 *
 * Rules:
 * - trial (active): full access
 * - active: full access
 * - cancelled (within period): full access
 * - past_due: restricted (payment failed)
 * - expired: restricted (trial or period ended)
 * - no subscription: restricted
 *
 * Note: The dashboard itself is always accessible.
 * Only AI-specific features are gated behind subscription.
 */
export async function checkAccess(businessId: string): Promise<AccessResult> {
  const subscription = await checkSubscriptionStatus(businessId);

  if (!subscription) {
    return {
      hasAccess: false,
      plan: "none",
      status: "none",
      reason: "구독 정보가 없습니다. 체험 기간이 설정되지 않았습니다.",
    };
  }

  const daysLeft = getDaysRemaining(subscription);

  switch (subscription.status) {
    case "trial":
      return {
        hasAccess: true,
        plan: "trial",
        status: "trial",
        daysLeft,
      };

    case "active":
      return {
        hasAccess: true,
        plan: "paid",
        status: "active",
        daysLeft,
      };

    case "cancelled":
      // Access continues until period ends
      return {
        hasAccess: true,
        plan: "paid",
        status: "cancelled",
        daysLeft,
      };

    case "past_due":
      return {
        hasAccess: false,
        plan: "paid",
        status: "past_due",
        daysLeft: 0,
        reason: "결제에 실패했습니다. 카드 정보를 확인해주세요.",
      };

    case "expired":
      return {
        hasAccess: false,
        plan: subscription.plan,
        status: "expired",
        daysLeft: 0,
        reason:
          subscription.plan === "trial"
            ? "무료 체험 기간이 종료되었습니다."
            : "구독 기간이 종료되었습니다.",
      };

    default:
      return {
        hasAccess: false,
        plan: subscription.plan,
        status: subscription.status,
        daysLeft: 0,
        reason: "구독 상태를 확인할 수 없습니다.",
      };
  }
}

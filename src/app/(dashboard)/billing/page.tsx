// Billing page - server component with auth check
// Shows subscription status and plan options

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  checkSubscriptionStatus,
  getDaysRemaining,
} from "@/lib/billing/subscription";
import { BillingPageClient } from "./page-client";
import type { Payment } from "@/lib/billing/subscription";
import { calculateMonthlyRoi } from "@/lib/roi/calculator";

export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's business
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  let subscription = null;
  let payments: Payment[] = [];

  if (business) {
    subscription = await checkSubscriptionStatus(business.id);

    if (subscription) {
      const { data: paymentRows } = await supabase
        .from("payments")
        .select("id, amount, status, paid_at, failed_reason, created_at, subscription_id, portone_payment_id, retry_count")
        .eq("subscription_id", subscription.id)
        .order("created_at", { ascending: false })
        .limit(12);

      payments = (paymentRows ?? []).map((row) => ({
        id: row.id as string,
        subscriptionId: row.subscription_id as string,
        amount: row.amount as number,
        status: row.status as Payment["status"],
        portonePaymentId: (row.portone_payment_id as string | null) ?? null,
        paidAt: (row.paid_at as string | null) ?? null,
        failedReason: (row.failed_reason as string | null) ?? null,
        retryCount: (row.retry_count as number) ?? 0,
        createdAt: row.created_at as string,
      }));
    }
  }

  const subscriptionWithDays = subscription
    ? { ...subscription, daysRemaining: getDaysRemaining(subscription) }
    : null;

  // Calculate current month ROI
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let roi = null;
  if (business) {
    try {
      roi = await calculateMonthlyRoi(business.id, currentYearMonth);
    } catch (error) {
      // Non-fatal
      console.error("[Billing] Failed to calculate monthly ROI:", error);
    }
  }

  return (
    <BillingPageClient
      subscription={subscriptionWithDays}
      payments={payments}
      businessId={business?.id ?? null}
      userEmail={user.email ?? ""}
      roi={roi}
    />
  );
}

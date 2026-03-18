// PortOne V2 webhook handler
// Processes payment events and updates subscription status accordingly

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/billing/portone-client";

interface PortOneWebhookBody {
  type: string;
  data: {
    paymentId?: string;
    storeId?: string;
    status?: string;
    amount?: { total: number };
    paidAt?: string;
    failedAt?: string;
    failure?: { reason?: string };
    cancellations?: Array<{ id: string; amount: number; cancelledAt: string }>;
  };
  timestamp?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookId = request.headers.get("webhook-id") ?? "";
  const webhookTimestamp = request.headers.get("webhook-timestamp") ?? "";
  const webhookSignature = request.headers.get("webhook-signature") ?? "";

  const body = await request.text();

  // Verify webhook authenticity
  const isValid = await verifyWebhookSignature(
    webhookId,
    webhookTimestamp,
    webhookSignature,
    body
  );

  if (!isValid) {
    console.error("Invalid PortOne webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PortOneWebhookBody;
  try {
    payload = JSON.parse(body) as PortOneWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (payload.type) {
      case "Transaction.Paid":
      case "Payment.Paid": {
        const portonePaymentId = payload.data.paymentId;
        if (!portonePaymentId) break;

        // Find the payment record by portone_payment_id
        const { data: payment } = await supabase
          .from("payments")
          .select("id, subscription_id")
          .eq("portone_payment_id", portonePaymentId)
          .single();

        if (payment) {
          // Update payment status to paid
          await supabase
            .from("payments")
            .update({
              status: "paid",
              paid_at: payload.data.paidAt ?? new Date().toISOString(),
            })
            .eq("id", payment.id);

          // Ensure subscription is active
          await supabase
            .from("subscriptions")
            .update({ status: "active" })
            .eq("id", payment.subscription_id)
            .eq("status", "past_due");
        }
        break;
      }

      case "Transaction.Failed":
      case "Payment.Failed": {
        const portonePaymentId = payload.data.paymentId;
        if (!portonePaymentId) break;

        const { data: payment } = await supabase
          .from("payments")
          .select("id, subscription_id, retry_count")
          .eq("portone_payment_id", portonePaymentId)
          .single();

        if (payment) {
          const newRetryCount = (payment.retry_count ?? 0) + 1;

          await supabase
            .from("payments")
            .update({
              status: "failed",
              failed_reason: payload.data.failure?.reason ?? "결제 실패",
              retry_count: newRetryCount,
            })
            .eq("id", payment.id);

          // If max retries exceeded, mark subscription as past_due
          if (newRetryCount >= 3) {
            await supabase
              .from("subscriptions")
              .update({ status: "past_due" })
              .eq("id", payment.subscription_id);
          }
        }
        break;
      }

      case "Transaction.Cancelled":
      case "Payment.Cancelled": {
        const portonePaymentId = payload.data.paymentId;
        if (!portonePaymentId) break;

        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("portone_payment_id", portonePaymentId);

        break;
      }

      default:
        // Unknown event type, acknowledge receipt
        console.log("Unhandled PortOne webhook type:", payload.type);
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Return 200 to prevent PortOne from retrying for processing errors
    return NextResponse.json({ received: true, error: "Processing error" });
  }

  return NextResponse.json({ received: true });
}

// PortOne V2 REST API client
// Uses fetch directly (no SDK) per project requirements
// API reference: https://developers.portone.io/api/rest-v2

const PORTONE_API_BASE = "https://api.portone.io";

function isTestMode(): boolean {
  return process.env.PORTONE_TEST_MODE === "true";
}

function getApiSecret(): string {
  if (isTestMode()) return "test_secret";
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) {
    throw new Error("PORTONE_API_SECRET environment variable is not configured");
  }
  return secret;
}

function getStoreId(): string {
  if (isTestMode()) return "test_store";
  const storeId = process.env.PORTONE_STORE_ID;
  if (!storeId) {
    throw new Error("PORTONE_STORE_ID environment variable is not configured");
  }
  return storeId;
}

async function portoneRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PORTONE_API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `PortOne ${getApiSecret()}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new PortOneError(
      response.status,
      (errorBody as { message?: string }).message ?? `HTTP ${response.status}`,
      errorBody
    );
  }

  return response.json() as Promise<T>;
}

export class PortOneError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "PortOneError";
  }
}

export interface BillingKeyInfo {
  billingKey: string;
  customerId: string;
  issuedAt: string;
}

export interface PaymentResult {
  paymentId: string;
  status: "PAID" | "FAILED" | "CANCELLED";
  amount: number;
  paidAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface CancelResult {
  cancellationId: string;
  cancelledAmount: number;
  cancelledAt: string;
}

/**
 * Issues a billing key for recurring payments.
 * The billing key is stored on the subscription record for future charges.
 *
 * @param customerKey - Unique identifier for the customer (business_id)
 * @param cardInfo - Card details (number, expiry, birth/password for CVC)
 */
export async function issueBillingKey(
  customerKey: string,
  cardInfo: {
    cardNumber: string;
    expiryYear: string;
    expiryMonth: string;
    birthOrBusinessRegistrationNumber: string;
    passwordTwoDigits: string;
  }
): Promise<BillingKeyInfo> {
  if (isTestMode()) {
    console.log("[PortOne TEST] issueBillingKey for", customerKey);
    return {
      billingKey: `test_billing_key_${customerKey}_${Date.now()}`,
      customerId: customerKey,
      issuedAt: new Date().toISOString(),
    };
  }

  const storeId = getStoreId();

  const result = await portoneRequest<{
    billingKey: string;
    customerId: string;
    issuedAt: string;
  }>("/billing-keys", {
    method: "POST",
    body: JSON.stringify({
      storeId,
      channelKey: process.env.PORTONE_CHANNEL_KEY,
      customer: {
        id: customerKey,
      },
      method: {
        card: {
          credential: {
            number: cardInfo.cardNumber,
            expiryYear: cardInfo.expiryYear,
            expiryMonth: cardInfo.expiryMonth,
            birthOrBusinessRegistrationNumber:
              cardInfo.birthOrBusinessRegistrationNumber,
            passwordTwoDigits: cardInfo.passwordTwoDigits,
          },
        },
      },
    }),
  });

  return result;
}

/**
 * Charges a stored billing key for recurring payments.
 * Used for monthly subscription billing (9,900 KRW/month).
 *
 * @param billingKey - The billing key issued to the customer
 * @param amount - Amount in KRW (integer, no decimals). Default: 9900
 * @param orderName - Display name for the payment (e.g., "점장 고용 - 2026년 3월")
 * @param paymentId - Unique payment identifier (for idempotency)
 */
export async function requestPayment(
  billingKey: string,
  amount: number,
  orderName: string,
  paymentId: string
): Promise<PaymentResult> {
  if (isTestMode()) {
    console.log("[PortOne TEST] requestPayment:", { paymentId, amount, orderName });
    return {
      paymentId: `test_pay_${paymentId}`,
      status: "PAID",
      amount,
      paidAt: new Date().toISOString(),
    };
  }

  const storeId = getStoreId();

  const result = await portoneRequest<{
    payment: {
      id: string;
      status: "PAID" | "FAILED" | "CANCELLED";
      amount: { total: number };
      paidAt?: string;
      failedAt?: string;
      failure?: { reason?: string };
    };
  }>(`/payments/${encodeURIComponent(paymentId)}/billing-key`, {
    method: "POST",
    body: JSON.stringify({
      storeId,
      billingKey,
      orderName,
      currency: "KRW",
      amount: {
        total: amount,
      },
    }),
  });

  const { payment } = result;
  return {
    paymentId: payment.id,
    status: payment.status,
    amount: payment.amount.total,
    paidAt: payment.paidAt,
    failedAt: payment.failedAt,
    failureReason: payment.failure?.reason,
  };
}

/**
 * Cancels or refunds a payment by PortOne payment ID.
 *
 * @param paymentId - PortOne payment ID to cancel
 * @param reason - Reason for cancellation (shown to customer)
 */
export async function cancelPayment(
  paymentId: string,
  reason: string
): Promise<CancelResult> {
  if (isTestMode()) {
    console.log("[PortOne TEST] cancelPayment:", { paymentId, reason });
    return {
      cancellationId: `test_cancel_${Date.now()}`,
      cancelledAmount: 9900,
      cancelledAt: new Date().toISOString(),
    };
  }

  const result = await portoneRequest<{
    cancellation: {
      id: string;
      amount: number;
      cancelledAt: string;
    };
  }>(`/payments/${encodeURIComponent(paymentId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

  return {
    cancellationId: result.cancellation.id,
    cancelledAmount: result.cancellation.amount,
    cancelledAt: result.cancellation.cancelledAt,
  };
}

/**
 * Verifies a webhook signature from PortOne.
 * Used in the webhook handler to ensure requests are authentic.
 *
 * @param webhookId - Webhook ID from header
 * @param webhookTimestamp - Timestamp from header
 * @param webhookSignature - Signature from header
 * @param body - Raw request body string
 */
export async function verifyWebhookSignature(
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  body: string
): Promise<boolean> {
  const secret = process.env.PORTONE_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("PORTONE_WEBHOOK_SECRET not set, skipping verification");
    return true;
  }

  // PortOne webhook signature: HMAC-SHA256 of "webhook_id.timestamp.body"
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedContent)
  );
  const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)));

  // Webhook signature may be comma-separated list of "v1,<base64>"
  const signatures = webhookSignature.split(" ");
  return signatures.some((sig) => {
    const parts = sig.split(",");
    return parts[parts.length - 1] === expectedSig;
  });
}

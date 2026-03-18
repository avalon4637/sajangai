# SPEC-BILLING-001: Implementation Plan

## Traceability

| SPEC ID | Tag Range         |
| ------- | ----------------- |
| SPEC-BILLING-001 | REQ-B1-01 ~ REQ-B4-03 |

---

## Milestones

### Primary Goal: Database + PortOne Integration (B1, B2)

**Milestone 1: Database Schema**
- Create `supabase/migrations/00006_subscriptions.sql`
  - `subscriptions` table with RLS policies (business_id scope)
  - `payments` table with RLS policies
  - Unique constraint on subscriptions.business_id
  - Index on subscriptions.status for middleware queries
  - Index on payments.subscription_id for payment history
- Tags: REQ-B1-01

**Milestone 2: PortOne V2 Client**
- Implement `src/lib/billing/portone-client.ts`
  - `issueBillingKey(customerId, cardInfo)`: Issue billing key via PortOne V2 API
  - `chargeWithBillingKey(billingKey, amount, orderId)`: Execute recurring payment
  - `cancelPayment(paymentId, reason)`: Cancel/refund a payment
  - `verifyWebhookSignature(body, signature)`: Validate webhook authenticity
  - `getPaymentStatus(paymentId)`: Check payment status
- Environment: PORTONE_API_KEY, PORTONE_API_SECRET, PORTONE_STORE_ID
- Tags: REQ-B2-01, REQ-B2-04, REQ-B2-05

**Milestone 3: Subscription Lifecycle Manager**
- Implement `src/lib/billing/subscription.ts`
  - `startFreeTrial(businessId)`: Create trial subscription (7 days)
  - `activateSubscription(businessId, billingKey)`: Transition to paid
  - `processPayment(subscriptionId)`: Execute monthly payment
  - `handlePaymentFailure(subscriptionId)`: Increment retry, enter grace period
  - `cancelSubscription(businessId)`: Mark cancelled, preserve access until period end
  - `checkSubscriptionStatus(businessId)`: Return current status for middleware
  - `getSubscriptionDetails(businessId)`: Full subscription info for billing page
  - `suspendSubscription(subscriptionId)`: Suspend after grace period expires
- Tags: REQ-B1-03, REQ-B3-01, REQ-B3-03, REQ-B3-04, REQ-B3-05

### Secondary Goal: Webhook + API Routes (B2, B3)

**Milestone 4: API Endpoints**
- Implement `src/lib/billing/webhook.ts`
  - `handlePaymentWebhook(event)`: Process PortOne webhook events
  - Handle: payment.paid, payment.failed, billing_key.issued, billing_key.deleted
  - Idempotent processing (check portone_payment_id before insert)
- Implement `src/app/api/billing/webhook/route.ts`
  - POST handler, verify signature, delegate to webhook.ts
  - Return 200 immediately, process async
- Implement `src/app/api/billing/subscribe/route.ts`
  - POST handler: validate auth, issue billing key, create subscription
  - Return subscription details
- Implement `src/app/api/billing/cancel/route.ts`
  - POST handler: validate auth, cancel subscription
  - Return updated subscription status
- Tags: REQ-B2-01, REQ-B2-02, REQ-B2-03

**Milestone 5: Payment Retry + Alerts**
- Payment retry logic in subscription.ts (3 attempts, 24h interval)
- Trial ending alert (D-2) via Solapi KakaoTalk (reuse messaging from SPEC-JEONGJANG-001)
- Payment failure alert via KakaoTalk
- Supabase pg_cron for daily subscription checks:
  - Check trial_ends_at for expiring trials
  - Check grace period expiration
  - Trigger retry for failed payments
- Tags: REQ-B2-03, REQ-B3-02, REQ-B3-04

### Final Goal: Access Control + Billing UI (B4)

**Milestone 6: Middleware Access Control**
- Update `src/middleware.ts`
  - Check subscription status on protected routes
  - Allow: trial, active statuses -> full access
  - Restrict: trial_expired, suspended, cancelled (past period) -> read-only
  - Cache subscription status in session to minimize DB queries
  - Add `x-subscription-status` header for client-side access
- Tags: REQ-B4-01, REQ-B4-02, REQ-B4-03

**Milestone 7: Billing Page UI**
- Implement `src/app/(dashboard)/billing/page.tsx`
  - Server Component: fetch subscription details, payment history
- Implement `src/app/(dashboard)/billing/page-client.tsx`
  - Current plan display with "hire" framing
  - PortOne V2 SDK card registration (billing key issuance)
  - Payment history list
  - Cancel subscription button with confirmation modal
  - Trial countdown display (if on trial)
- Update `src/app/(dashboard)/sidebar.tsx`
  - Show subscription status badge (Trial D-X, Active, Expired)
- Update `src/app/(dashboard)/settings/page.tsx`
  - Add link to billing page
- Update `src/app/auth/onboarding/onboarding-form.tsx`
  - Call startFreeTrial() after business registration
- Tags: REQ-B1-02, REQ-B1-03, REQ-B4-02

---

## Technical Approach

### PortOne V2 SDK
- Client-side: `@portone/browser-sdk` for billing key issuance (card registration UI)
- Server-side: PortOne V2 REST API for payment execution and management
- Webhook: PortOne sends payment status updates to /api/billing/webhook

### Payment Flow
1. User clicks "Hire Agent" on billing page
2. PortOne V2 SDK opens card registration modal
3. User enters card info -> billing key issued
4. Billing key saved to subscriptions table (encrypted)
5. First payment charged immediately via PortOne API
6. Subsequent payments charged monthly via pg_cron trigger

### Subscription Status Check (Middleware)
- Query subscriptions table for business_id
- Cache result in Supabase session metadata (avoid repeated queries)
- Refresh cache on payment events (webhook updates)
- Fallback: direct DB query if cache miss

### Security
- Billing keys encrypted at rest (Supabase vault or application-level encryption)
- Webhook signature verification prevents spoofed events
- PortOne credentials in server-side environment variables only
- No card details ever stored (PCI compliance via PortOne tokenization)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| PortOne webhook delivery failure | Payment status not updated | Polling fallback via pg_cron; manual status check API |
| Billing key expires or becomes invalid | Cannot charge monthly payment | Detect on charge failure; prompt user to re-register card |
| Middleware adds latency to all requests | Slower page loads | Cache subscription status; lazy check for non-critical pages |
| Duplicate webhook events | Double charging or duplicate records | Idempotent processing using portone_payment_id as unique key |
| User disputes charge after cancellation | Payment refund needed | Clear cancellation policy; access until period end |

---

## Dependencies

- SPEC-AUTH-001: Business registration flow (trigger free trial start)
- SPEC-JEONGJANG-001: Solapi messaging for payment alerts (reuse messaging layer)
- PortOne V2: Account setup, channel configuration (TossPayments, KakaoPay)
- Supabase Edge Functions: pg_cron for scheduled payment processing

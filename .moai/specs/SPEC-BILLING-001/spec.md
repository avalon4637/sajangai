# SPEC-BILLING-001: Payment Module (PortOne V2 + Subscription)

## Metadata

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| SPEC ID     | SPEC-BILLING-001                                   |
| Title       | Payment Module - Subscription & Billing with PortOne V2 |
| Created     | 2026-03-18                                         |
| Status      | Planned                                            |
| Priority    | High                                               |
| Phase       | 7                                                  |
| Lifecycle   | spec-anchored                                      |
| Related     | SPEC-AUTH-001, SPEC-JEONGJANG-001                  |

---

## Environment

- **Runtime**: Next.js 16 App Router, React 19, TypeScript 5.9
- **Payment**: PortOne V2 SDK (@portone/browser-sdk) + REST API
- **PG (Payment Gateway)**: TossPayments, KakaoPay
- **Database**: Supabase PostgreSQL 16 with Row-Level Security
- **Messaging**: Solapi SDK for payment failure KakaoTalk alerts
- **Auth**: Supabase Auth with business-scoped access

## Assumptions

- A1: PortOne V2 account is configured with TossPayments and KakaoPay channels
- A2: PortOne V2 supports billing key issuance for recurring payments
- A3: Webhook endpoint is publicly accessible for PortOne payment notifications
- A4: Free trial starts automatically on business registration (SPEC-AUTH-001)
- A5: 9,900 KRW/month pricing is fixed for MVP launch
- A6: Cancellation takes immediate effect but access continues until period end
- A7: Grace period of 3 days is sufficient before suspension

---

## Requirements

### B1: Subscription Plans

**[REQ-B1-01]** The system shall always offer exactly two plans: Free Trial (7 days, full access, data sync 1x/week) and Paid (9,900 KRW/month, full access, data sync 5x/day).

**[REQ-B1-02]** WHEN displaying pricing or subscription info THEN the system shall use framing language "agent salary" (not "subscription fee"). Example: "Subscribe" shall not be used; use "Hire" instead.

**[REQ-B1-03]** WHEN a new business registers THEN the system shall automatically start a 7-day free trial with full access.

### B2: PortOne V2 Integration

**[REQ-B2-01]** WHEN a user initiates payment THEN the system shall issue a billing key via PortOne V2 SDK for card registration.

**[REQ-B2-02]** WHEN a billing key is active THEN the system shall execute auto-recurring payment on the billing date each month.

**[REQ-B2-03]** IF a payment fails THEN the system shall retry up to 3 times with 24-hour intervals.

**[REQ-B2-04]** The system shall support TossPayments and KakaoPay as payment gateways.

**[REQ-B2-05]** The system shall always use environment variables for PortOne credentials: `PORTONE_API_KEY`, `PORTONE_API_SECRET`, `PORTONE_STORE_ID`.

### B3: Subscription Lifecycle

**[REQ-B3-01]** The system shall manage the following lifecycle states: trial, trial_ending, trial_expired, active, payment_failed, grace_period, suspended, cancelled.

**[REQ-B3-02]** WHEN trial has 2 days remaining THEN the system shall send a trial ending alert via KakaoTalk.

**[REQ-B3-03]** WHEN a payment succeeds THEN the system shall transition the subscription to "active" with updated period dates.

**[REQ-B3-04]** WHEN a payment fails after 3 retries THEN the system shall enter a 3-day grace period, then suspend the subscription.

**[REQ-B3-05]** WHEN a user cancels THEN the subscription shall take immediate effect but access continues until current_period_end.

### B4: Access Control

**[REQ-B4-01]** IF a subscription is expired or suspended THEN the system shall restrict the user to read-only dashboard access with no data sync and no AI features.

**[REQ-B4-02]** WHEN a restricted user attempts to use a paid feature THEN the system shall show an upgrade prompt.

**[REQ-B4-03]** The system shall always check subscription status in middleware for protected routes.

---

## Specifications

### New Files

| File                                              | Purpose                                        |
| ------------------------------------------------- | ---------------------------------------------- |
| `src/lib/billing/portone-client.ts`               | PortOne V2 API wrapper (billing key, payment)  |
| `src/lib/billing/subscription.ts`                 | Subscription lifecycle management              |
| `src/lib/billing/webhook.ts`                      | Payment webhook handler                        |
| `src/app/api/billing/webhook/route.ts`            | Webhook endpoint (POST)                        |
| `src/app/api/billing/subscribe/route.ts`          | Create subscription (POST)                     |
| `src/app/api/billing/cancel/route.ts`             | Cancel subscription (POST)                     |
| `src/app/(dashboard)/billing/page.tsx`            | Billing/subscription UI page                   |
| `src/app/(dashboard)/billing/page-client.tsx`     | Client component for payment interactions      |
| `supabase/migrations/00006_subscriptions.sql`     | Subscriptions + payments tables migration      |

### Modified Files

| File                                              | Changes                                        |
| ------------------------------------------------- | ---------------------------------------------- |
| `src/middleware.ts`                                | Add subscription status check for protected routes |
| `src/app/auth/onboarding/onboarding-form.tsx`     | Auto-start free trial on business registration |
| `src/app/(dashboard)/sidebar.tsx`                 | Show subscription status badge                 |
| `src/app/(dashboard)/settings/page.tsx`           | Add billing section link                       |

### Database Changes

**New table: `subscriptions`**

| Column               | Type        | Constraints                        |
| -------------------- | ----------- | ---------------------------------- |
| id                   | uuid        | PK, default gen_random_uuid()     |
| business_id          | uuid        | FK -> businesses, UNIQUE, NOT NULL |
| plan                 | text        | "trial" or "paid"                  |
| status               | text        | trial/active/grace_period/suspended/cancelled |
| billing_key          | text        | PortOne billing key (encrypted)    |
| current_period_start | timestamptz | Start of current billing period    |
| current_period_end   | timestamptz | End of current billing period      |
| trial_ends_at        | timestamptz | Trial expiration date              |
| cancelled_at         | timestamptz | null if not cancelled              |
| retry_count          | integer     | Payment retry counter, default 0   |
| created_at           | timestamptz | default now()                      |
| updated_at           | timestamptz | default now()                      |

**New table: `payments`**

| Column             | Type        | Constraints                        |
| ------------------ | ----------- | ---------------------------------- |
| id                 | uuid        | PK, default gen_random_uuid()     |
| subscription_id    | uuid        | FK -> subscriptions, NOT NULL      |
| amount             | integer     | Payment amount in KRW              |
| status             | text        | pending/paid/failed/refunded       |
| portone_payment_id | text        | PortOne transaction ID             |
| pg_provider        | text        | "tosspayments" or "kakaopay"       |
| paid_at            | timestamptz | null if not paid                   |
| failed_reason      | text        | null on success                    |
| created_at         | timestamptz | default now()                      |

### Architecture

```
[User] --> Billing Page --> PortOne V2 SDK (client-side)
  |                              |
  |                              v
  |                        Billing Key Issued
  |                              |
  v                              v
/api/billing/subscribe --> [portone-client.ts]
  |                              |
  v                              v
[subscription.ts]          PortOne V2 REST API
  |                              |
  v                              v
subscriptions table        [Recurring Payment]
                                 |
                                 v
                        /api/billing/webhook <-- PortOne Webhook
                                 |
                                 v
                        [webhook.ts] --> Update payment + subscription status
                                 |
                                 v (on failure)
                        Retry (3x, 24h interval)
                                 |
                                 v (all retries failed)
                        Grace Period (3 days) --> Suspended

[middleware.ts]
  |-- Check subscription status on each request
  |-- Expired/Suspended: restrict to read-only
  |-- Show upgrade prompt on restricted features
```

### Lifecycle State Machine

```
[Registration] --> trial
trial --> trial_ending (D-2 alert)
trial_ending --> trial_expired (no payment) --> read-only
trial_ending --> active (payment success)
active --> payment_failed (payment fails)
payment_failed --> active (retry success)
payment_failed --> grace_period (3 retries exhausted)
grace_period --> active (manual payment)
grace_period --> suspended (3 days elapsed)
suspended --> active (manual payment)
active --> cancelled (user cancels, access until period end)
cancelled --> [end] (period ends)
```

### Constraints

- C1: Billing key must be stored encrypted in the database
- C2: Webhook endpoint must verify PortOne signature to prevent spoofing
- C3: All payment amounts are in KRW (integer, no decimals)
- C4: Subscription check in middleware must not add > 50ms latency
- C5: PortOne credentials must never be exposed to client-side code
- C6: All payment operations must be idempotent (handle duplicate webhooks)
- C7: UI must use "hire" framing, never "subscribe" or "subscription fee"

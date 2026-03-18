# SPEC-BILLING-001: Acceptance Criteria

## Traceability

| SPEC ID | Tag Range         |
| ------- | ----------------- |
| SPEC-BILLING-001 | REQ-B1-01 ~ REQ-B4-03 |

---

## Test Scenarios

### AC-B1: Subscription Plans

**AC-B1-01: Two Plan Offering** (REQ-B1-01)

```gherkin
Given a user views the billing page
When the available plans are displayed
Then exactly two plans are shown:
  | Plan        | Price        | Sync Frequency | Duration  |
  | Free Trial  | 0 KRW        | 1x/week        | 7 days    |
  | Paid        | 9,900 KRW/mo | 5x/day         | Monthly   |
```

**AC-B1-02: Agent Salary Framing** (REQ-B1-02)

```gherkin
Given the billing page is rendered
When the user views pricing information
Then the CTA button reads "Hire Agent" (not "Subscribe")
And the plan name reads "Agent Employment" (not "Subscription")
And no instance of "subscription fee" appears on the page
And Korean text uses "점장 고용하기" framing
```

**AC-B1-03: Auto Free Trial** (REQ-B1-03)

```gherkin
Given a new user completes business registration via onboarding
When the registration is successful
Then a subscription record is created with plan "trial"
And trial_ends_at is set to 7 days from now
And the user has full access to all features immediately
```

### AC-B2: PortOne V2 Integration

**AC-B2-01: Billing Key Issuance** (REQ-B2-01)

```gherkin
Given a user clicks "Register Card" on the billing page
When the PortOne V2 SDK card registration modal opens
And the user enters valid card information
Then a billing key is issued by PortOne
And the billing key is stored encrypted in the subscriptions table
And the card registration completes in under 30 seconds
```

**AC-B2-02: Auto-Recurring Payment** (REQ-B2-02)

```gherkin
Given a subscription with status "active" and billing_key set
When the billing date arrives (monthly interval)
Then PortOne charges 9,900 KRW using the stored billing key
And a payments record is created with status "paid"
And current_period_start and current_period_end are updated
```

**AC-B2-03: Payment Retry** (REQ-B2-03)

```gherkin
Given a payment attempt fails
When the system retries
Then up to 3 retry attempts are made at 24-hour intervals
And each attempt creates a payments record
And retry_count is incremented on each attempt
And a KakaoTalk alert is sent on each failure
```

**AC-B2-04: Multi-PG Support** (REQ-B2-04)

```gherkin
Given PortOne is configured with TossPayments and KakaoPay channels
When a user registers a card
Then both TossPayments and KakaoPay are available as payment options
And the pg_provider is recorded in the payments table
```

**AC-B2-05: Credential Security** (REQ-B2-05)

```gherkin
Given PORTONE_API_KEY, PORTONE_API_SECRET, and PORTONE_STORE_ID are environment variables
When the PortOne client initializes
Then credentials are read from environment variables only
And credentials are never included in client-side JavaScript bundles
And credentials are never logged in application logs
```

### AC-B3: Subscription Lifecycle

**AC-B3-01: Lifecycle State Machine** (REQ-B3-01)

```gherkin
Given a subscription exists for business B1
When state transitions occur
Then only valid transitions are allowed:
  | From            | To              | Trigger                    |
  | trial           | active          | Payment success            |
  | trial           | trial_expired   | 7 days elapsed, no payment |
  | active          | payment_failed  | Payment fails              |
  | payment_failed  | active          | Retry success              |
  | payment_failed  | grace_period    | 3 retries exhausted        |
  | grace_period    | active          | Manual payment             |
  | grace_period    | suspended       | 3 days elapsed             |
  | active          | cancelled       | User cancels               |
```

**AC-B3-02: Trial Ending Alert** (REQ-B3-02)

```gherkin
Given a subscription with trial_ends_at 2 days from now
When the daily subscription check runs
Then a KakaoTalk alert is sent: "Your free trial ends in 2 days. Hire your AI agent to continue!"
And the message contains a deep link to the billing page
```

**AC-B3-03: Payment Success Transition** (REQ-B3-03)

```gherkin
Given a subscription in "trial" status with a billing key
When payment of 9,900 KRW succeeds
Then status transitions to "active"
And current_period_start is set to now
And current_period_end is set to 30 days from now
And a payments record is created with status "paid"
```

**AC-B3-04: Grace Period and Suspension** (REQ-B3-04)

```gherkin
Given a payment has failed 3 times (retry_count = 3)
When the last retry fails
Then subscription enters "grace_period" status
And after 3 days without successful payment
Then subscription transitions to "suspended"
And a KakaoTalk alert notifies the owner
```

**AC-B3-05: Cancellation with Period Access** (REQ-B3-05)

```gherkin
Given an active subscription with current_period_end 15 days from now
When the user cancels the subscription
Then cancelled_at is set to now
And status transitions to "cancelled"
And the user retains full access for the remaining 15 days
And no further payments are charged
```

### AC-B4: Access Control

**AC-B4-01: Expired User Restrictions** (REQ-B4-01)

```gherkin
Given a subscription with status "suspended"
When the user navigates to /dashboard
Then the dashboard displays in read-only mode
And AI chat input is disabled
And data sync buttons are disabled
And agent features show lock icons
```

**AC-B4-02: Upgrade Prompt** (REQ-B4-02)

```gherkin
Given a user with expired subscription
When the user clicks on a restricted AI feature
Then an upgrade prompt modal appears
And the modal displays: "Hire your AI agent to use this feature"
And the modal contains a CTA button linking to /billing
```

**AC-B4-03: Middleware Check** (REQ-B4-03)

```gherkin
Given a request to a protected route
When the middleware checks subscription status
Then the check completes in under 50ms
And the subscription status is available via x-subscription-status header
And expired/suspended users are restricted appropriately
```

---

## Quality Gates

| Gate                      | Criteria                                              |
| ------------------------- | ----------------------------------------------------- |
| Payment Security          | Billing keys encrypted at rest; no PCI data stored    |
| Webhook Idempotency       | Duplicate webhook events do not create duplicate payments |
| Middleware Latency         | Subscription check adds < 50ms to request time        |
| UI Framing                | Zero instances of "subscribe"/"subscription fee" in UI|
| State Machine Integrity   | Only valid state transitions are possible             |
| Card Registration UX      | Billing key issued in < 30 seconds                    |
| Test Coverage             | 85%+ coverage on all new files                        |
| RLS Compliance            | All queries scoped to authenticated business_id       |

---

## Definition of Done

- [ ] 7-day free trial starts automatically on signup
- [ ] Billing page shows "Hire Agent" framing, not "Subscribe"
- [ ] Card registration via PortOne V2 SDK works in < 30 seconds
- [ ] Monthly auto-payment of 9,900 KRW executes on billing date
- [ ] Failed payments retry 3 times with 24-hour intervals
- [ ] Payment failure sends KakaoTalk notification
- [ ] Trial ending alert (D-2) sent via KakaoTalk
- [ ] Grace period (3 days) before suspension
- [ ] Expired users see upgrade prompt, cannot use AI features
- [ ] Subscription status visible in sidebar badge
- [ ] Webhook verifies PortOne signature
- [ ] Duplicate webhooks handled idempotently
- [ ] Middleware subscription check < 50ms
- [ ] All database operations use RLS policies
- [ ] Test coverage >= 85% on new files
- [ ] No TypeScript errors, no ESLint warnings

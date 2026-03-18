# SPEC-HYPHEN-001: Hyphen Data Integration Platform

## Metadata

| Field       | Value                              |
| ----------- | ---------------------------------- |
| SPEC ID     | SPEC-HYPHEN-001                    |
| Title       | Hyphen Data Integration Platform   |
| Created     | 2026-03-18                         |
| Status      | Planned                            |
| Priority    | High                               |
| Lifecycle   | spec-anchored                      |
| Related     | SPEC-AUTH-002, SPEC-INFRA-001      |

---

## Environment

- **Platform**: Next.js 16 (App Router), React 19, Supabase
- **Integration**: Hyphen API (OAuth 2.0, 7-day token expiry)
- **Data Sources**: Delivery apps (Baemin, Coupang Eats, Yogiyo), Card sales (Credit Finance Association)
- **Existing Skeleton**: `src/lib/hyphen/client.ts` (basic client, needs OAuth upgrade)
- **Database**: Supabase PostgreSQL with existing tables (revenues, expenses, api_connections, sync_logs)
- **Scheduler**: Supabase Edge Functions (Deno runtime)
- **Environment Variables**: `HYPHEN_API_KEY`, `HYPHEN_API_SECRET`

---

## Assumptions

- A1: The Hyphen API provides unified endpoints for Baemin, Coupang Eats, and Yogiyo data.
- A2: Hyphen OAuth 2.0 tokens expire after 7 days and can be refreshed using a refresh token.
- A3: Delivery app credentials are provided by the user and must be encrypted at rest.
- A4: The existing `api_connections` table can store connection status per platform.
- A5: Supabase Edge Functions support cron-based scheduling for periodic sync.
- A6: Card sales data from the Credit Finance Association follows a D+2 to D+30 settlement cycle.

---

## Requirements

### Ubiquitous Requirements

- **[U1]** The system shall encrypt all third-party credentials before storing in the database.
- **[U2]** The system shall log all sync operations to the `sync_logs` table with status, duration, and record count.
- **[U3]** The system shall never expose decrypted credentials in API responses or client-side code.
- **[U4]** The system shall handle Hyphen API rate limits gracefully with exponential backoff.

### Event-Driven Requirements

- **[E1]** **When** a user links a delivery app account via the settings page, **then** the system shall encrypt the credentials and store them in `api_connections`.
- **[E2]** **When** the sync scheduler triggers, **then** the system shall refresh expired OAuth tokens before fetching data.
- **[E3]** **When** delivery sales data is fetched from Hyphen, **then** the system shall normalize the data and insert into the `revenues` table.
- **[E4]** **When** card sales data is fetched from Hyphen, **then** the system shall normalize approval, acquisition, and deposit records into `revenues` and `expenses` tables.
- **[E5]** **When** review data is fetched from Hyphen, **then** the system shall insert into the `delivery_reviews` table with platform source.
- **[E6]** **When** a sync operation fails, **then** the system shall log the error, increment retry count, and schedule a retry (max 3 retries).
- **[E7]** **When** a user unlinks an account, **then** the system shall delete the encrypted credentials and mark the connection as inactive.

### State-Driven Requirements

- **[S1]** **If** the user is on a paid plan, **then** the sync scheduler shall run 5 times per day (every 4.8 hours).
- **[S2]** **If** the user is on a free trial, **then** the sync scheduler shall run once per week.
- **[S3]** **If** a Hyphen OAuth token is within 24 hours of expiry, **then** the system shall proactively refresh the token.

### Unwanted Behavior Requirements

- **[X1]** The system shall **not** store plaintext credentials in any table or log.
- **[X2]** The system shall **not** duplicate revenue records when syncing overlapping date ranges.
- **[X3]** The system shall **not** crash or halt the application when a sync operation fails.

### Optional Requirements

- **[O1]** **Where possible**, the system shall display sync progress indicators in the UI.
- **[O2]** **Where possible**, the system shall allow manual sync triggering from the settings page.

---

## Specifications

### File Changes

| Action   | File Path                                              | Description                                 |
| -------- | ------------------------------------------------------ | ------------------------------------------- |
| Modify   | `src/lib/hyphen/client.ts`                             | Add OAuth 2.0 token management              |
| Create   | `src/lib/hyphen/oauth.ts`                              | Token lifecycle (issue, refresh, store)      |
| Create   | `src/lib/hyphen/sync-delivery.ts`                      | Delivery app sales data sync                |
| Create   | `src/lib/hyphen/sync-card.ts`                          | Card sales sync (approval/acquisition/deposit) |
| Create   | `src/lib/hyphen/sync-review.ts`                        | Review data sync                            |
| Create   | `src/lib/hyphen/normalizer.ts`                         | Data normalization to DB schema             |
| Modify   | `src/lib/hyphen/types.ts`                              | Add delivery, card, review type definitions |
| Create   | `src/app/(dashboard)/settings/connections/page.tsx`    | Account linking UI                          |
| Create   | `supabase/functions/sync-scheduler/index.ts`           | Edge Function for scheduled sync            |
| Modify   | `src/types/database.ts`                                | Add encrypted_credentials column type       |

### Database Changes

**Migration: `supabase/migrations/00003_hyphen_integration.sql`**

```sql
-- Add encrypted credentials to api_connections
ALTER TABLE api_connections
ADD COLUMN IF NOT EXISTS encrypted_credentials TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_frequency TEXT DEFAULT 'weekly';

-- Create delivery_reviews table
CREATE TABLE IF NOT EXISTS delivery_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('baemin', 'coupang_eats', 'yogiyo')),
  external_review_id TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  reply TEXT,
  reply_status TEXT DEFAULT 'pending' CHECK (reply_status IN ('pending', 'replied', 'skipped')),
  review_date TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (platform, external_review_id)
);

-- RLS for delivery_reviews
ALTER TABLE delivery_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reviews"
  ON delivery_reviews FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
```

### Data Normalization Strategy

```
Hyphen Delivery Sales -> revenues table:
  - amount: order total
  - category: 'delivery'
  - source: platform name (baemin/coupang_eats/yogiyo)
  - date: order date
  - metadata: { order_id, commission_rate, net_amount }

Hyphen Card Sales -> revenues table:
  - amount: approved amount
  - category: 'card'
  - source: card issuer name
  - date: approval date
  - metadata: { approval_no, settlement_date, acquisition_date }

Deduplication: UNIQUE constraint on (business_id, source, external_id, date)
```

### OAuth 2.0 Token Flow

```
1. User provides platform credentials
2. System calls Hyphen OAuth endpoint to obtain access_token + refresh_token
3. Tokens stored encrypted in api_connections.encrypted_credentials
4. Token expiry tracked in api_connections.token_expires_at
5. Auto-refresh when within 24h of expiry
6. If refresh fails, mark connection as 'expired' and notify user
```

### Sync Scheduler Architecture

```
Supabase Edge Function (cron):
  1. Query api_connections WHERE status = 'active' AND next_sync_at <= NOW()
  2. For each connection:
     a. Refresh token if needed
     b. Fetch data from Hyphen API
     c. Normalize via normalizer.ts
     d. Upsert into target tables
     e. Update sync_logs
     f. Calculate next_sync_at based on plan tier
```

---

## Traceability

| Requirement | Test Scenario              | Acceptance Criteria        |
| ----------- | -------------------------- | -------------------------- |
| E1          | AC-1: Account linking      | acceptance.md#AC-1         |
| E3          | AC-2: Delivery sync        | acceptance.md#AC-2         |
| E4          | AC-3: Card sync            | acceptance.md#AC-3         |
| E5          | AC-4: Review sync          | acceptance.md#AC-4         |
| S1/S2       | AC-5: Sync frequency       | acceptance.md#AC-5         |
| U1/X1       | AC-6: Credential security  | acceptance.md#AC-6         |
| E6/X3       | AC-7: Error handling       | acceptance.md#AC-7         |

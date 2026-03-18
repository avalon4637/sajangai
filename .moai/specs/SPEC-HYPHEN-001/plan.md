# SPEC-HYPHEN-001: Implementation Plan

## Overview

Build the Hyphen data integration platform that connects delivery app and card sales data to sajang.ai. This enables automatic revenue/expense data collection, replacing manual CSV imports for connected users.

---

## Milestones

### Primary Goal: OAuth Token Management & Account Linking

**Priority: High**

Tasks:
1. Implement `src/lib/hyphen/oauth.ts` - Token lifecycle management
   - Token issuance via Hyphen OAuth endpoint
   - Encrypted storage using AES-256-GCM with server-side key
   - Auto-refresh logic for tokens within 24h of expiry
   - Token revocation on account unlink
2. Upgrade `src/lib/hyphen/client.ts` - Add authenticated request support
   - Attach Bearer token to all Hyphen API calls
   - Handle 401 responses with automatic token refresh
   - Implement exponential backoff for rate limits
3. Create `src/app/(dashboard)/settings/connections/page.tsx` - Account linking UI
   - Platform selection (Baemin, Coupang Eats, Yogiyo, Card Sales)
   - Credential input form with secure handling
   - Connection status indicators (active, expired, error)
   - Unlink button with confirmation dialog

Dependencies: SPEC-AUTH-002 (user must be authenticated)

### Secondary Goal: Data Sync Modules

**Priority: High**

Tasks:
1. Create `src/lib/hyphen/sync-delivery.ts`
   - Fetch sales data per platform (Baemin, Coupang Eats, Yogiyo)
   - Date range management (incremental sync from last_sync_at)
   - Commission and fee extraction
2. Create `src/lib/hyphen/sync-card.ts`
   - Fetch card approval records
   - Fetch acquisition (settlement) records
   - Fetch deposit records
   - Map settlement cycles (D+2 to D+30) per issuer
3. Create `src/lib/hyphen/sync-review.ts`
   - Fetch review data per delivery platform
   - Extract rating, content, existing replies
   - Track reply status (pending/replied/skipped)
4. Create `src/lib/hyphen/normalizer.ts`
   - Map Hyphen response schemas to database table columns
   - Deduplication logic using external_id + date composite key
   - Metadata extraction for detailed breakdown

Dependencies: Hyphen API documentation and test credentials

### Tertiary Goal: Sync Scheduler

**Priority: Medium**

Tasks:
1. Create `supabase/functions/sync-scheduler/index.ts`
   - Cron-triggered Edge Function
   - Query active connections needing sync
   - Execute sync per connection with error isolation
   - Update sync_logs with results
2. Implement sync frequency logic
   - Paid users: every 4.8 hours (5x/day)
   - Free trial users: once per week
   - Respect rate limits per Hyphen API tier
3. Add sync status display to settings/connections page

Dependencies: Supabase Edge Functions access

### Final Goal: Database Migration & Testing

**Priority: Medium**

Tasks:
1. Create migration `supabase/migrations/00003_hyphen_integration.sql`
   - Add columns to `api_connections`
   - Create `delivery_reviews` table with RLS
2. Update `src/types/database.ts` with new types
3. Write unit tests for normalizer and OAuth modules
4. Integration tests for sync pipeline
5. Verify RLS policies on new tables

---

## Technical Approach

### Encryption Strategy

- Algorithm: AES-256-GCM
- Key source: `ENCRYPTION_KEY` environment variable (derived from `HYPHEN_API_SECRET`)
- Storage: Base64-encoded ciphertext in `encrypted_credentials` column
- Decryption: Server-side only, never in client components

### Sync Pipeline Architecture

```
[Cron Trigger] -> [Edge Function]
                       |
              [Query Active Connections]
                       |
         [For Each Connection (isolated)]
                       |
              [Refresh Token if Needed]
                       |
              [Fetch from Hyphen API]
                       |
              [Normalize Data]
                       |
              [Upsert to DB (dedup)]
                       |
              [Log to sync_logs]
```

### Error Isolation

Each connection sync runs independently. A failure in one connection does not affect others. Each sync operation:
1. Wraps in try/catch
2. Logs error to sync_logs with error details
3. Increments retry_count
4. Schedules retry after exponential backoff (1min, 5min, 15min)
5. After 3 failures, marks connection as 'error' and notifies user

---

## Risks and Mitigation

| Risk                                    | Impact | Mitigation                                        |
| --------------------------------------- | ------ | ------------------------------------------------- |
| Hyphen API schema changes               | High   | Version-pinned normalizer, schema validation      |
| Credential encryption key rotation      | High   | Key versioning, re-encryption migration script    |
| Sync data volume exceeds Edge Function limits | Medium | Paginated fetching, batch upserts               |
| Duplicate records from overlapping syncs | Medium | UNIQUE constraints, upsert with ON CONFLICT      |
| User credential exposure via logs       | High   | Structured logging with credential field exclusion |

---

## Environment Variables

| Variable             | Required | Description                              |
| -------------------- | -------- | ---------------------------------------- |
| `HYPHEN_API_KEY`     | Yes      | Hyphen API client key                    |
| `HYPHEN_API_SECRET`  | Yes      | Hyphen API secret (also used as encryption key base) |

---

## Tags

- SPEC-HYPHEN-001
- Phase: 2
- Domain: Data Integration, Delivery, Card Sales, Reviews

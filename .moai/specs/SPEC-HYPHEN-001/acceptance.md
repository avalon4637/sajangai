# SPEC-HYPHEN-001: Acceptance Criteria

## AC-1: Account Linking

**Given** the user is on the settings/connections page
**When** the user selects a delivery platform (Baemin, Coupang Eats, or Yogiyo)
**And** enters valid credentials
**And** clicks "Connect"
**Then** the system encrypts the credentials and stores them in `api_connections`
**And** the connection status shows as "Active"
**And** an initial sync is triggered within 1 minute

**Given** the user has an active connection
**When** the user clicks "Disconnect"
**Then** the encrypted credentials are deleted from `api_connections`
**And** the connection status changes to "Disconnected"

---

## AC-2: Delivery Sales Data Sync

**Given** an active delivery app connection exists
**When** the sync scheduler runs
**Then** sales data from the connected platform appears in the `revenues` table within 5 minutes
**And** each record includes: amount, date, category='delivery', source=platform name
**And** metadata contains order_id, commission_rate, and net_amount
**And** no duplicate records are created for the same order

---

## AC-3: Card Sales Data Sync

**Given** an active card sales connection exists via Hyphen
**When** the sync scheduler runs
**Then** card approval records appear in the `revenues` table
**And** card processing fees appear in the `expenses` table
**And** settlement schedule data (D+2 to D+30) is captured in metadata
**And** each record is tagged with the card issuer name

---

## AC-4: Review Data Sync

**Given** an active delivery app connection exists
**When** the sync scheduler runs
**Then** customer reviews appear in the `delivery_reviews` table
**And** each review includes: platform, rating (1-5), content, review_date
**And** reply_status defaults to 'pending' for new reviews
**And** existing reviews are not duplicated (unique by platform + external_review_id)

---

## AC-5: Sync Frequency by Plan

**Given** a user is on a paid plan
**When** the sync scheduler evaluates the user's connections
**Then** syncs occur 5 times per day (approximately every 4.8 hours)

**Given** a user is on a free trial
**When** the sync scheduler evaluates the user's connections
**Then** syncs occur once per week

---

## AC-6: Credential Security

**Given** any API response containing connection data
**When** the response is sent to the client
**Then** no decrypted credentials are included in the response body

**Given** any log entry related to sync operations
**When** the log is written
**Then** no plaintext credentials appear in log content

**Given** the `api_connections` table
**When** credentials are stored
**Then** they are encrypted using AES-256-GCM before storage

---

## AC-7: Sync Error Handling

**Given** a sync operation encounters a Hyphen API error
**When** the error occurs
**Then** the error is logged to `sync_logs` with error details
**And** the sync for other connections continues unaffected
**And** a retry is scheduled with exponential backoff (up to 3 retries)
**And** after 3 failed retries, the connection status changes to "Error"

**Given** a sync operation fails
**When** the user views the settings/connections page
**Then** the error status and last error message are visible
**And** a "Retry Now" button is available

---

## AC-8: Data Deduplication

**Given** a sync operation fetches data overlapping with previously synced records
**When** the normalizer processes the data
**Then** existing records are updated (upserted), not duplicated
**And** the total record count matches the unique records from the source

---

## Quality Gates

| Gate                      | Criteria                                              |
| ------------------------- | ----------------------------------------------------- |
| Sync Latency              | Data appears within 5 minutes of sync trigger         |
| Credential Security       | Zero plaintext credentials in DB, logs, or responses  |
| Error Isolation           | Single connection failure does not affect others      |
| Deduplication             | Zero duplicate records after repeated syncs           |
| Sync Logging              | 100% of sync operations logged with status & duration |
| Frequency Accuracy        | Paid=5x/day, Trial=1x/week within 10% tolerance      |

---

## Verification Methods

- **Unit Tests**: Normalizer functions, encryption/decryption, deduplication logic
- **Integration Tests**: Hyphen API mock + sync pipeline end-to-end
- **Security Audit**: Credential storage encryption verification
- **Load Tests**: Sync with 10,000+ records per operation
- **Manual Tests**: Account linking UI, connection status display, error recovery

---

## Definition of Done

- [ ] Account linking works for all 3 delivery platforms
- [ ] Delivery sales sync populates revenues table correctly
- [ ] Card sales sync populates revenues and expenses tables
- [ ] Review sync populates delivery_reviews table
- [ ] Sync frequency matches plan tier (5x/day paid, 1x/week trial)
- [ ] All credentials encrypted at rest (AES-256-GCM)
- [ ] No credential exposure in logs or API responses
- [ ] Sync errors logged and isolated per connection
- [ ] Deduplication verified with overlapping sync runs
- [ ] RLS policies applied to delivery_reviews table
- [ ] Database migration tested and reversible

---

## Tags

- SPEC-HYPHEN-001

# N+1 Query Audit

> Phase 3.6 → Phase 4 — 2026-04-12
>
> Inventory of query hotspots where a loop performs one DB roundtrip per
> element. Fixing these reduces latency, lowers Supabase egress cost, and
> improves sync reliability (fewer chances for mid-loop crashes).
>
> **Phase 4 update**: Fixes #2, #3, #4 resolved via migration
> `20260412000003_revenues_external_id.sql` + batched upsert refactor.
> The previous loop bodies were also latent dedup bugs: they relied on an
> `error.code === "23505"` branch that could never fire because `revenues`
> had no UNIQUE constraint.

## Methodology

1. Grep for `await supabase...insert|update|upsert` inside `for`/`forEach` loops
2. Cross-reference with actual observed N (batch size during sync)
3. Rank by (N × call_frequency) — higher = bigger win

## Findings

### 🔴 HIGH — `src/lib/hyphen/sync-delivery.ts:86-104` (syncDeliverySales)

Each `order` gets its own `.insert()`. Typical batch is 30~300 orders per
sync. At 5 sync runs/day × N orders, this is the largest N+1 in the codebase.

**Current**:
```ts
for (const order of orders) {
  const normalized = normalizeDeliveryOrder(order, businessId, platform);
  const { error } = await supabase.from("revenues").insert(normalized);
  // ...
}
```

**Fix**: Batch upsert with `onConflict` dedup.
```ts
const rows = orders.map((o) => normalizeDeliveryOrder(o, businessId, platform));
const { error } = await supabase
  .from("revenues")
  .upsert(rows, { onConflict: "...", ignoreDuplicates: true });
```

**Blocker (resolved in Phase 4)**: Added `revenues.external_id` column and
partial `UNIQUE (business_id, channel, external_id) WHERE external_id IS NOT NULL`
in migration `20260412000003_revenues_external_id.sql`. Dedup key for delivery
rows is `orderNo`.

**Status**: ✅ Fixed in Phase 4 — 500-row chunked upsert with
`onConflict: "business_id,channel,external_id"` and `ignoreDuplicates: true`.

---

### 🟠 MEDIUM — `src/lib/hyphen/sync-delivery.ts:163-182` (syncDeliveryReviews)

Same pattern but with upsert already in place. Can be converted to a single
batched upsert immediately since the onConflict key
`(business_id, platform, external_id)` already exists.

**Current**:
```ts
for (const review of allReviews) {
  const normalized = normalizeDeliveryReview(review, businessId, platform);
  const { error } = await supabase
    .from("delivery_reviews")
    .upsert(normalized, {
      onConflict: "business_id,platform,external_id",
      ignoreDuplicates: false,
    });
}
```

**Fix**: Collect all normalized rows, batch-upsert in chunks of 500.

**Status**: ✅ Fixed in Phase 3.6

---

### 🟠 MEDIUM — `src/lib/hyphen/sync-card.ts:82-107` (syncCardSales)

Per-approval loop with `insert()`. Card sync typically 50~200 rows per
period.

**Status**: ✅ Fixed in Phase 4 — shares the same `revenues.external_id`
partial UNIQUE as delivery. Dedup key is `approval.appNo` (승인번호, unique
per card company), `channel = "카드"`. Cancelled rows are filtered before
the batch, then upserted in 500-row chunks.

---

### 🟠 MEDIUM — `src/lib/hyphen/sync-card.ts:56-93` (syncCardSettlements)

Already uses upsert with `onConflict` — can be batched directly.

**Status**: ✅ Fixed in Phase 4 — 500-row chunked upsert with
`onConflict: "business_id,card_company,pay_scheduled_date,sales_amount"`
and `ignoreDuplicates: false` (preserves pay_date/status refresh).

---

### 🟡 LOW — `src/app/api/cron/trial-nurture/route.ts:87-100`

For each trial business, runs a separate dedup lookup against
`agent_activity_log`. Acceptable at current scale (<100 trial users) but
should be converted to a single pre-join query once trial volume grows.

**Current**:
```ts
for (const trial of typedTrials) {
  const { data: existing } = await supabase
    .from("agent_activity_log")
    .select("id")
    .eq("business_id", trial.business_id)
    .like("summary", `trial_nurture_d${dayNumber}%`)
    ...
}
```

**Fix**: Fetch all today's sent notifications in one query, then check
in-memory per business.

**Status**: Acceptable — revisit when trial user count > 500.

---

### 🟡 LOW — `src/lib/ai/jeongjang-engine.ts:250-273`

Per-business viral store_context upsert inside a branch. Only fires once per
morning routine, so N+1 depth = 1. Not a concern.

**Status**: No action needed.

---

## Fix Priority

| # | Location | Impact | Phase |
|---|---|---|---|
| 1 | syncDeliveryReviews | ~100 roundtrips/sync | ✅ Phase 3.6 |
| 2 | syncDeliverySales | ~200 roundtrips/sync | ✅ Phase 4 |
| 3 | syncCardSales | ~100 roundtrips/sync | ✅ Phase 4 |
| 4 | syncCardSettlements | ~30 roundtrips/sync | ✅ Phase 4 |
| 5 | trial-nurture loop | <100 roundtrips/day | Deferred (low volume) |

## Estimated savings

| Sync path | Before | After | Speedup |
|---|---|---|---|
| delivery reviews (Phase 3.6) | 100 × 50ms = 5,000 ms | 1 × 150ms = 150 ms | ~33× |
| delivery sales (Phase 4) | 200 × 50ms = 10,000 ms | 1 × 200ms = 200 ms | ~50× |
| card sales (Phase 4) | 100 × 50ms = 5,000 ms | 1 × 150ms = 150 ms | ~33× |
| card settlements (Phase 4) | 30 × 50ms = 1,500 ms | 1 × 80ms = 80 ms | ~19× |

Secondary benefits:
- Error isolation: one bad row no longer aborts the batch
- Re-sync is now idempotent (dedup via UNIQUE index, not phantom 23505)
- Supabase egress cost drops proportionally with roundtrip reduction

## Residual work (Phase 5+)

- **Cleanup of existing duplicate revenues rows**: Before this migration,
  re-syncs would have created duplicates if any sync ever ran twice on
  the same window. A one-time dedup script may be needed in prod once
  Hyphen goes live. Out of scope for Phase 4 (no live data yet).
- **trial-nurture loop**: Revisit when trial user count > 500.

---

Version: 2.0.0
Owner: expert-performance → completed by Phase 4

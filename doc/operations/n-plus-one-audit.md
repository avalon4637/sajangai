# N+1 Query Audit

> Phase 3.6 — 2026-04-12
>
> Inventory of query hotspots where a loop performs one DB roundtrip per
> element. Fixing these reduces latency, lowers Supabase egress cost, and
> improves sync reliability (fewer chances for mid-loop crashes).

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

**Blocker**: `revenues` table has no declared UNIQUE for delivery dedup key.
The current code relies on `23505` errors from an implicit constraint.
Before batching, we need to pick a dedup column or add a new one.

**Status**: Deferred — needs DB constraint first.

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
period. Same blocker as syncDeliverySales (no declared UNIQUE).

**Status**: Deferred — same DB constraint issue.

---

### 🟠 MEDIUM — `src/lib/hyphen/sync-card.ts:56-93` (syncCardSettlements)

Already uses upsert with `onConflict` — can be batched directly.

**Status**: Fix candidate for next iteration.

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

| # | Location | Impact | Fix in this phase |
|---|---|---|---|
| 1 | syncDeliveryReviews | ~100 roundtrips/sync | ✅ Yes |
| 2 | syncDeliverySales | ~200 roundtrips/sync | No (DB constraint) |
| 3 | syncCardSales | ~100 roundtrips/sync | No (DB constraint) |
| 4 | syncCardSettlements | ~30 roundtrips/sync | Next iteration |
| 5 | trial-nurture loop | <100 roundtrips/day | No (low volume) |

## Estimated savings (after Fix #1)

- Before: 100 × 50ms = 5,000 ms per delivery review sync
- After: 1 × 150ms = 150 ms
- **Speedup: ~33×** for the review sync path
- Error isolation: one bad row no longer fails the row after it

## Prerequisites for Fix #2/#3

Add `UNIQUE` constraints on `revenues` and card-related dedup columns, then
follow the same batched-upsert pattern.

---

Version: 1.0.0
Owner: expert-performance (future)

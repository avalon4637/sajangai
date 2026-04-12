-- Phase 4 — Revenues dedup key
-- Adds external_id column + partial UNIQUE index to revenues so that
-- Hyphen delivery orders (orderNo) and card approvals (appNo) can be
-- safely batch-upserted without creating duplicates on re-sync.
--
-- Background:
--   Before this migration, revenues had no dedup key. syncDeliverySales()
--   and syncCardSales() were doing per-row inserts inside a loop and
--   relying on a phantom "23505" error path that could never fire because
--   no UNIQUE constraint existed. On re-sync, rows would be duplicated.
--
-- Dedup strategy:
--   (business_id, channel, external_id) — channel disambiguates batteries
--   of sources (배달의민족 / 쿠팡이츠 / 요기요 / 카드). Partial index on
--   "WHERE external_id IS NOT NULL" keeps manually-entered revenues (which
--   have no external id) free of any uniqueness constraint.

ALTER TABLE revenues
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_revenues_dedup
  ON revenues (business_id, channel, external_id)
  WHERE external_id IS NOT NULL;

COMMENT ON COLUMN revenues.external_id IS
  'External system unique id (Baemin orderNo, card appNo, ...). Used for re-sync dedup.';

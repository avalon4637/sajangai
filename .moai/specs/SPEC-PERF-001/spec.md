---
id: SPEC-PERF-001
version: "1.0.0"
status: ready
created: "2026-03-03"
priority: P1
depends_on: ["SPEC-SEC-001"]
---

# SPEC-PERF-001: Performance and Error Handling Improvements

## Overview

Code review identified 5 high-priority issues affecting performance, data integrity, and user experience. These include N+1 query problems, silent error swallowing, sensitive data logging, client-side hydration issues, and KPI calculation consistency risks.

## Scope

- CSV import duplicate check query optimization
- Supabase query error handling in import flow
- Sensitive information removal from error logs
- Login page server-side session check migration
- KPI fixed cost filter logic consolidation

## Out of Scope

- UI/UX improvements (SPEC-QUALITY-001)
- CSV encoding detection (SPEC-POLISH-001)
- New feature development

---

## Requirements (EARS)

### REQ-01: CSV Duplicate Check Batch Query

**Ubiquitous:**
- The `checkDuplicates()` function SHALL query duplicates in batch, NOT per-row.
- The system SHALL complete duplicate checks in O(1) database calls, not O(N).

**Where:**
- File: `src/lib/actions/csv-import.ts`, function `checkDuplicates()`

**Rationale:**
- Current state: Loop executes individual Supabase query per CSV row. For 500-row CSV, this is 500 separate DB calls.
- Impact: Import of large CSV files takes 10-30 seconds, risk of timeout.

**Implementation Approach:**

```typescript
export async function checkDuplicates(rows: ImportRow[]): Promise<number[]> {
  const businessId = await getCurrentBusinessId();
  const supabase = await createClient();

  // Group rows by type
  const revenueRows = rows.filter((r) => r.type === "revenue");
  const expenseRows = rows.filter((r) => r.type === "expense");

  // Batch query: fetch all potential duplicates at once
  const dates = [...new Set(rows.map((r) => r.date))];

  const [{ data: existingRevenues }, { data: existingExpenses }] = await Promise.all([
    supabase
      .from("revenues")
      .select("date, amount, channel")
      .eq("business_id", businessId)
      .in("date", dates),
    supabase
      .from("expenses")
      .select("date, amount, category")
      .eq("business_id", businessId)
      .in("date", dates),
  ]);

  // Build lookup sets for O(1) matching
  const revSet = new Set(
    (existingRevenues ?? []).map((r) => `${r.date}|${r.amount}|${r.channel}`)
  );
  const expSet = new Set(
    (existingExpenses ?? []).map((e) => `${e.date}|${e.amount}|${e.category}`)
  );

  // Match against rows
  return rows.reduce<number[]>((acc, row, i) => {
    const key = row.type === "revenue"
      ? `${row.date}|${row.amount}|${row.channel}`
      : `${row.date}|${row.amount}|${row.category}`;
    if ((row.type === "revenue" ? revSet : expSet).has(key)) acc.push(i);
    return acc;
  }, []);
}
```

### REQ-02: Supabase Query Error Handling

**Ubiquitous:**
- All Supabase queries in `csv-import.ts` SHALL check for errors and handle them appropriately.
- The system SHALL NOT silently ignore query failures.

**Where:**
- File: `src/lib/actions/csv-import.ts`, function `checkDuplicates()` and `importCsvData()`

**Rationale:**
- Current state: `checkDuplicates()` destructures only `{ data }` without checking `error`. If query fails, `data` is null, function returns empty array, and all rows are treated as non-duplicates.
- Impact: Silent data duplication on DB errors.

**Implementation Approach:**

```typescript
const { data, error } = await query;
if (error) {
  throw new Error(`Duplicate check failed: ${error.message}`);
}
```

### REQ-03: Sensitive Information Logging Cleanup

**Ubiquitous:**
- Console error logs SHALL NOT include raw Supabase error details (codes, status, internal details).
- Error messages shown to users SHALL be generic and localized.

**Where:**
- Files: `src/app/auth/login/page.tsx` (line 52), `src/app/auth/onboarding/onboarding-form.tsx` (line 49)

**Rationale:**
- Current state: `console.error("Login error:", error.message, error.status)` exposes Supabase internal error structure to browser console.
- Impact: Information disclosure to attackers inspecting browser DevTools.

**Implementation Approach:**

```typescript
// Before (login/page.tsx line 52)
console.error("Login error:", error.message, error.status);

// After
if (process.env.NODE_ENV === "development") {
  console.error("Login error:", error.message);
}
```

### REQ-04: Login Session Check Server-Side Migration

**Ubiquitous:**
- Session validation on the login page SHALL be performed server-side, not client-side.
- The login page SHALL NOT render blank content during session check.

**Where:**
- File: `src/app/auth/login/page.tsx`

**Rationale:**
- Current state: Login page is `"use client"`, calls `supabase.auth.getSession()` in `useEffect`, shows `null` during check. This causes:
  - Flash of blank content
  - Hydration mismatch potential
  - Client-side redirect instead of server-side
- The existing middleware already handles auth redirects, making this client-side check redundant.

**Implementation Approach:**

```
Split into:
1. src/app/auth/login/page.tsx (Server Component) - session check + redirect
2. src/app/auth/login/login-form.tsx (Client Component) - form only

// page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return <LoginForm />;
}
```

### REQ-05: KPI Fixed Cost Filter Consolidation

**Ubiquitous:**
- Fixed cost date range filtering logic SHALL exist in exactly one location.
- All consumers of fixed cost data SHALL use the same filter function.

**Where:**
- Primary: `src/lib/actions/kpi-sync.ts` (lines 62-66)
- Secondary: `src/lib/queries/fixed-cost.ts` (if similar logic exists)

**Rationale:**
- Current state: Fixed cost date filtering is implemented inline in `kpi-sync.ts` with custom logic:
  ```
  const startOk = !f.start_date || f.start_date <= monthEnd;
  const endOk = !f.end_date || f.end_date >= monthStart;
  ```
  If this logic is duplicated or inconsistent elsewhere, KPI calculations may diverge.
- Impact: Incorrect survival scores, misleading dashboard data.

**Implementation Approach:**

```typescript
// src/lib/utils.ts - Single source of truth
export function filterActiveFixedCosts<T extends { start_date: string | null; end_date: string | null }>(
  costs: T[],
  monthStart: string,
  monthEnd: string
): T[] {
  return costs.filter((f) => {
    const startOk = !f.start_date || f.start_date <= monthEnd;
    const endOk = !f.end_date || f.end_date >= monthStart;
    return startOk && endOk;
  });
}
```

---

## Technical Design

### Files to Modify

| File | Change | Lines |
|------|--------|-------|
| `src/lib/actions/csv-import.ts` | Batch duplicate query + error handling | ~40 |
| `src/app/auth/login/page.tsx` | Extract to Server Component + Client form | ~30 |
| `src/app/auth/login/login-form.tsx` | New client component (form only) | ~80 |
| `src/app/auth/onboarding/onboarding-form.tsx` | Remove console.error details | ~2 |
| `src/lib/utils.ts` | Add `filterActiveFixedCosts()` | ~12 |
| `src/lib/actions/kpi-sync.ts` | Use shared `filterActiveFixedCosts()` | ~5 |

### Performance Expectations

| Operation | Before | After |
|-----------|--------|-------|
| 100-row CSV duplicate check | ~100 queries (~3s) | 2 queries (~50ms) |
| 500-row CSV duplicate check | ~500 queries (~15s) | 2 queries (~80ms) |
| Login page initial render | Blank -> Content (200ms) | Immediate content (0ms) |

---

## Acceptance Criteria

- [ ] `checkDuplicates()` executes maximum 2 DB queries regardless of row count
- [ ] 500-row CSV duplicate check completes in under 1 second
- [ ] Supabase query errors in import flow throw with descriptive messages
- [ ] No `error.status`, `error.code`, or `error.details` in production console logs
- [ ] Login page renders form immediately (no blank flash)
- [ ] Login page uses Server Component for session check
- [ ] `filterActiveFixedCosts()` is used in all fixed cost date filtering locations
- [ ] All existing tests pass
- [ ] New tests for batch duplicate check and date filter utility

<!-- TAG: SPEC-PERF-001 -->

---
id: SPEC-SEC-001
version: "1.0.0"
status: ready
created: "2026-03-03"
priority: P0
depends_on: []
---

# SPEC-SEC-001: Critical Security Fixes

## Overview

Code review identified 4 critical security vulnerabilities that must be resolved before production deployment. These issues expose the application to unauthorized API usage, client-side data manipulation, invalid data persistence, and potential cost abuse.

## Scope

- AI API endpoint authentication and input validation
- Onboarding form migration from client-side to server-side DB access
- CSV parser input validation and sanitization
- Date format validation in CSV parser

## Out of Scope

- CORS configuration (covered by SPEC-RLS-001)
- Rate limiting (separate infrastructure concern)
- RBAC (not applicable for current single-user-per-business model)

---

## Requirements (EARS)

### REQ-01: AI API Authentication

**Ubiquitous:**
- The `/api/ai` endpoint SHALL verify the user's authentication status before processing any request.
- The endpoint SHALL return HTTP 401 if the user is not authenticated.

**When:**
- When an authenticated user sends a POST request to `/api/ai`, the system SHALL validate the request body against a Zod schema before invoking the AI model.

**Where:**
- File: `src/app/api/ai/route.ts`

**Rationale:**
- Current state: The endpoint has zero authentication. Any client can call it, consuming ANTHROPIC_API_KEY credits.
- Risk: Cost explosion from unauthorized usage, data leakage via crafted KPI payloads.

**Implementation Approach:**

```typescript
// 1. Add auth check
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}

// 2. Add Zod validation for request body
const AiRequestSchema = z.object({
  kpiData: z.object({
    grossProfit: z.number(),
    netProfit: z.number(),
    grossMargin: z.number(),
    laborRatio: z.number(),
    fixedCostRatio: z.number(),
    survivalScore: z.number(),
  }),
  businessType: z.string().optional(),
});
```

### REQ-02: Onboarding Server Action Migration

**Ubiquitous:**
- Business registration SHALL be performed through a Server Action, NOT via client-side Supabase calls.
- The client component SHALL NOT directly access the database.

**Where:**
- Current: `src/app/auth/onboarding/onboarding-form.tsx` (client-side `supabase.from("businesses").insert()`)
- Target: New Server Action in `src/lib/actions/business.ts`

**Rationale:**
- Current state: `onboarding-form.tsx` creates a client-side Supabase instance and directly inserts into the `businesses` table.
- Risk: Client-side DB access bypasses server-side validation, exposes insert logic, inconsistent with all other data mutations (which use Server Actions).

**Implementation Approach:**

```typescript
// src/lib/actions/business.ts
"use server";
export async function registerBusiness(data: OnboardingFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("businesses").insert({
    user_id: user.id,
    name: data.name,
    business_type: data.business_type || null,
    address: data.address || null,
  });

  if (error) throw new Error(error.message);
}
```

### REQ-03: CSV Parser Input Validation

**Ubiquitous:**
- The CSV parser SHALL validate parsed amounts are within a reasonable range (0 < amount <= 10,000,000,000).
- The CSV parser SHALL reject rows with empty or whitespace-only required fields.
- The CSV parser SHALL sanitize string inputs to prevent XSS in memo/category fields.

**Where:**
- File: `src/lib/csv/parser.ts`, function `normalizeRow()`

**Rationale:**
- Current state: `normalizeRow()` only checks `isNaN(amount) || amount === 0`. No upper bound, no string sanitization.
- Risk: Malformed CSV can insert absurdly large amounts or XSS payloads into the database.

**Implementation Approach:**

```typescript
const MAX_AMOUNT = 10_000_000_000; // 100 billion won

function normalizeRow(row: Record<string, string>): ParsedRow | null {
  // ... existing field detection ...

  const amount = Math.abs(parseInt(rawAmount, 10));
  if (isNaN(amount) || amount === 0 || amount > MAX_AMOUNT) return null;

  // Sanitize string fields
  const sanitize = (s: string) => s.replace(/[<>"'&]/g, "").trim().slice(0, 200);

  return {
    date: normalizeDate(row[dateKey]),
    channel: sanitize(channel),
    category: sanitize(category),
    amount,
    type: isExpense ? "expense" : "revenue",
    memo: sanitize(row["memo"] || row["memo"] || row["note"] || ""),
  };
}
```

### REQ-04: Date Format Validation

**Ubiquitous:**
- The `normalizeDate()` function SHALL validate month (1-12) and day (1-31) ranges.
- Invalid dates SHALL be rejected (return null from `normalizeRow()`).

**Where:**
- File: `src/lib/csv/parser.ts`, function `normalizeDate()`

**Rationale:**
- Current state: `normalizeDate()` only splits by delimiter and pads digits. It accepts month=13, day=99.
- Risk: Invalid dates stored in DB, KPI calculation errors, data integrity loss.

**Implementation Approach:**

```typescript
function normalizeDate(raw: string): string | null {
  const cleaned = raw.replace(/[./year/month/day]/g, "-").replace(/-+$/, "");
  const parts = cleaned.split("-").filter(Boolean);

  if (parts.length === 3) {
    const year = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Final validation with Date object
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return null;

    return dateStr;
  }

  return null; // Reject unparseable dates instead of returning raw
}
```

---

## Technical Design

### Files to Modify

| File | Change | Lines |
|------|--------|-------|
| `src/app/api/ai/route.ts` | Add auth check + Zod validation | ~20 |
| `src/lib/actions/business.ts` | New Server Action for business registration | ~30 |
| `src/app/auth/onboarding/onboarding-form.tsx` | Replace client DB call with Server Action | ~10 |
| `src/lib/csv/parser.ts` | Add amount range, string sanitization, date validation | ~25 |
| `src/lib/csv/parser.test.ts` | Add test cases for validation | ~30 |

### Dependencies

- `@/lib/supabase/server` (existing)
- `zod` (existing)

---

## Acceptance Criteria

- [ ] `/api/ai` returns 401 for unauthenticated requests
- [ ] `/api/ai` validates request body with Zod schema, returns 400 for invalid input
- [ ] Onboarding uses Server Action, no client-side `supabase.from()` calls
- [ ] Server Action validates `user.id` matches the insert (no userId prop injection)
- [ ] CSV parser rejects amounts > 10 billion won
- [ ] CSV parser rejects dates with month > 12 or day > 31
- [ ] CSV parser sanitizes string fields (no HTML/script tags)
- [ ] `normalizeDate("2026-13-01")` returns null
- [ ] `normalizeDate("2026-01-32")` returns null
- [ ] All existing tests still pass
- [ ] New tests cover all 4 validation scenarios

<!-- TAG: SPEC-SEC-001 -->

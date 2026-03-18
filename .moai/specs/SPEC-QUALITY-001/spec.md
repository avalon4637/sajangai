---
id: SPEC-QUALITY-001
version: "1.0.0"
status: ready
created: "2026-03-03"
priority: P2
depends_on: ["SPEC-SEC-001", "SPEC-PERF-001"]
---

# SPEC-QUALITY-001: Code Quality and Type Safety Improvements

## Overview

Code review identified 8 medium-priority issues affecting code maintainability, type safety, performance, and security hardening. These improvements reduce technical debt and establish better patterns for future development.

## Scope

- Error type discrimination in auth flows
- Performance optimization with useMemo/useCallback
- CSRF Origin header verification for API routes
- Suspense boundary fallback improvements
- TypeScript strict type narrowing
- Utility function documentation
- Duplicated business logic extraction
- yearMonth format validation

## Out of Scope

- Critical security fixes (SPEC-SEC-001)
- Performance regression fixes (SPEC-PERF-001)
- Edge case handling (SPEC-POLISH-001)

---

## Requirements (EARS)

### REQ-01: Error Type Discrimination

**Ubiquitous:**
- Auth error handlers SHALL distinguish between network errors, validation errors, and authentication errors.
- Each error type SHALL display an appropriate user-facing message.

**Where:**
- Files: `src/app/auth/login/page.tsx`, `src/app/auth/signup/page.tsx`

**Rationale:**
- Current state: Login catches all errors with string matching (`error.message === "Invalid login credentials"`). Network failures show raw Supabase messages.
- Impact: Poor user experience when network is down or server returns unexpected errors.

**Implementation Approach:**

```typescript
// src/lib/errors.ts
export type AuthErrorType = "invalid_credentials" | "email_not_confirmed" | "network" | "unknown";

export function classifyAuthError(error: { message: string; status?: number }): AuthErrorType {
  if (error.message === "Invalid login credentials") return "invalid_credentials";
  if (error.message === "Email not confirmed") return "email_not_confirmed";
  if (error.message.includes("fetch") || error.status === 0) return "network";
  return "unknown";
}

export const AUTH_ERROR_MESSAGES: Record<AuthErrorType, string> = {
  invalid_credentials: "Email or password is incorrect",
  email_not_confirmed: "Email verification required. Please check your inbox.",
  network: "Network error. Please check your connection.",
  unknown: "An unexpected error occurred. Please try again.",
};
```

### REQ-02: Expensive Computation Memoization

**Ubiquitous:**
- Chart data transformations in dashboard components SHALL be memoized with `useMemo`.
- Event handlers passed as props SHALL be stabilized with `useCallback`.

**Where:**
- Files: `src/components/dashboard/revenue-trend-chart.tsx`, `src/components/dashboard/expense-breakdown-chart.tsx`, `src/components/simulation/simulation-form.tsx`

**Rationale:**
- Current state: Chart data transformations (array mapping, filtering, sorting) run on every render.
- Impact: Unnecessary re-computation when parent re-renders without data changes.

**Implementation Approach:**

```typescript
// Before
const chartData = props.data.map(item => ({ ... }));

// After
const chartData = useMemo(
  () => props.data.map(item => ({ ... })),
  [props.data]
);
```

### REQ-03: CSRF Origin Verification

**Ubiquitous:**
- All API routes that accept POST requests SHALL verify the `Origin` header matches the application domain.
- Mismatched origins SHALL return HTTP 403.

**Where:**
- File: `src/app/api/ai/route.ts` (and future API routes)

**Rationale:**
- Current state: No Origin header check. Cross-site requests could invoke the AI API.
- Impact: CSRF attacks could consume API credits.

**Implementation Approach:**

```typescript
// src/lib/api/csrf.ts
export function verifyCsrfOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:2000",
  ].filter(Boolean);

  return allowedOrigins.some((allowed) => origin === allowed);
}
```

### REQ-04: Suspense Boundary Improvements

**Ubiquitous:**
- All Suspense boundaries in dashboard pages SHALL provide skeleton UI fallbacks, not blank content.
- Loading states SHALL match the final layout structure.

**Where:**
- Files: `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/revenue/page.tsx`, and similar pages

**Rationale:**
- Current state: Some pages lack Suspense boundaries or use minimal fallbacks.
- Impact: Content layout shift when data loads, poor perceived performance.

### REQ-05: TypeScript Type Narrowing

**Ubiquitous:**
- Database query results SHALL use proper type narrowing instead of `as` type assertions.
- Supabase `.select()` results SHALL use the generated database types.

**Where:**
- Files: `src/lib/queries/*.ts`, `src/lib/actions/*.ts`

**Rationale:**
- Current state: Some queries use `as` casting which bypasses TypeScript's type checking.
- Impact: Runtime type errors not caught at compile time.

**Implementation Approach:**

```typescript
// Before
const { data } = await supabase.from("revenues").select("*");
const revenues = data as Revenue[];

// After
const { data, error } = await supabase.from("revenues").select("*");
if (error) throw new Error(error.message);
// data is already typed by Supabase generated types
```

### REQ-06: Utility Function Documentation

**Ubiquitous:**
- All exported utility functions in `src/lib/utils.ts` SHALL have JSDoc comments describing purpose, parameters, and return values.

**Where:**
- File: `src/lib/utils.ts`

### REQ-07: Duplicate Logic Extraction

**Ubiquitous:**
- The yearMonth extraction logic (`dateStr.slice(0, 7)`) SHALL be defined once in utils and imported.
- Error message formatting for failed row imports SHALL use a shared function.

**Where:**
- Files: `src/lib/actions/csv-import.ts`, `src/lib/actions/kpi-sync.ts`

### REQ-08: yearMonth Format Validation

**Ubiquitous:**
- Functions accepting `yearMonth` parameter SHALL validate the format matches `YYYY-MM` pattern.
- Invalid formats SHALL throw a descriptive error.

**Where:**
- Files: `src/lib/actions/kpi-sync.ts`, `src/lib/queries/monthly-summary.ts`

**Implementation Approach:**

```typescript
// src/lib/utils.ts
export function validateYearMonth(yearMonth: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
    throw new Error(`Invalid yearMonth format: "${yearMonth}". Expected YYYY-MM.`);
  }
}
```

---

## Technical Design

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/errors.ts` | Auth error classification and messages |
| `src/lib/api/csrf.ts` | CSRF Origin verification utility |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/auth/login/page.tsx` | Use error classifier |
| `src/app/auth/signup/page.tsx` | Use error classifier |
| `src/components/dashboard/revenue-trend-chart.tsx` | Add useMemo |
| `src/components/dashboard/expense-breakdown-chart.tsx` | Add useMemo |
| `src/components/simulation/simulation-form.tsx` | Add useCallback |
| `src/app/api/ai/route.ts` | Add CSRF check |
| `src/app/(dashboard)/dashboard/page.tsx` | Improve Suspense fallback |
| `src/lib/utils.ts` | Add validateYearMonth, JSDoc, shared helpers |
| `src/lib/actions/kpi-sync.ts` | Use validateYearMonth |
| `src/lib/actions/csv-import.ts` | Use shared yearMonth extraction |

---

## Acceptance Criteria

- [ ] Auth errors classified into 4 categories with appropriate Korean messages
- [ ] Network errors display "network issue" message, not raw error
- [ ] Chart components use useMemo for data transformations
- [ ] `/api/ai` rejects requests with mismatched Origin header (403)
- [ ] Dashboard pages have skeleton UI Suspense fallbacks
- [ ] No `as` type assertions on Supabase query results
- [ ] All exported utils have JSDoc documentation
- [ ] yearMonth format validated with regex before use
- [ ] `getYearMonth()` defined once in utils, imported everywhere
- [ ] All existing tests pass

<!-- TAG: SPEC-QUALITY-001 -->

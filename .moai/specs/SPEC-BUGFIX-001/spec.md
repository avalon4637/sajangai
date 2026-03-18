# SPEC-BUGFIX-001: Integration Bug Fix

## Overview
Full integration audit and bug fix for sajang.ai Phase 1 features.
All features were implemented but non-functional due to critical bugs across the codebase.

## Date
2026-02-24

## Bugs Fixed

### Critical (Application-Breaking)

| ID | Description | Files Modified | Root Cause |
|----|-------------|----------------|------------|
| BUG-DATE-001 | Date range `yearMonth-31` causes PostgreSQL error for months with < 31 days | `utils.ts`, `monthly-summary.ts`, `kpi-sync.ts`, `revenue.ts`, `expense.ts` | Hardcoded `-31` instead of calculating actual last day of month |
| BUG-AUTH-1 | `redirect("/onboarding")` should be `/auth/onboarding` - caused 404 loop for new users | 6 dashboard page files | Wrong redirect path after business ID check |
| BUG-REV-1 | MonthPicker `basePath="/dashboard/revenue"` navigates to non-existent route | `revenue/page-client.tsx` | Route group `(dashboard)` doesn't add URL segment |
| BUG-EXP-1 | MonthPicker `basePath="/dashboard/expense"` navigates to non-existent route | `expense/page-client.tsx` | Same as BUG-REV-1 |

### Severe (Feature Non-Functional)

| ID | Description | Files Modified | Root Cause |
|----|-------------|----------------|------------|
| BUG-CSV-1 | `checkDuplicates()` never called - duplicate detection UI was dead code | `csv-upload-zone.tsx` | Missing import and function call |
| BUG-CSV-2 | Supabase query chaining bug - `query.eq()` return value not reassigned | `csv-import.ts` | Supabase uses immutable builder pattern |
| BUG-AI-1 | Model ID `claude-sonnet-4-5-20250929` invalid | `api/ai/route.ts` | Incorrect model snapshot date |

### Medium (Data Accuracy)

| ID | Description | Files Modified | Root Cause |
|----|-------------|----------------|------------|
| BUG-FC-1 | Fixed costs in KPI calculation ignore `start_date`/`end_date` | `kpi-sync.ts`, `monthly-summary.ts` | No date range filter on `fixed_costs` query |
| BUG-ACT-1 | Settings page missing try-catch for `getCurrentBusinessId()` | `settings/page.tsx` | Missing error handling pattern |
| WARN-AI-2 | No `ANTHROPIC_API_KEY` validation in AI route | `api/ai/route.ts` | Missing env var check |

## Changes Summary

### New Utility
- `getLastDayOfMonth(yearMonth: string): string` added to `src/lib/utils.ts`
  - Correctly calculates last day for any month (handles Feb 28/29, 30-day months)
  - Used by 4 files via import

### Files Modified (16 total)

**Core utilities:**
- `src/lib/utils.ts` - Added `getLastDayOfMonth` helper

**Date range fixes (5 files):**
- `src/lib/queries/monthly-summary.ts` - Import shared util, replace 3x `-31`
- `src/lib/queries/revenue.ts` - Import shared util, replace 1x `-31`
- `src/lib/queries/expense.ts` - Import shared util, replace 1x `-31`
- `src/lib/actions/kpi-sync.ts` - Import shared util, replace 3x `-31`, add fixed cost date filter

**Redirect fixes (6 files):**
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/revenue/page.tsx`
- `src/app/(dashboard)/expense/page.tsx`
- `src/app/(dashboard)/fixed-costs/page.tsx`
- `src/app/(dashboard)/import/page.tsx`
- `src/app/(dashboard)/simulation/page.tsx`

**MonthPicker basePath fixes (2 files):**
- `src/app/(dashboard)/revenue/page-client.tsx`
- `src/app/(dashboard)/expense/page-client.tsx`

**AI route fix (1 file):**
- `src/app/api/ai/route.ts` - Model ID, API key validation

**CSV import fix (2 files):**
- `src/lib/actions/csv-import.ts` - Query chaining, return type
- `src/components/import/csv-upload-zone.tsx` - Call checkDuplicates

**Settings page fix (1 file):**
- `src/app/(dashboard)/settings/page.tsx` - Add try-catch

## Build Verification
- `next build` passed successfully
- TypeScript compilation: no errors
- All routes generated correctly

## Known Remaining Issues
- WARN-REV-1: UTC date offset may show dates shifted by -1 day in KST timezone (cosmetic)
- WARN-SIM-1: Simulation only uses current month data (feature limitation, not bug)

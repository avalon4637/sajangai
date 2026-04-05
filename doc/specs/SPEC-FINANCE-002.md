# SPEC-FINANCE-002: Unified Finance Module — Transaction List + Expense Upload + Invoices + Vendors

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-FINANCE-002 |
| Title | Unified Finance Module — Transaction List + Expense Upload + Invoices + Vendors |
| Phase | Post-Phase 4 (Enhancement) |
| Priority | Medium-High (P1) |
| Status | Planned |
| Dependencies | SPEC-FINANCE-001 (completed), existing DB tables (revenues, expenses, expense_categories, vendors, invoices) |

## Problem Statement

Revenue data is largely automated via Hyphen API (delivery apps, card sales), but expense/purchase data entry remains manual and fragmented across separate pages (`/revenue`, `/expense`). Invoice and vendor tables exist in the database with full query functions, but no dedicated management pages exist. The key insight: **revenue is auto-collected, expenses are the pain point** — so expense entry should focus on Excel/CSV upload (bulk) rather than manual per-transaction forms.

## Strategy

Build four new UI features on top of existing DB tables and query functions. No schema migrations required.

**Data input strategy:**
- Revenue (매출): Automated via Hyphen API sync (delivery apps, card sales) — already implemented
- Expense (매입): Excel/CSV bulk upload with AI auto-classification — enhance existing /analysis/upload
- Fixed costs (고정비): Recurring transaction presets — future automation
- Manual entry: Keep existing /revenue and /expense pages as fallback, NOT a primary workflow

## Assumptions

- The existing `revenues` and `expenses` tables remain separate (no unified `transactions` table migration in this SPEC).
- The `expense_categories` table with 9 major / 34 subcategories is already populated for active businesses.
- Existing query functions in `src/lib/queries/invoice.ts` and `src/lib/queries/vendor.ts` are stable and tested.
- The sidebar component (`src/app/(dashboard)/sidebar.tsx`) supports adding new nav sections.
- Server Components + Client Components pattern (RSC data fetch, pass to client) is the standard architecture.

## Exclusions (What NOT to Build)

- Shall NOT implement a unified `transactions` table migration (separate future SPEC, per SPEC-FINANCE-001 strategy).
- Shall NOT build recurring transaction auto-scheduling (cron-based auto-entry).
- Shall NOT implement receipt OCR or image upload for transaction entry.
- Shall NOT build PDF export for invoices (future enhancement).
- Shall NOT implement vendor credit/debit balance tracking or accounts payable aging reports.
- Shall NOT modify existing `/revenue` or `/expense` pages (they remain as-is for fallback one-off entries).
- Shall NOT build a manual per-transaction entry form as primary workflow — revenue is auto-collected via Hyphen API, expenses use bulk upload.

---

## Requirements (EARS Format)

### Feature 4: Expense Upload Enhancement (매입 엑셀 업로드 강화)

Data input strategy: Revenue is auto-collected via Hyphen API. Expense/purchase data is the user pain point. Rather than building a manual per-transaction form, enhance the existing CSV/Excel upload flow to be the primary expense entry method.

**FR-4.1 (Event-Driven):** WHEN a user navigates to `/transactions/upload`, THEN the system shall display an upload page with drag-and-drop zone accepting .xlsx, .xlsm, .csv files, with source type detection (card statement, bank statement, vendor invoice).

**FR-4.2 (Event-Driven):** WHEN a user uploads a file, THEN the system shall auto-detect the file format (card company CSV, bank CSV, Deerna Excel .xlsm) and apply the appropriate parsing rules.

**FR-4.3 (Event-Driven):** WHEN parsing completes, THEN the system shall display a classification preview table showing each row with: date, content/vendor, amount, AI-suggested category (major + minor), confidence score (percentage badge).

**FR-4.4 (State-Driven):** WHILE the classification preview is displayed, rows with confidence >= 80% shall show green badge, 60-79% grey badge, and below 60% yellow background with alternative category buttons.

**FR-4.5 (Event-Driven):** WHEN a user changes a suggested category, THEN the system shall record the correction in `merchant_mappings` table for future classification learning.

**FR-4.6 (Event-Driven):** WHEN the user confirms and clicks "일괄 등록", THEN the system shall bulk-insert rows into the `expenses` table, auto-create any new vendors in the `vendors` table, show a completion summary (N건 등록, N개 거래처 추가), and revalidate KPI cache.

**FR-4.7 (Ubiquitous):** The upload page shall support the Deerna Excel template (.xlsm) with a specialized parser that extracts data from the monthly sheets (1월~12월) column structure (날짜, 거래처, 내용, 매입금액, 대분류, 소분류).

**FR-4.8 (Unwanted):** The system shall NOT require manual per-transaction entry as the primary workflow — existing /expense page remains as a fallback for one-off entries.

### Feature 5: Unified Transaction List View

**FR-5.1 (Event-Driven):** WHEN a user navigates to `/transactions`, THEN the system shall display a unified list of transactions from both `revenues` and `expenses` tables, sorted by date descending.

**FR-5.2 (Event-Driven):** WHEN a user selects a filter chip (all, revenue, expense, fixed cost, labor, food supplies, consumables, marketing, fees), THEN the system shall filter the transaction list accordingly.

**FR-5.3 (Event-Driven):** WHEN a user types in the search field, THEN the system shall filter transactions by vendor name or content text, debounced at 300ms.

**FR-5.4 (State-Driven):** WHILE the transaction list is displayed, the system shall group transactions by date with date separator headers showing the date and day-of-week.

**FR-5.5 (Event-Driven):** WHEN a user navigates to the previous or next month, THEN the system shall load and display transactions for that month using the same month navigation pattern as the `/analysis` page.

**FR-5.6 (Ubiquitous):** Each transaction row shall display: a directional icon (green upward arrow for revenue, orange downward arrow for expense), content text (bold), date + vendor + category (secondary text), and amount (green with plus sign for revenue, red with minus sign for expense).

**FR-5.7 (Ubiquitous):** The transaction list shall display a monthly total summary at the bottom showing total revenue, total expense, and net amount.

**FR-5.8 (Event-Driven):** WHEN the user scrolls to the bottom of the transaction list, THEN the system shall load additional transactions using cursor-based pagination (infinite scroll).

### Feature 6: Invoice Management UI

**FR-6.1 (Event-Driven):** WHEN a user navigates to `/invoices`, THEN the system shall display invoice list with a tab toggle between sales invoices (receivable) and purchase invoices (payable).

**FR-6.2 (Ubiquitous):** The invoice page shall display summary stats at the top: count of unissued invoices and total unissued amount.

**FR-6.3 (Ubiquitous):** Each invoice card shall display: issue date, vendor name, supply amount / tax amount / total amount, and a status badge (unissued with warning indicator / issued with check indicator).

**FR-6.4 (Event-Driven):** WHEN a user clicks the "add invoice" button, THEN the system shall open a drawer or dialog with an invoice creation form.

**FR-6.5 (Event-Driven):** WHEN a user clicks "mark as issued" on a pending invoice, THEN the system shall call `markAsPaid()` and update the invoice status in the list.

**FR-6.6 (Ubiquitous):** The invoice page shall use existing query functions: `getInvoices()`, `markAsPaid()`, `getOverdueInvoices()`, `getOutstandingBalance()` from `src/lib/queries/invoice.ts`.

### Feature 7: Vendor Management UI

**FR-7.1 (Event-Driven):** WHEN a user navigates to `/vendors`, THEN the system shall display a searchable list of vendors from the `vendors` table.

**FR-7.2 (Event-Driven):** WHEN a user types in the vendor search bar, THEN the system shall filter the vendor list by name match, debounced at 300ms.

**FR-7.3 (Ubiquitous):** Each vendor card shall display: vendor name, category, contact information (contact name, phone, email), and this month's transaction total amount.

**FR-7.4 (Event-Driven):** WHEN a user clicks the "add vendor" button, THEN the system shall open a drawer or dialog with a vendor creation form.

**FR-7.5 (Event-Driven):** WHEN a user clicks a vendor card, THEN the system shall display that vendor's transaction history (filtered view of unified transaction list).

**FR-7.6 (Ubiquitous):** The vendor page shall use existing query functions: `getVendors()`, `createVendor()` from `src/lib/queries/vendor.ts`.

### Navigation

**FR-NAV.1 (Ubiquitous):** The sidebar shall include a "Data Management" (데이터 관리) section with four nav items: Expense Upload (/transactions/upload), Transaction History (/transactions), Invoices (/invoices), Vendors (/vendors).

---

## Milestones

### M1: Expense Upload Enhancement (Primary Goal)
- Create `/transactions/upload` page — enhanced Excel/CSV expense upload
- Auto-detect file format (card CSV, bank CSV, Deerna .xlsm)
- AI classification preview with confidence scoring
- Bulk insert into expenses + vendor auto-creation
- Implement category chip selection (major -> sub) from `expense_categories`
- Implement vendor autocomplete with debounced search
- Implement Korean number formatting for amount input
- Implement "quick input" preset buttons
- Implement form submission with toast + revalidation + form reset
- Add sidebar navigation item

### M2: Unified Transaction List (Primary Goal)
- Create `src/lib/queries/transaction-unified.ts` (union query for revenues + expenses)
- Create `/transactions` page (Server Component + Client Component)
- Implement filter chips and text search with debounce
- Implement date-grouped transaction list with date separators
- Implement month navigation
- Implement transaction row component with directional icons and color-coded amounts
- Implement monthly total summary
- Implement infinite scroll with cursor pagination

### M3: Invoice Management UI (Secondary Goal)
- Create `/invoices` page (Server Component + Client Component)
- Implement receivable/payable tab toggle
- Implement unissued invoice stats summary
- Implement invoice card list with status badges
- Implement add invoice drawer/dialog
- Implement "mark as issued" action
- Wire up existing `invoice.ts` query functions

### M4: Vendor Management UI (Secondary Goal)
- Create `/vendors` page (Server Component + Client Component)
- Implement vendor search with debounce
- Implement vendor card list with monthly transaction totals
- Implement add vendor drawer/dialog
- Implement vendor transaction history view
- Wire up existing `vendor.ts` query functions

---

## Technical Approach

### Architecture
- Follow existing RSC pattern: Server Components fetch data via query functions, pass to Client Components for interactivity.
- Reuse existing query modules (`invoice.ts`, `vendor.ts`, `expense-category.ts`, `revenue.ts`, `expense.ts`).
- New `transaction-unified.ts` module for the union query combining revenues and expenses.

### Validation
- Zod schemas for transaction entry form (amount > 0, category required, date required).
- Client-side validation with react-hook-form + @hookform/resolvers/zod.

### State Management
- URL search params for filter state (chips, search query, month) to enable shareable URLs.
- React state for form inputs and autocomplete suggestions.

### Performance
- Cursor-based pagination for infinite scroll (not offset-based).
- Debounced search inputs (300ms) to minimize server queries.
- `revalidatePath` for KPI cache invalidation after writes.

### File Plan

| Action | Path | Description |
|--------|------|-------------|
| NEW | `src/app/(dashboard)/transactions/upload/page.tsx` | Server Component — upload page |
| NEW | `src/app/(dashboard)/transactions/upload/page-client.tsx` | Client Component — upload + classification UI |
| NEW | `src/app/(dashboard)/transactions/page.tsx` | Server Component — unified list data fetch |
| NEW | `src/app/(dashboard)/transactions/page-client.tsx` | Client Component — list UI with filters |
| NEW | `src/app/(dashboard)/invoices/page.tsx` | Server Component — invoice data fetch |
| NEW | `src/app/(dashboard)/invoices/page-client.tsx` | Client Component — invoice management UI |
| NEW | `src/app/(dashboard)/vendors/page.tsx` | Server Component — vendor data fetch |
| NEW | `src/app/(dashboard)/vendors/page-client.tsx` | Client Component — vendor management UI |
| NEW | `src/lib/queries/transaction-unified.ts` | Union query for revenues + expenses |
| MODIFY | `src/app/(dashboard)/sidebar.tsx` | Add "데이터 관리" nav section |

### Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Union query performance on large datasets | Slow list loading | Cursor pagination, date-range limits, index on (business_id, date) |
| Category chip UX complexity on mobile | Poor mobile experience | Horizontal scroll chips, collapsible subcategories |
| Quick input presets cold-start (no transaction history) | Empty preset section | Show 3-5 default presets based on business category |

---

## Acceptance Criteria

### Feature 4: Unified Transaction Entry Form

```gherkin
Scenario: Upload card statement CSV for expense classification
  Given I am on /transactions/upload
  When I drag a card company CSV file into the upload zone
  Then the system detects the file format as "card statement"
  And displays a classification preview with AI-suggested categories
  And each row shows a confidence score badge

Scenario: Review and confirm AI classification
  Given I see the classification preview with 10 rows
  And 8 rows have confidence >= 80% (green)
  And 2 rows have confidence < 60% (yellow)
  When I change one yellow row's category from "소모품" to "운영비"
  And I click "10건 일괄 등록"
  Then 10 rows are inserted into the expenses table
  And 1 correction is saved in merchant_mappings for learning
  And I see a completion toast "10건 등록 완료"

Scenario: Upload Deerna Excel template
  Given I am on /transactions/upload
  When I upload a .xlsm file
  Then the system detects "Deerna 사업자 가계부" format
  And extracts transactions from monthly sheets
  And shows classification preview with pre-mapped categories
```

### Feature 5: Unified Transaction List

```gherkin
Scenario: View unified transaction list
  Given I am on /transactions
  Then I see transactions from both revenues and expenses tables
  And transactions are grouped by date with date separators
  And revenue rows show green amounts with plus sign
  And expense rows show red amounts with minus sign

Scenario: Filter by category
  Given I am on /transactions
  When I tap the "식자재" filter chip
  Then only transactions with "식자재" category are shown

Scenario: Search by vendor
  Given I am on /transactions
  When I type "농협" in the search field
  Then only transactions with vendor matching "농협" are shown
  And results appear after 300ms debounce

Scenario: Navigate months
  Given I am viewing April 2026 transactions
  When I tap the left arrow for previous month
  Then March 2026 transactions are loaded and displayed

Scenario: Infinite scroll pagination
  Given I am viewing a month with 50+ transactions
  When I scroll to the bottom of the list
  Then the next page of transactions is loaded automatically
```

### Feature 6: Invoice Management

```gherkin
Scenario: View invoices by type
  Given I am on /invoices
  When I select the "매입 세금계산서" tab
  Then only payable invoices are displayed
  And I see the count of unissued invoices
  And I see the total unissued amount

Scenario: Add a new invoice
  Given I am on /invoices
  When I click the "add invoice" button
  Then an invoice creation drawer opens
  When I fill in vendor, amount, tax amount, and issue date
  And I click save
  Then the new invoice appears in the list

Scenario: Mark invoice as issued
  Given I see a pending invoice in the list
  When I click "mark as issued"
  Then the invoice status changes to "issued" with a check badge
```

### Feature 7: Vendor Management

```gherkin
Scenario: View vendor list
  Given I am on /vendors
  Then I see all vendors for my business
  And each vendor card shows name, category, and this month's transaction total

Scenario: Search vendors
  Given I am on /vendors
  When I type "농협" in the search bar
  Then only vendors matching "농협" are shown

Scenario: Add a new vendor
  Given I am on /vendors
  When I click "add vendor"
  And I fill in name "새로운 거래처" and category "식자재"
  And I click save
  Then the new vendor appears in the list

Scenario: View vendor transaction history
  Given I am on /vendors
  When I click the "농협하나로마트" vendor card
  Then I see all transactions with that vendor sorted by date
```

### Quality Gates

- All new pages render without build errors (`next build` passes).
- All new query functions have corresponding unit tests.
- Zod schemas validate correctly for all edge cases (negative amounts, missing fields).
- Mobile responsive: all pages usable at 375px width.
- Accessibility: all form inputs have labels, buttons have descriptive text.
- No TypeScript errors in strict mode.

---

## Traceability

| Requirement | Milestone | File(s) |
|-------------|-----------|---------|
| FR-4.1 ~ FR-4.8 | M1 | transactions/upload/page.tsx, page-client.tsx |
| FR-5.1 ~ FR-5.8 | M2 | transactions/page.tsx, page-client.tsx, transaction-unified.ts |
| FR-6.1 ~ FR-6.6 | M3 | invoices/page.tsx, page-client.tsx, invoice.ts (existing) |
| FR-7.1 ~ FR-7.6 | M4 | vendors/page.tsx, page-client.tsx, vendor.ts (existing) |
| FR-NAV.1 | M1 | sidebar.tsx |

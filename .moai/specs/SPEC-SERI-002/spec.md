# SPEC-SERI-002: Enhanced Bookkeeping & Cost Intelligence

## Metadata

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| SPEC ID     | SPEC-SERI-002                                      |
| Title       | Enhanced Bookkeeping & Cost Intelligence           |
| Created     | 2026-03-18                                         |
| Status      | Planned                                            |
| Priority    | High                                               |
| Lifecycle   | spec-anchored                                      |
| Related     | SPEC-SERI-001, SPEC-HYPHEN-001, SPEC-IMPORT-001   |

---

## Environment

- **Platform**: Next.js 16 (App Router), React 19, Supabase, TypeScript 5.9+
- **AI Engine**: Claude Sonnet API via `ANTHROPIC_API_KEY`
- **Existing Data Sources**: `revenues`, `expenses`, `fixed_costs`, `monthly_summaries`, `daily_reports` tables
- **Existing AI Engine**: `src/lib/ai/seri-engine.ts` (profit calculator, cashflow predictor, cost analyzer)
- **Existing CSV Parser**: `src/lib/csv/parser.ts` (generic CSV import)
- **Existing Hyphen Integration**: `src/lib/hyphen/` (delivery app + card sales sync)
- **UI Framework**: shadcn/ui (new-york), Tailwind CSS 4.x, Recharts
- **Target Users**: Korean small business owners (food & beverage, retail)
- **Benchmark**: "Dearna Business Ledger v3.0.4" Excel (50,000 KRW, 24 sheets) - features to replace with AI automation
- **Language**: Korean UI, English code comments

---

## Assumptions

- A1: Bank transaction CSV formats are publicly documented for the 7 major Korean banks (Shinhan, Kookmin, Woori, Hana, Nonghyup, KakaoBank, TossBank).
- A2: Card statement CSV formats are publicly documented for major Korean card companies.
- A3: The existing `expenses` table can be extended with a `major_category` and `sub_category` column, or a separate classification mapping table can reference existing expense records.
- A4: Claude API can classify Korean merchant names into expense categories with >80% accuracy when given the 9-category taxonomy and merchant context.
- A5: Users primarily upload CSV files exported from their internet banking or card company portal (not manually created spreadsheets).
- A6: Hyphen-synced card/delivery transactions share identifiable fields (date, amount, merchant) that can be matched against uploaded bank/card statements to detect duplicates.
- A7: Labor cost management is manual-entry only (no payroll system integration in this phase).
- A8: Invoice tracking (receivables/payables) is manual-entry with status tracking (no electronic invoice integration in this phase).
- A9: The existing migration numbering convention continues from `00008_*.sql`.

---

## Requirements

### F1: 9-Category Expense Classification System

#### Ubiquitous Requirements

- **[U1]** The system shall maintain a standard 9-category expense taxonomy:
  1. Fixed Costs (rent, management fees, loan interest, health insurance, pension, insurance, subscriptions, accounting, CCTV, telecom)
  2. Tax (employee 4 insurances, VAT, income tax, labor reporting, vehicle tax)
  3. Labor (regular part-time, short-term part-time, employee meals, team dinners)
  4. Ingredients (customizable subcategories per business)
  5. Supplies (customizable subcategories per business)
  6. Operations (interior, repairs, kitchen equipment)
  7. Marketing (signage, posters, Instagram ads, sponsored ads)
  8. Education (courses, training)
  9. Fees (card processing fees, delivery commissions)
- **[U2]** The system shall display monthly expense breakdown by the 9 major categories as a stacked bar chart with drill-down to subcategories.

#### Event-Driven Requirements

- **[E1]** **When** a user uploads a bank transaction CSV or card statement CSV, **then** the system shall auto-classify each transaction into one of the 9 major categories and an appropriate subcategory using Claude AI.
- **[E2]** **When** Hyphen syncs card or delivery transaction data, **then** the system shall auto-classify transactions based on merchant name patterns stored in the `merchant_mappings` table.
- **[E3]** **When** a transaction cannot be auto-classified with >80% confidence, **then** the system shall present the transaction to the user with a suggested category and request confirmation or correction.
- **[E4]** **When** a user corrects a classification, **then** the system shall update the `merchant_mappings` table with the corrected category for the merchant name pattern and set `created_by` to `user`.

#### State-Driven Requirements

- **[S1]** **If** a new business is created, **then** the system shall seed the default 9 major categories with standard subcategories in the `expense_categories` table.
- **[S2]** **If** a merchant name pattern already exists in `merchant_mappings` with `created_by = 'user'`, **then** the system shall use the user-defined mapping over AI classification.

#### Optional Requirements

- **[O1]** **Where** the business has sufficient historical data (>100 classified transactions), **then** the system shall calculate per-category monthly spending trends and display year-over-year comparison.

### F2: Labor Cost Management

#### Event-Driven Requirements

- **[E5]** **When** a user adds a labor cost record, **then** the system shall auto-calculate `net_amount = gross_amount - deductions`.
- **[E6]** **When** viewing the monthly labor cost summary, **then** the system shall display: total gross, total deductions, total net by month.

#### Ubiquitous Requirements

- **[U3]** The system shall provide a labor cost input form with fields: employee name, payment date, gross amount, deductions, and memo.
- **[U4]** Monthly labor costs shall be automatically included in the 9-category expense breakdown under the "Labor" category.

#### Unwanted Behavior Requirements

- **[X1]** The system shall **not** store sensitive employee data (resident registration number, personal contact) in this phase. Only employee name and payment records are stored.

### F3: Receivables & Payables Tracking

#### Event-Driven Requirements

- **[E7]** **When** a user creates an invoice record (receivable or payable), **then** the system shall track its payment status as `pending`.
- **[E8]** **When** payment is received or made for an invoice, **then** the system shall mark it as `paid` and record the `paid_date`.
- **[E9]** **When** an invoice remains unpaid past its due date, **then** the system shall automatically update its status to `overdue`.
- **[E10]** **When** there are overdue invoices (>30 days past due), **then** the system shall include an overdue alert in the Jeongjang supervisor daily briefing.

#### Ubiquitous Requirements

- **[U5]** The system shall display total outstanding receivables and payables on the analysis dashboard with separate counters for pending and overdue invoices.

#### State-Driven Requirements

- **[S3]** **If** an invoice has no `due_date` set, **then** the system shall default the due date to 30 days from `issue_date`.

### F4: Bank & Card Statement Upload with Auto-Mapping

#### Event-Driven Requirements

- **[E11]** **When** a user uploads a bank statement CSV, **then** the system shall auto-detect the bank format from the following supported banks: Shinhan, Kookmin, Woori, Hana, Nonghyup, KakaoBank, TossBank.
- **[E12]** **When** a user uploads a card statement CSV, **then** the system shall auto-detect the card company format.
- **[E13]** **When** CSV parsing is complete, **then** the system shall show a preview table with:
  - Parsed transaction date, merchant name, amount
  - Auto-classified major category and subcategory
  - Confidence score (high/medium/low indicator)
  - Editable category selector for user corrections
- **[E14]** **When** the user confirms classifications and clicks "Save", **then** the system shall:
  - Create expense records in the `expenses` table
  - Update `merchant_mappings` with any new or corrected mappings
  - Record the upload in `csv_uploads` table

#### State-Driven Requirements

- **[S4]** **If** a CSV format is not recognized as any supported bank/card format, **then** the system shall display a generic column mapping UI where the user can specify which columns correspond to date, merchant, amount, and memo.

#### Optional Requirements

- **[O2]** **Where** Hyphen-synced data exists for the same period, **then** the system shall auto-match uploaded transactions against Hyphen-synced data by date + amount + merchant to prevent duplicate expense records. Matched transactions shall be shown with a "Already synced" indicator.

#### Unwanted Behavior Requirements

- **[X2]** The system shall **not** create duplicate expense records when the same transaction appears in both a bank statement upload and a card statement upload.
- **[X3]** The system shall **not** process CSV files larger than 10MB or containing more than 10,000 rows without user confirmation.

### F5: Vendor Database

#### Event-Driven Requirements

- **[E15]** **When** a new merchant name is detected from uploads or Hyphen sync that does not exist in the `vendors` table, **then** the system shall suggest adding it to the vendor directory via a non-blocking notification.

#### Ubiquitous Requirements

- **[U6]** The system shall maintain a vendor directory with fields: business name, category, contact name, phone, business registration number, and memo.

#### Optional Requirements

- **[O3]** **Where** a vendor's business registration number is provided, **then** the system shall display the vendor's official business name from cached registration data.

### Cross-Cutting Requirements

#### Ubiquitous Requirements

- **[U7]** The system shall use Korean language for all UI labels, placeholder text, and user-facing messages.
- **[U8]** The system shall display all monetary amounts in KRW format with thousand separators (e.g., 1,234,567).
- **[U9]** All new database tables shall have Row-Level Security (RLS) policies enforcing `business_id` isolation.

#### Unwanted Behavior Requirements

- **[X4]** The system shall **not** expose one business's expense data, vendor data, or labor records to another business's user.

---

## Specifications

### Database Changes

**Migration: `supabase/migrations/00008_expense_categories.sql`**

Tables to create:

1. **`expense_categories`** - 9-category taxonomy per business
   - `id` UUID PK DEFAULT gen_random_uuid()
   - `business_id` UUID FK -> businesses(id) ON DELETE CASCADE
   - `major_category` TEXT NOT NULL (one of 9 categories)
   - `sub_category` TEXT NOT NULL
   - `display_order` INTEGER DEFAULT 0
   - `is_custom` BOOLEAN DEFAULT false
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - UNIQUE(business_id, major_category, sub_category)
   - RLS: business_id isolation

2. **`merchant_mappings`** - AI-learning merchant-to-category mapping
   - `id` UUID PK DEFAULT gen_random_uuid()
   - `business_id` UUID FK -> businesses(id) ON DELETE CASCADE
   - `merchant_name_pattern` TEXT NOT NULL
   - `major_category` TEXT NOT NULL
   - `sub_category` TEXT
   - `confidence` DECIMAL(3,2) DEFAULT 0.50
   - `created_by` TEXT NOT NULL CHECK (created_by IN ('user', 'ai'))
   - `usage_count` INTEGER DEFAULT 1
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - `updated_at` TIMESTAMPTZ DEFAULT NOW()
   - UNIQUE(business_id, merchant_name_pattern)
   - RLS: business_id isolation

3. **`labor_records`** - Per-employee labor cost tracking
   - `id` UUID PK DEFAULT gen_random_uuid()
   - `business_id` UUID FK -> businesses(id) ON DELETE CASCADE
   - `employee_name` TEXT NOT NULL
   - `payment_date` DATE NOT NULL
   - `gross_amount` INTEGER NOT NULL
   - `deductions` INTEGER NOT NULL DEFAULT 0
   - `net_amount` INTEGER GENERATED ALWAYS AS (gross_amount - deductions) STORED
   - `memo` TEXT
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - RLS: business_id isolation

4. **`invoices`** - Receivables and payables tracking
   - `id` UUID PK DEFAULT gen_random_uuid()
   - `business_id` UUID FK -> businesses(id) ON DELETE CASCADE
   - `type` TEXT NOT NULL CHECK (type IN ('receivable', 'payable'))
   - `counterparty` TEXT NOT NULL
   - `amount` INTEGER NOT NULL
   - `issue_date` DATE NOT NULL
   - `due_date` DATE
   - `paid_date` DATE
   - `status` TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue'))
   - `memo` TEXT
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - `updated_at` TIMESTAMPTZ DEFAULT NOW()
   - RLS: business_id isolation

5. **`vendors`** - Supplier/vendor directory
   - `id` UUID PK DEFAULT gen_random_uuid()
   - `business_id` UUID FK -> businesses(id) ON DELETE CASCADE
   - `name` TEXT NOT NULL
   - `category` TEXT
   - `contact_name` TEXT
   - `phone` TEXT
   - `business_number` TEXT
   - `memo` TEXT
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - `updated_at` TIMESTAMPTZ DEFAULT NOW()
   - UNIQUE(business_id, name)
   - RLS: business_id isolation

### File Changes

| Action | File Path | Description |
| ------ | --------- | ----------- |
| Create | `supabase/migrations/00008_expense_categories.sql` | Migration for 5 new tables with RLS policies and seed data |
| Create | `src/lib/ai/expense-classifier.ts` | AI-powered expense classification using Claude API |
| Create | `src/lib/csv/bank-statement-parser.ts` | Bank statement CSV parser (7 Korean banks) |
| Create | `src/lib/csv/card-statement-parser.ts` | Card statement CSV parser (major Korean card companies) |
| Create | `src/lib/queries/labor.ts` | Labor cost CRUD queries |
| Create | `src/lib/queries/invoice.ts` | Invoice CRUD queries |
| Create | `src/lib/queries/vendor.ts` | Vendor CRUD queries |
| Create | `src/lib/queries/expense-category.ts` | Expense category and merchant mapping queries |
| Create | `src/components/seri/labor-cost-form.tsx` | Labor cost input form (employee name, date, gross, deductions) |
| Create | `src/components/seri/invoice-tracker.tsx` | Invoice management UI (create, list, mark paid) |
| Create | `src/components/seri/statement-upload.tsx` | Drag-and-drop CSV upload with bank/card detection |
| Create | `src/components/seri/classification-preview.tsx` | Preview table with auto-classified transactions and edit capability |
| Create | `src/components/analysis/expense-category-chart.tsx` | 9-category stacked bar chart (Recharts) |
| Create | `src/app/api/classify/route.ts` | Transaction classification API endpoint |
| Create | `src/app/(dashboard)/analysis/upload/page.tsx` | Upload page within Seri analysis section |
| Modify | `src/types/database.ts` | Add type definitions for 5 new tables |
| Modify | `src/app/(dashboard)/analysis/page.tsx` | Integrate expense category chart and invoice summary |
| Modify | `src/lib/ai/seri-engine.ts` | Add expense classification orchestration |

### Architecture

```
SPEC-SERI-002 Architecture
==========================

CSV Upload Flow:
  User uploads CSV
    -> bank-statement-parser.ts / card-statement-parser.ts (detect format, parse rows)
    -> expense-classifier.ts (Claude AI classification for unknown merchants)
    -> classification-preview.tsx (user review & corrections)
    -> expense-category.ts queries (save expenses + update merchant_mappings)

Hyphen Sync Flow:
  Hyphen sync triggers
    -> expense-classifier.ts (check merchant_mappings first, AI fallback)
    -> expenses table (auto-insert classified transactions)

Category Learning Loop:
  AI classifies transaction (confidence < 80%)
    -> User corrects classification
    -> merchant_mappings updated (created_by: 'user')
    -> Next time same merchant appears, user mapping used (no AI call)

Integration Points:
  expense-category-chart.tsx <- expenses table (grouped by major_category)
  invoice-tracker.tsx <- invoices table
  labor-cost-form.tsx <- labor_records table
  jeongjang briefing <- invoices (overdue alerts)
  seri-engine.ts <- expense-classifier.ts (orchestration)
```

### Integration with Existing Systems

| Feature | Auto Data Source | Manual Fallback |
|---------|-----------------|-----------------|
| Expense Classification | Hyphen card/delivery sync | CSV upload + manual entry |
| Labor Costs | None (manual entry required) | Labor cost form |
| Receivables/Payables | None (manual entry required) | Invoice form |
| Bank Statement | None | CSV upload |
| Vendor Directory | Hyphen merchant data | Manual addition |

---

## Traceability

| Requirement | Test Scenario | Acceptance Criteria |
| ----------- | ------------- | ------------------- |
| U1/S1 | AC-1: Default category seeding | acceptance.md#AC-1 |
| E1/E2/E3/E4 | AC-2: AI classification | acceptance.md#AC-2 |
| U2 | AC-3: Category chart | acceptance.md#AC-3 |
| E5/E6/U3/U4 | AC-4: Labor cost management | acceptance.md#AC-4 |
| E7/E8/E9/E10 | AC-5: Invoice tracking | acceptance.md#AC-5 |
| E11/E12/E13/E14 | AC-6: Statement upload | acceptance.md#AC-6 |
| S4 | AC-7: Generic CSV mapping | acceptance.md#AC-7 |
| O2/X2 | AC-8: Duplicate prevention | acceptance.md#AC-8 |
| E15/U6 | AC-9: Vendor management | acceptance.md#AC-9 |
| U9/X4 | AC-10: RLS security | acceptance.md#AC-10 |

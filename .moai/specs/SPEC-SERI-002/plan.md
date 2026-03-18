# SPEC-SERI-002: Implementation Plan

## Metadata

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| SPEC ID     | SPEC-SERI-002                                      |
| Title       | Enhanced Bookkeeping & Cost Intelligence           |
| Related     | SPEC-SERI-001, SPEC-HYPHEN-001, SPEC-IMPORT-001   |

---

## Milestones

### Primary Goal: Database Schema & Core Queries

**Objective**: Establish the data foundation for all 5 features.

**Tasks**:

1. Create migration `supabase/migrations/00008_expense_categories.sql`:
   - Define 5 tables: `expense_categories`, `merchant_mappings`, `labor_records`, `invoices`, `vendors`
   - Add RLS policies for all tables (business_id isolation)
   - Seed default 9 major categories with standard subcategories
   - Add `net_amount` as a generated column in `labor_records`

2. Update `src/types/database.ts`:
   - Add TypeScript type definitions for all 5 new tables
   - Add helper types (Tables, InsertTables, UpdateTables) for new tables

3. Create query modules:
   - `src/lib/queries/expense-category.ts` - CRUD for categories and merchant mappings
   - `src/lib/queries/labor.ts` - CRUD for labor records with monthly aggregation
   - `src/lib/queries/invoice.ts` - CRUD for invoices with status management
   - `src/lib/queries/vendor.ts` - CRUD for vendors with dedup logic

**Dependencies**: None (foundation layer)

**Acceptance Criteria**: AC-1, AC-10

---

### Secondary Goal: Bank/Card Statement Parsing

**Objective**: Parse CSV files from 7 major Korean banks and major card companies.

**Tasks**:

1. Create `src/lib/csv/bank-statement-parser.ts`:
   - Implement format detection by analyzing header rows
   - Support 7 bank formats: Shinhan, Kookmin, Woori, Hana, Nonghyup, KakaoBank, TossBank
   - Extract: transaction date, merchant/description, withdrawal amount, deposit amount, balance, memo
   - Normalize all formats to a common `ParsedTransaction` interface
   - Handle Korean encoding (EUC-KR and UTF-8)

2. Create `src/lib/csv/card-statement-parser.ts`:
   - Implement format detection for major card companies
   - Extract: transaction date, merchant name, amount, installment info, category
   - Normalize to same `ParsedTransaction` interface

3. Define shared types:
   ```typescript
   interface ParsedTransaction {
     date: string;           // YYYY-MM-DD
     merchantName: string;
     amount: number;         // positive = expense, negative = income
     memo: string | null;
     originalCategory: string | null;  // if CSV includes a category
     bankOrCard: string;     // detected source name
     rawRow: Record<string, string>;   // original row for debugging
   }
   ```

4. Implement generic column mapping fallback:
   - When format not detected, present UI for user to map columns
   - Store column mapping per user for future uploads from same source

**Dependencies**: Existing `src/lib/csv/parser.ts` as reference

**Acceptance Criteria**: AC-6, AC-7

---

### Secondary Goal: AI Expense Classification

**Objective**: Classify transactions into the 9-category taxonomy using Claude AI with learning.

**Tasks**:

1. Create `src/lib/ai/expense-classifier.ts`:
   - `classifyTransactions(transactions: ParsedTransaction[], businessId: string)`:
     - Step 1: Check `merchant_mappings` for existing user-defined mappings (highest priority)
     - Step 2: Check `merchant_mappings` for existing AI mappings with confidence > 0.8
     - Step 3: For unmatched transactions, batch-classify via Claude API
     - Step 4: Return classifications with confidence scores
   - `updateMerchantMapping(businessId, merchantPattern, category, subcategory, createdBy)`:
     - Upsert merchant mapping, increment `usage_count`
   - Prompt engineering:
     - System prompt: 9-category taxonomy definition with Korean subcategory examples
     - User prompt: Batch of merchant names with amounts
     - Response format: JSON array with `merchantName`, `majorCategory`, `subCategory`, `confidence`
     - Token optimization: batch up to 50 transactions per API call

2. Create `src/app/api/classify/route.ts`:
   - POST endpoint accepting `{ transactions: ParsedTransaction[], businessId: string }`
   - Rate limiting: max 5 classification requests per minute per business
   - Returns classified transactions with confidence scores

3. Integrate with `src/lib/ai/seri-engine.ts`:
   - Add `classifyExpenses` method to the Seri engine orchestrator
   - Connect classification results to expense record creation

**Dependencies**: Primary Goal (database schema), Secondary Goal (CSV parsing)

**Acceptance Criteria**: AC-2

---

### Secondary Goal: UI Components

**Objective**: Build the user-facing components for all 5 features.

**Tasks**:

1. **Statement Upload UI** (`src/components/seri/statement-upload.tsx`):
   - Drag-and-drop zone accepting .csv and .xlsx files
   - Auto-detect bank/card format and display detected source name
   - File size validation (max 10MB)
   - Row count validation (max 10,000 rows, warn if exceeded)
   - Progress indicator during parsing

2. **Classification Preview** (`src/components/seri/classification-preview.tsx`):
   - Table showing parsed transactions with auto-classified categories
   - Color-coded confidence indicators (green >80%, yellow 50-80%, red <50%)
   - Editable category dropdown per row (major + subcategory)
   - "Select All" / "Deselect" functionality for batch operations
   - "Save All" button to confirm and create expense records
   - Duplicate detection indicator for Hyphen-matched transactions

3. **Expense Category Chart** (`src/components/analysis/expense-category-chart.tsx`):
   - Stacked bar chart (Recharts) showing monthly expenses by 9 categories
   - Date range selector (last 3/6/12 months)
   - Click on category segment to drill down to subcategories
   - Color legend matching the 9-category standard colors

4. **Labor Cost Form** (`src/components/seri/labor-cost-form.tsx`):
   - Input form: employee name, payment date, gross amount, deductions
   - Auto-calculated net amount (displayed, not editable)
   - Monthly summary view: total gross / deductions / net
   - List view with edit/delete actions

5. **Invoice Tracker** (`src/components/seri/invoice-tracker.tsx`):
   - Create form: type (receivable/payable), counterparty, amount, issue date, due date
   - List view with status filters (all / pending / overdue / paid)
   - "Mark as Paid" action button
   - Outstanding balance summary card (total receivable, total payable)
   - Overdue count badge

6. **Upload Page** (`src/app/(dashboard)/analysis/upload/page.tsx`):
   - Compose statement-upload + classification-preview components
   - Server Component wrapper with data fetching

**Dependencies**: Primary Goal (database schema), Secondary Goal (classification)

**Acceptance Criteria**: AC-3, AC-4, AC-5, AC-6

---

### Final Goal: Integration & Polish

**Objective**: Wire everything together with the existing Seri agent and Jeongjang briefing.

**Tasks**:

1. **Jeongjang Briefing Integration**:
   - Add overdue invoice alerts to `src/lib/ai/briefing-generator.ts`
   - Query overdue invoices (>30 days past due) per business
   - Include in daily briefing: count, total outstanding amount, counterparty names

2. **Hyphen Sync Integration**:
   - After Hyphen sync completes, run expense classification on new transactions
   - Auto-insert classified expenses (skip if merchant mapping confidence > 0.8)
   - Log low-confidence classifications for user review

3. **Duplicate Prevention**:
   - Match uploaded transactions against existing expenses by (date, amount, merchant pattern)
   - Match uploaded transactions against Hyphen-synced data
   - Show "Already exists" indicator in classification preview
   - Prevent double-insertion in save flow

4. **Analysis Dashboard Integration**:
   - Add expense category chart to analysis page
   - Add invoice summary widget (outstanding receivables/payables)
   - Add labor cost summary widget

5. **Build Verification**:
   - `npx next build` passes with zero errors
   - All new components render without hydration errors
   - RLS policies verified with Supabase test queries

**Dependencies**: All previous milestones

**Acceptance Criteria**: AC-8, AC-9

---

### Optional Goal: Advanced Features

**Objective**: Enhanced features for power users.

**Tasks**:

1. Year-over-year expense category comparison chart (requirement O1)
2. Vendor auto-suggestion from business registration lookup (requirement O3)
3. Export classified expense data as Excel/PDF report
4. Saved column mappings for repeat CSV uploads from same bank

**Dependencies**: All previous milestones

---

## Technical Approach

### AI Classification Strategy

The expense classifier follows a **tiered approach** to minimize API costs:

1. **Exact Match** (no API call): Check `merchant_mappings` for exact merchant name
2. **Pattern Match** (no API call): Check `merchant_mappings` using fuzzy matching (Korean merchant name normalization)
3. **AI Classification** (API call): Batch unmatched transactions to Claude API
4. **User Confirmation** (manual): Present low-confidence (<80%) classifications to user

Expected cost per classification batch:
- System prompt (taxonomy definition): ~500 tokens (cached)
- User prompt (50 transactions): ~2,000 tokens
- Response (50 classifications): ~1,500 tokens
- Estimated cost: ~$0.01 per 50 transactions

### CSV Parsing Strategy

Korean bank CSVs have inconsistent formats:
- Some use EUC-KR encoding, others UTF-8
- Header rows vary (1-3 rows before data)
- Column names differ per bank
- Date formats vary (YYYY-MM-DD, YYYY.MM.DD, YYYYMMDD)

Detection approach:
1. Read first 5 lines of CSV
2. Check for bank-specific keywords in headers (e.g., "신한은행", "국민은행")
3. Identify column positions by header name matching
4. Apply bank-specific date/amount parsing rules

### Merchant Name Normalization

Korean merchant names from different sources often differ:
- Bank CSV: "스타벅스강남R점" (full name)
- Card CSV: "스타벅스" (short name)
- Hyphen sync: "STARBUCKS" (English name)

Normalization rules:
1. Remove branch/location suffixes (R점, 강남점, etc.)
2. Remove special characters and whitespace
3. Map common English-Korean merchant name pairs
4. Use the normalized form as the `merchant_name_pattern` key

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
| ---- | ------ | ----------- | ---------- |
| Bank CSV format changes without notice | Parsing failures for affected bank | Medium | Implement generic fallback column mapping UI; monitor for format errors |
| AI classification accuracy below target | User frustration, excessive corrections | Low | Use tiered approach (exact > pattern > AI); user corrections improve accuracy over time |
| Duplicate detection false positives | User confusion, missing transactions | Medium | Show "potential duplicate" as a warning, not a block; let user decide |
| Large CSV uploads causing timeouts | Upload failures for power users | Low | Implement streaming parser; chunk large files; 10MB/10K row limits with confirmation |
| Merchant name normalization mismatches | Same merchant mapped to different categories | Medium | Use fuzzy matching; allow users to merge duplicate merchant mappings |
| EUC-KR encoding detection failures | Garbled Korean text in parsed transactions | Low | Implement encoding detection with fallback to manual encoding selection |

---

## Expert Consultation Recommendations

- **expert-backend**: API design for classification endpoint, batch processing patterns, Supabase query optimization
- **expert-frontend**: CSV upload UX, classification preview table performance with large datasets, chart interactivity
- **expert-security**: RLS policy review for 5 new tables, input validation for CSV uploads (file type, size, content)

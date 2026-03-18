# SPEC-SERI-002: Acceptance Criteria

## Metadata

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| SPEC ID     | SPEC-SERI-002                                      |
| Title       | Enhanced Bookkeeping & Cost Intelligence           |
| Related     | SPEC-SERI-001, SPEC-HYPHEN-001, SPEC-IMPORT-001   |

---

## AC-1: Default Category Seeding

**Requirements**: U1, S1

### Scenario 1: New business gets default categories

```gherkin
Given a new business is created in the system
When the business registration is complete
Then the expense_categories table shall contain exactly 9 major categories
And each major category shall have at least 2 default subcategories
And the total default subcategory count shall be >= 40
And the display_order shall be sequential starting from 1
```

### Scenario 2: Default categories include all 9 types

```gherkin
Given a new business has been created
When querying expense_categories for the business
Then the following major categories shall exist:
  | major_category | min_subcategories |
  | fixed_costs    | 10                |
  | tax            | 5                 |
  | labor          | 4                 |
  | ingredients    | 2                 |
  | supplies       | 2                 |
  | operations     | 3                 |
  | marketing      | 4                 |
  | education      | 1                 |
  | fees           | 2                 |
```

### Scenario 3: Custom subcategories can be added

```gherkin
Given a business has default categories
When the user adds a custom subcategory "organic vegetables" under "ingredients"
Then the new subcategory shall be saved with is_custom = true
And the default subcategories shall remain unchanged
```

---

## AC-2: AI Classification

**Requirements**: E1, E2, E3, E4, S2

### Scenario 1: Auto-classify transactions via AI

```gherkin
Given a list of 10 parsed transactions with unknown merchant names
When the expense classifier is invoked
Then each transaction shall receive a major_category and sub_category
And each transaction shall have a confidence score between 0.0 and 1.0
And the Claude API shall be called at most once for the batch
```

### Scenario 2: User-defined mapping takes priority over AI

```gherkin
Given a merchant_mapping exists for "CU" with major_category "supplies" and created_by "user"
When a transaction for merchant "CU편의점" is classified
Then the classification shall use major_category "supplies"
And the Claude API shall not be called for this transaction
```

### Scenario 3: Low-confidence transactions require user confirmation

```gherkin
Given a transaction is classified with confidence 0.65
When the classification preview is displayed
Then the transaction row shall show a yellow confidence indicator
And the category dropdown shall be pre-selected with the AI suggestion
And the row shall be visually highlighted for user attention
```

### Scenario 4: User correction updates merchant mapping

```gherkin
Given a transaction for "삼성물산" was AI-classified as "operations"
When the user corrects the category to "ingredients"
And clicks "Save All"
Then the merchant_mappings table shall contain an entry for "삼성물산" with major_category "ingredients"
And the entry shall have created_by = "user"
And the confidence shall be set to 1.0
And future transactions from "삼성물산" shall be classified as "ingredients" without AI
```

### Scenario 5: Batch classification cost control

```gherkin
Given 100 transactions need AI classification
When the classifier processes the batch
Then the transactions shall be sent in batches of 50 or fewer
And the total Claude API input tokens shall not exceed 5,000
And the total cost shall not exceed $0.03
```

---

## AC-3: Category Chart

**Requirements**: U2

### Scenario 1: Monthly stacked bar chart displays correctly

```gherkin
Given the business has expense data for the last 3 months
When the expense category chart is rendered
Then a stacked bar chart shall display one bar per month
And each bar shall show segments for the 9 major categories
And the chart shall have a color legend mapping categories to colors
And monetary amounts shall use KRW format with thousand separators
```

### Scenario 2: Category drill-down

```gherkin
Given the stacked bar chart is displayed
When the user clicks on the "ingredients" segment of a specific month
Then the chart shall expand to show subcategory breakdown for "ingredients"
And each subcategory shall display its amount and percentage of the total
```

---

## AC-4: Labor Cost Management

**Requirements**: E5, E6, U3, U4, X1

### Scenario 1: Add labor cost record

```gherkin
Given the user navigates to the labor cost form
When the user enters:
  | field         | value       |
  | employee_name | Kim Minji   |
  | payment_date  | 2026-03-15  |
  | gross_amount  | 2000000     |
  | deductions    | 200000      |
And clicks "Save"
Then a labor_records entry shall be created
And the net_amount shall be automatically calculated as 1800000
And the record shall appear in the labor cost list
```

### Scenario 2: Monthly labor summary

```gherkin
Given the business has 3 labor records for March 2026:
  | employee | gross   | deductions | net     |
  | Kim      | 2000000 | 200000     | 1800000 |
  | Lee      | 1800000 | 180000     | 1620000 |
  | Park     | 1500000 | 150000     | 1350000 |
When the monthly summary for March 2026 is displayed
Then total gross shall be 5,300,000
And total deductions shall be 530,000
And total net shall be 4,770,000
```

### Scenario 3: Labor costs appear in category breakdown

```gherkin
Given the business has labor records for March 2026 totaling 4,770,000 net
When the 9-category expense chart for March is rendered
Then the "labor" category segment shall include 4,770,000
```

### Scenario 4: No sensitive employee data stored

```gherkin
Given the labor cost form is rendered
Then the form shall not contain fields for:
  - Resident registration number
  - Personal phone number
  - Personal address
And the labor_records table schema shall not include these columns
```

---

## AC-5: Invoice Tracking

**Requirements**: E7, E8, E9, E10, U5, S3

### Scenario 1: Create a receivable invoice

```gherkin
Given the user navigates to the invoice tracker
When the user creates a new invoice:
  | field        | value        |
  | type         | receivable   |
  | counterparty | ABC Corp     |
  | amount       | 500000       |
  | issue_date   | 2026-03-01   |
  | due_date     | 2026-03-31   |
And clicks "Save"
Then an invoice record shall be created with status "pending"
And it shall appear in the receivable list
```

### Scenario 2: Mark invoice as paid

```gherkin
Given a pending receivable invoice for "ABC Corp" of 500,000
When the user clicks "Mark as Paid"
Then the invoice status shall change to "paid"
And paid_date shall be set to today
And the outstanding receivable total shall decrease by 500,000
```

### Scenario 3: Auto-set overdue status

```gherkin
Given a pending invoice with due_date 2026-02-15
And today's date is 2026-03-18
When the invoice list is loaded
Then the invoice status shall be displayed as "overdue"
And it shall be highlighted with a warning indicator
```

### Scenario 4: Default due date when not specified

```gherkin
Given the user creates an invoice without specifying due_date
And the issue_date is 2026-03-01
When the invoice is saved
Then due_date shall be automatically set to 2026-03-31 (30 days later)
```

### Scenario 5: Overdue alert in Jeongjang briefing

```gherkin
Given the business has 2 invoices overdue by more than 30 days:
  | counterparty | amount  | days_overdue |
  | ABC Corp     | 500000  | 45           |
  | XYZ Ltd      | 300000  | 35           |
When the Jeongjang daily briefing is generated
Then the briefing shall include an overdue invoice alert
And the alert shall mention 2 overdue invoices totaling 800,000
And the alert shall list the counterparty names
```

### Scenario 6: Dashboard outstanding summary

```gherkin
Given the business has:
  - 3 pending receivables totaling 1,500,000
  - 1 overdue receivable of 500,000
  - 2 pending payables totaling 800,000
When the analysis dashboard is loaded
Then the receivable summary shall show: 2,000,000 total (1 overdue)
And the payable summary shall show: 800,000 total
```

---

## AC-6: Statement Upload

**Requirements**: E11, E12, E13, E14, X3

### Scenario 1: Auto-detect Shinhan bank CSV

```gherkin
Given the user uploads a CSV file from Shinhan Bank
When the file is processed by the bank statement parser
Then the parser shall detect the format as "shinhan"
And shall extract date, merchant, amount, and balance columns
And shall normalize dates to YYYY-MM-DD format
```

### Scenario 2: Auto-detect KakaoBank CSV

```gherkin
Given the user uploads a CSV file from KakaoBank
When the file is processed by the bank statement parser
Then the parser shall detect the format as "kakaobank"
And shall handle UTF-8 encoding without issues
And shall extract the correct columns despite different header naming
```

### Scenario 3: Classification preview table

```gherkin
Given a bank CSV with 20 transactions has been parsed and classified
When the classification preview is displayed
Then a table shall show all 20 transactions with columns:
  | column     | type     |
  | Date       | text     |
  | Merchant   | text     |
  | Amount     | currency |
  | Category   | dropdown |
  | Confidence | badge    |
And high confidence (>80%) rows shall have green indicators
And medium confidence (50-80%) rows shall have yellow indicators
And low confidence (<50%) rows shall have red indicators
```

### Scenario 4: Save confirmed classifications

```gherkin
Given 20 transactions are in the classification preview
And the user has corrected 3 classifications
When the user clicks "Save All"
Then 20 expense records shall be created in the expenses table
And 3 merchant_mapping entries shall be created or updated with created_by = "user"
And the remaining AI-generated mappings shall be saved with created_by = "ai"
And a csv_uploads record shall be created with row_count = 20
And the user shall be redirected to the analysis page
```

### Scenario 5: Large file warning

```gherkin
Given the user uploads a CSV file with 15,000 rows
When the file size or row count is validated
Then a warning dialog shall appear: "This file contains 15,000 rows. Processing may take longer. Continue?"
And the user must confirm before processing begins
```

---

## AC-7: Generic CSV Mapping

**Requirements**: S4

### Scenario 1: Unrecognized CSV format fallback

```gherkin
Given the user uploads a CSV from an unsupported bank
When the bank statement parser cannot detect the format
Then a column mapping UI shall be displayed
And the UI shall show the first 5 rows of the CSV as preview
And the user shall be able to assign columns for:
  | field    | required |
  | Date     | yes      |
  | Merchant | yes      |
  | Amount   | yes      |
  | Memo     | no       |
And after mapping, the parser shall process the file using the user-defined column assignments
```

---

## AC-8: Duplicate Prevention

**Requirements**: O2, X2

### Scenario 1: Detect duplicate with Hyphen-synced data

```gherkin
Given Hyphen has synced a card transaction: date=2026-03-15, amount=35000, merchant="CU"
When the user uploads a bank CSV containing the same transaction
Then the classification preview shall show this transaction with an "Already synced" badge
And the transaction shall be unchecked by default in the save selection
And if the user forces save, the system shall not create a duplicate expense record
```

### Scenario 2: Detect duplicate within uploaded file

```gherkin
Given the user uploads a bank CSV and a card CSV for the same period
And both contain a transaction: date=2026-03-10, amount=50000, merchant="GS25"
When both files are processed sequentially
Then the second upload shall detect the duplicate
And show "Possible duplicate" warning on the matching transaction
```

---

## AC-9: Vendor Management

**Requirements**: E15, U6

### Scenario 1: Suggest new vendor from upload

```gherkin
Given a transaction from merchant "Fresh Market" is saved
And "Fresh Market" does not exist in the vendors table
When the expense record is created
Then a non-blocking toast notification shall appear: "Add Fresh Market to vendor directory?"
And clicking the notification shall open a pre-filled vendor form with the merchant name
```

### Scenario 2: Vendor directory CRUD

```gherkin
Given the user navigates to the vendor directory
When the user adds a new vendor:
  | field           | value         |
  | name            | Fresh Market  |
  | category        | ingredients   |
  | contact_name    | Park Jongsu   |
  | phone           | 010-1234-5678 |
  | business_number | 123-45-67890  |
And clicks "Save"
Then the vendor shall appear in the vendor list
And the vendor shall be searchable by name
```

---

## AC-10: RLS Security

**Requirements**: U9, X4

### Scenario 1: Cross-business data isolation

```gherkin
Given Business A and Business B both have expense_categories, merchant_mappings, labor_records, invoices, and vendors data
When Business A's user queries any of these tables
Then only Business A's records shall be returned
And Business B's data shall not be accessible
```

### Scenario 2: RLS policies on all new tables

```gherkin
Given the migration 00008_expense_categories.sql has been applied
When checking RLS status for each new table
Then all 5 tables shall have RLS enabled
And each table shall have SELECT, INSERT, UPDATE, DELETE policies
And all policies shall filter by business_id matching the authenticated user's businesses
```

---

## Quality Gates

### Build Verification

```gherkin
Given all SPEC-SERI-002 features have been implemented
When running "npx next build"
Then the build shall complete with zero errors
And zero TypeScript type errors shall be reported
```

### Definition of Done

- [ ] All 10 acceptance criteria scenarios pass
- [ ] 5 new database tables created with RLS policies
- [ ] Bank statement parser supports 7 Korean banks
- [ ] AI expense classifier integrates with Claude API
- [ ] Classification preview UI allows user corrections
- [ ] 9-category stacked bar chart renders correctly
- [ ] Labor cost form with auto-calculated net amount
- [ ] Invoice tracker with status management and overdue detection
- [ ] Jeongjang briefing includes overdue invoice alerts
- [ ] Duplicate prevention between uploads and Hyphen sync
- [ ] `npx next build` passes with zero errors
- [ ] No hydration errors in new components

# sajang.ai E2E Test Report

**Date**: 2026-04-05 09:55:48
**Environment**: Production (https://www.sajang.ai)
**Account**: avalon55@nate.com (admin, paid plan)
**Business**: 프렌즈 스크린 부천로얄점

## Summary

| Metric | Count |
|--------|-------|
| PASS | 21 |
| WARN | 5 |
| FAIL | 0 |
| **Total** | **26** |

## Score: 81% (21/26 passed)

## Detailed Results

### Dashboard

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Loaded at https://www.sajang.ai/dashboard |
| Data Display | PASS | Business data visible |

### Revenue

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Revenue page loaded |
| Data Rows | PASS | 20 data elements found |
| Add Button | WARN | Add button not immediately visible |

### Expense

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Expense page loaded with data |

### Fixed Costs

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Fixed costs page with data |

### Transactions

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Transactions page loaded |

### AI Chat

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Chat page loaded |
| Input | PASS | Chat input visible and fillable |
| Send | PASS | Message sent |
| Response | PASS | AI response received |

### Review

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Review page with data |

### Marketing

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Marketing page loaded |

### Invoices

| Test | Status | Detail |
|------|--------|--------|
| Page Load | WARN | Invoices page loaded |

### Vendors

| Test | Status | Detail |
|------|--------|--------|
| Page Load | WARN | Vendors page loaded |

### Billing

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Billing page with subscription info |
| Subscription Status | WARN | Subscription status not clearly shown |

### Settings

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Settings page loaded |

### Connections

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | API connections page loaded |

### Budget

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Budget settings page loaded |

### Loans

| Test | Status | Detail |
|------|--------|--------|
| Page Load | PASS | Loans settings page loaded |

### Navigation

| Test | Status | Detail |
|------|--------|--------|
| Sidebar | WARN | Sidebar not visible (may be mobile view) |

### Error Check

| Test | Status | Detail |
|------|--------|--------|
| All Pages | PASS | No 500 errors detected across tested pages |

### Responsive

| Test | Status | Detail |
|------|--------|--------|
| Mobile Dashboard | PASS | Dashboard renders on mobile viewport |
| Mobile Revenue | PASS | Revenue page renders on mobile |

## Screenshots

All screenshots saved in `e2e/screenshots/c-*.png`

## Notes

- AI Chat response depends on ANTHROPIC_API_KEY being set in production env
- Seed data: 16 revenues, 12 expenses, 5 fixed costs, 5 reviews, 4 invoices, 3 vendors, 3 monthly summaries
- Hyphen API integration excluded (requires separate API credentials)
- NTS business verification API excluded (NTS_API_KEY not configured)

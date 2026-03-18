---
id: SPEC-POLISH-001
version: "1.0.0"
status: ready
created: "2026-03-03"
priority: P3
depends_on: ["SPEC-SEC-001"]
---

# SPEC-POLISH-001: Polish and Edge Case Handling

## Overview

Code review identified 3 low-priority edge case issues that improve robustness for Korean small business users. These are quality-of-life improvements that handle uncommon but real-world scenarios.

## Scope

- CSV file EUC-KR encoding detection and conversion
- FileReader memory management for large CSV files
- HTML form `noValidate` attribute for custom validation

## Out of Scope

- CSV parsing logic changes (SPEC-SEC-001)
- Import performance optimization (SPEC-PERF-001)
- Core feature development

---

## Requirements (EARS)

### REQ-01: EUC-KR Encoding Detection

**When:**
- When a user uploads a CSV file that is EUC-KR encoded (common for Korean bank/card company exports), the system SHALL detect the encoding and convert to UTF-8 before parsing.

**Where:**
- File: `src/components/import/csv-upload-zone.tsx`

**Rationale:**
- Current state: `FileReader.readAsText()` defaults to UTF-8. EUC-KR files render as garbled text.
- Impact: Korean bank exports (KB, Shinhan, Woori) commonly use EUC-KR. Users see broken characters and cannot import data.

**Implementation Approach:**

```typescript
// Option A: Use TextDecoder with encoding detection
async function readFileWithEncoding(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  // Heuristic: check for EUC-KR byte patterns
  const hasEucKr = uint8.some((b, i) =>
    b >= 0xA1 && b <= 0xFE && i + 1 < uint8.length &&
    uint8[i + 1] >= 0xA1 && uint8[i + 1] <= 0xFE
  );

  // Try UTF-8 first, fall back to EUC-KR
  try {
    const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return utf8;
  } catch {
    return new TextDecoder("euc-kr").decode(buffer);
  }
}
```

### REQ-02: FileReader Memory Management

**When:**
- When a user uploads a CSV file larger than 5MB, the system SHALL display a warning message.
- When a user uploads a CSV file larger than 10MB, the system SHALL reject the file with an error message.

**Where:**
- File: `src/components/import/csv-upload-zone.tsx`

**Rationale:**
- Current state: No file size limit. `FileReader.readAsText()` loads entire file into memory.
- Impact: Very large files could crash the browser tab or cause memory pressure.

**Implementation Approach:**

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const WARN_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function handleFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    setError("File size exceeds 10MB limit. Please split the file.");
    return;
  }
  if (file.size > WARN_FILE_SIZE) {
    setWarning("Large file detected. Processing may take a moment.");
  }
  // proceed with parsing
}
```

### REQ-03: Form noValidate Attribute

**Ubiquitous:**
- All forms using React Hook Form with Zod validation SHALL include `noValidate` attribute to prevent browser native validation from conflicting with custom validation.

**Where:**
- Files: `src/app/auth/login/page.tsx`, `src/app/auth/signup/page.tsx`, `src/app/auth/onboarding/onboarding-form.tsx`, `src/components/data-entry/revenue-form.tsx`, `src/components/data-entry/expense-form.tsx`, `src/components/data-entry/fixed-cost-form.tsx`

**Rationale:**
- Current state: Forms do not have `noValidate`. Browser native validation (e.g., `type="email"` tooltip) can fire before Zod validation, causing inconsistent error display.
- Impact: Double error messages on some browsers, inconsistent UX.

**Implementation Approach:**

```tsx
// Before
<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

// After
<form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
```

---

## Technical Design

### Files to Modify

| File | Change | Lines |
|------|--------|-------|
| `src/components/import/csv-upload-zone.tsx` | Add encoding detection + file size limit | ~30 |
| `src/app/auth/login/page.tsx` | Add `noValidate` | ~1 |
| `src/app/auth/signup/page.tsx` | Add `noValidate` | ~1 |
| `src/app/auth/onboarding/onboarding-form.tsx` | Add `noValidate` | ~1 |
| `src/components/data-entry/revenue-form.tsx` | Add `noValidate` | ~1 |
| `src/components/data-entry/expense-form.tsx` | Add `noValidate` | ~1 |
| `src/components/data-entry/fixed-cost-form.tsx` | Add `noValidate` | ~1 |

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| TextDecoder("euc-kr") | 38+ | 19+ | 10.1+ | 79+ |
| ArrayBuffer | All modern | All modern | All modern | All modern |

---

## Acceptance Criteria

- [ ] EUC-KR encoded CSV files parse correctly (Korean characters display properly)
- [ ] UTF-8 CSV files continue to parse correctly (no regression)
- [ ] Files larger than 10MB are rejected with Korean error message
- [ ] Files between 5-10MB show warning message
- [ ] All forms with Zod validation have `noValidate` attribute
- [ ] Browser native validation tooltips do not appear on Zod-validated forms
- [ ] All existing tests pass

<!-- TAG: SPEC-POLISH-001 -->

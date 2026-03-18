# SPEC-AUTH-002: Implementation Plan

## Overview

Replace the existing email/password authentication with Kakao OAuth and add business registration verification via the NTS Public Data API. This is a Phase 1 prerequisite for all subsequent features.

---

## Milestones

### Primary Goal: Kakao OAuth Integration

**Priority: High**

Tasks:
1. Configure Kakao OAuth provider in Supabase Dashboard (Authentication > Providers)
2. Create `/auth/callback/route.ts` - OAuth callback handler using `exchangeCodeForSession`
3. Replace `src/app/auth/login/page.tsx` with single Kakao login button UI
4. Remove or redirect `src/app/auth/signup/page.tsx`
5. Update middleware to check for authenticated session + business record

Dependencies: Kakao Developer App registration, Supabase provider configuration

### Secondary Goal: NTS Business Verification

**Priority: High**

Tasks:
1. Add NTS API verification function in `src/lib/actions/business.ts`
2. Update `src/app/auth/onboarding/onboarding-form.tsx`:
   - Add 10-digit business registration number input with formatting (XXX-XX-XXXXX)
   - Add verification button triggering server action
   - Display verification result (business name, representative)
   - Submit button to create business record
3. Add error handling for NTS API failures (rate limit, network errors)

Dependencies: NTS API key from data.go.kr

### Final Goal: Cleanup & Testing

**Priority: Medium**

Tasks:
1. Remove email/password login related components and utilities
2. Update existing tests (`login-page.test.tsx`, `onboarding-form.test.tsx`)
3. Verify all RLS policies work with Kakao OAuth users
4. End-to-end flow testing: Login -> Onboarding -> Dashboard

---

## Technical Approach

### Supabase Kakao OAuth Setup

```
Supabase Dashboard:
  Authentication > Providers > Kakao
  - Client ID: from KAKAO_CLIENT_ID env var
  - Client Secret: from KAKAO_CLIENT_SECRET env var
  - Redirect URL: {SITE_URL}/auth/callback
```

### NTS API Integration

- Server-side only (server action in `src/lib/actions/business.ts`)
- API key stored in `NTS_API_KEY` environment variable
- Input validation: 10-digit numeric string
- Response parsing: extract `b_stt` (business status), `b_stt_cd` (status code)
- Error handling: timeout (5s), rate limit (HTTP 429), invalid response

### Authentication Flow State Machine

```
States: UNAUTHENTICATED -> AUTHENTICATED_NO_BUSINESS -> AUTHENTICATED_WITH_BUSINESS
Transitions:
  - Kakao login success -> AUTHENTICATED_NO_BUSINESS or AUTHENTICATED_WITH_BUSINESS
  - Business verification success -> AUTHENTICATED_WITH_BUSINESS
  - Logout -> UNAUTHENTICATED
```

---

## Risks and Mitigation

| Risk                                    | Impact | Mitigation                                     |
| --------------------------------------- | ------ | ---------------------------------------------- |
| NTS API downtime                        | High   | Cache recent verifications, show retry option  |
| Kakao OAuth consent screen changes      | Low    | Monitor Kakao developer changelog              |
| NTS free tier rate limit (1K/day)       | Medium | Implement request throttling per user          |
| Existing RLS policy incompatibility     | High   | Test all 24 RLS policies with Kakao auth users |
| Users with existing email accounts      | Medium | Allow re-linking via same email address        |

---

## Environment Variables

| Variable             | Required | Description                        |
| -------------------- | -------- | ---------------------------------- |
| `KAKAO_CLIENT_ID`    | Yes      | Kakao Developer App REST API Key   |
| `KAKAO_CLIENT_SECRET`| Yes      | Kakao Developer App Secret Key     |
| `NTS_API_KEY`        | Yes      | data.go.kr NTS API Service Key     |

---

## Tags

- SPEC-AUTH-002
- Phase: 1
- Domain: Authentication, Business Verification

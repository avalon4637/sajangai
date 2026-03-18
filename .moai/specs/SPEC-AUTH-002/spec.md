# SPEC-AUTH-002: Kakao OAuth Authentication & Business Verification

## Metadata

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| SPEC ID     | SPEC-AUTH-002                                      |
| Title       | Kakao OAuth Authentication & Business Verification |
| Created     | 2026-03-18                                         |
| Status      | Planned                                            |
| Priority    | High                                               |
| Lifecycle   | spec-anchored                                      |
| Related     | SPEC-AUTH-001 (superseded)                         |

---

## Environment

- **Platform**: Next.js 16 (App Router), React 19, Supabase Auth
- **Auth Provider**: Kakao OAuth via Supabase built-in provider
- **Business Verification**: National Tax Service (NTS) Public Data API (data.go.kr, free tier)
- **Database**: Supabase PostgreSQL with existing `businesses` table
- **Existing Auth**: Email/Password login (to be replaced)
- **Environment Variables**: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `NTS_API_KEY`

---

## Assumptions

- A1: Supabase supports Kakao as a built-in OAuth provider with minimal configuration.
- A2: The NTS Public Data API (data.go.kr) is freely available and provides business registration verification by registration number.
- A3: Existing Supabase RLS policies rely on `auth.uid()` and will work identically with Kakao OAuth users.
- A4: The `businesses` table schema does not require changes for Kakao OAuth integration.
- A5: Kakao OAuth provides a stable user identifier that maps to Supabase `auth.users.id`.

---

## Requirements

### Ubiquitous Requirements

- **[U1]** The system shall enforce authentication on all `/dashboard/*` routes.
- **[U2]** The system shall store user sessions via Supabase Auth session management.
- **[U3]** The system shall never expose `KAKAO_CLIENT_SECRET` or `NTS_API_KEY` to the client.

### Event-Driven Requirements

- **[E1]** **When** a user clicks the Kakao login button, **then** the system shall redirect the user to the Kakao OAuth consent screen via Supabase `signInWithOAuth({ provider: 'kakao' })`.
- **[E2]** **When** Kakao OAuth callback is received at `/auth/callback`, **then** the system shall exchange the authorization code for a Supabase session.
- **[E3]** **When** a new OAuth user has no associated business record, **then** the system shall redirect the user to the onboarding flow at `/auth/onboarding`.
- **[E4]** **When** a user submits a business registration number in the onboarding form, **then** the system shall verify the number against the NTS Public Data API.
- **[E5]** **When** the NTS API confirms a valid business registration, **then** the system shall create a `businesses` record linked to the authenticated user and redirect to `/dashboard`.
- **[E6]** **When** a user navigates to `/auth/signup`, **then** the system shall redirect to `/auth/login` (signup page removed).

### State-Driven Requirements

- **[S1]** **If** the user is already authenticated and has a business record, **then** navigating to `/auth/login` shall redirect to `/dashboard`.
- **[S2]** **If** the user is authenticated but has no business record, **then** the system shall redirect to `/auth/onboarding`.

### Unwanted Behavior Requirements

- **[X1]** The system shall **not** allow email/password registration or login.
- **[X2]** The system shall **not** store raw business registration numbers without associating them with a verified NTS response.
- **[X3]** The system shall **not** allow access to `/dashboard/*` routes without a verified business record.

### Optional Requirements

- **[O1]** **Where possible**, the system shall pre-fill the business name from the NTS API response during onboarding.

---

## Specifications

### File Changes

| Action   | File Path                                          | Description                              |
| -------- | -------------------------------------------------- | ---------------------------------------- |
| Modify   | `src/app/auth/login/page.tsx`                      | Replace email form with Kakao login button |
| Remove   | `src/app/auth/signup/page.tsx`                     | Remove signup page (redirect to login)   |
| Modify   | `src/app/auth/onboarding/onboarding-form.tsx`      | Add business number input + NTS verification |
| Create   | `src/app/auth/callback/route.ts`                   | OAuth callback handler                   |
| Modify   | `src/lib/actions/business.ts`                      | Add NTS API verification server action   |

### API Integration

**Kakao OAuth Flow:**
1. User clicks login button
2. Supabase redirects to Kakao consent screen
3. Kakao redirects back to `/auth/callback` with authorization code
4. Callback route exchanges code for session via `supabase.auth.exchangeCodeForSession(code)`
5. System checks for existing business record
6. Redirect to `/dashboard` (existing) or `/auth/onboarding` (new user)

**NTS Business Verification:**
- Endpoint: `https://api.odcloud.kr/api/nts-businessman/v1/validate`
- Method: POST
- Input: `b_no` (business registration number, 10 digits)
- Response: `valid` status with business details (name, representative, address)
- Rate Limit: 1,000 requests/day (free tier)

### Architecture Diagram

```
User -> Kakao Login Button -> Supabase Auth -> Kakao OAuth
                                    |
                              /auth/callback
                                    |
                         Check businesses table
                           /              \
                     Has business      No business
                         |                  |
                    /dashboard       /auth/onboarding
                                          |
                                  NTS API Verification
                                          |
                                  Create business record
                                          |
                                     /dashboard
```

---

## Traceability

| Requirement | Test Scenario          | Acceptance Criteria      |
| ----------- | ---------------------- | ------------------------ |
| E1          | AC-1: Kakao redirect   | acceptance.md#AC-1       |
| E2          | AC-2: Callback handler | acceptance.md#AC-2       |
| E3          | AC-3: New user onboard | acceptance.md#AC-3       |
| E4          | AC-4: NTS verification | acceptance.md#AC-4       |
| E5          | AC-5: Business create  | acceptance.md#AC-5       |
| X1          | AC-6: No email auth    | acceptance.md#AC-6       |
| X3          | AC-7: Protected routes | acceptance.md#AC-7       |

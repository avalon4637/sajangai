# SPEC-AUTH-002: Acceptance Criteria

## AC-1: Kakao OAuth Login

**Given** the user is on the login page (`/auth/login`)
**When** the user clicks the "Kakao Login" button
**Then** the user is redirected to the Kakao OAuth consent screen
**And** the entire login flow completes in fewer than 3 clicks

---

## AC-2: OAuth Callback Handling

**Given** the user has authorized the application on Kakao
**When** Kakao redirects to `/auth/callback` with an authorization code
**Then** the system exchanges the code for a Supabase session
**And** a valid session cookie is set

---

## AC-3: New User Onboarding Redirect

**Given** the user has authenticated via Kakao for the first time
**When** no business record exists for the user in the `businesses` table
**Then** the user is redirected to `/auth/onboarding`

---

## AC-4: NTS Business Verification

**Given** the user is on the onboarding page
**When** the user enters a valid 10-digit business registration number and clicks "Verify"
**Then** the system calls the NTS Public Data API
**And** displays the business name and representative name from the API response
**And** the verification completes within 5 seconds

**Given** the user enters an invalid or non-existent business registration number
**When** the user clicks "Verify"
**Then** the system displays a clear error message in Korean (e.g., "유효하지 않은 사업자등록번호입니다")
**And** the user can retry with a different number

---

## AC-5: Business Record Creation

**Given** the NTS API has confirmed a valid business registration
**When** the user clicks "Complete Registration" on the onboarding form
**Then** a new record is created in the `businesses` table with the verified business number
**And** the user is redirected to `/dashboard`

---

## AC-6: Email/Password Auth Removed

**Given** the application is deployed
**When** a user navigates to `/auth/signup`
**Then** the user is redirected to `/auth/login`
**And** no email/password input fields are present on the login page

---

## AC-7: Protected Route Enforcement

**Given** an unauthenticated user
**When** the user attempts to access any `/dashboard/*` route
**Then** the user is redirected to `/auth/login`

**Given** an authenticated user without a business record
**When** the user attempts to access any `/dashboard/*` route
**Then** the user is redirected to `/auth/onboarding`

---

## AC-8: RLS Policy Compatibility

**Given** a user authenticated via Kakao OAuth
**When** the user performs CRUD operations on revenues, expenses, or fixed_costs
**Then** all existing RLS policies function correctly using `auth.uid()`
**And** the user can only access their own business data

---

## Quality Gates

| Gate                    | Criteria                                           |
| ----------------------- | -------------------------------------------------- |
| Login UX                | Complete login in < 3 clicks                       |
| NTS API Response        | Verification completes within 5 seconds            |
| Error Messages          | All error messages displayed in Korean             |
| RLS Compatibility       | All 24 existing RLS policies pass with Kakao users |
| Zero Email Auth         | No email/password login or signup endpoints remain |
| Session Security        | Session tokens use httpOnly, secure, sameSite=lax  |

---

## Verification Methods

- **Unit Tests**: NTS API verification function, business record creation
- **Integration Tests**: OAuth callback flow, session management
- **E2E Tests**: Full login -> onboarding -> dashboard flow
- **Manual Tests**: Kakao consent screen, mobile responsiveness

---

## Definition of Done

- [ ] Kakao OAuth login works end-to-end
- [ ] NTS business verification works with valid/invalid numbers
- [ ] Email/password auth completely removed
- [ ] All 24 RLS policies verified with Kakao auth users
- [ ] Error messages displayed in Korean
- [ ] All existing tests updated and passing
- [ ] Environment variables documented

---

## Tags

- SPEC-AUTH-002

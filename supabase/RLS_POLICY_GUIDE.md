# Supabase RLS Policy Guide - sajang.ai

## Overview

sajang.ai uses Supabase Row Level Security (RLS) to enforce data isolation between users at the database level. Every table has RLS enabled with per-operation policies ensuring users can only access their own business data.

## Architecture

```
auth.users (Supabase Auth)
  |
  +-- businesses (user_id = auth.uid())
        |
        +-- revenues (business_id -> businesses.id)
        +-- expenses (business_id -> businesses.id)
        +-- fixed_costs (business_id -> businesses.id)
        +-- monthly_summaries (business_id -> businesses.id)
        +-- csv_uploads (business_id -> businesses.id)
```

**Ownership Model:**
- `businesses` table: Direct ownership via `user_id` column matching `auth.uid()`
- All other tables: Indirect ownership via `business_id` FK referencing `businesses.id`

## Table-by-Table Policy Reference

### businesses

| Policy Name | Operation | Condition |
|---|---|---|
| `businesses_select_own` | SELECT | `auth.uid() = user_id` |
| `businesses_insert_own` | INSERT | `auth.uid() = user_id` |
| `businesses_update_own` | UPDATE | `auth.uid() = user_id` |
| `businesses_delete_own` | DELETE | `auth.uid() = user_id` |

**Explanation:** Users can only read, create, modify, and delete businesses where the `user_id` column matches their authenticated user ID.

### revenues

| Policy Name | Operation | Condition |
|---|---|---|
| `revenues_select_own` | SELECT | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `revenues_insert_own` | INSERT | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `revenues_update_own` | UPDATE | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `revenues_delete_own` | DELETE | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |

**Explanation:** Revenue records are accessible only when they belong to a business owned by the authenticated user.

### expenses

| Policy Name | Operation | Condition |
|---|---|---|
| `expenses_select_own` | SELECT | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `expenses_insert_own` | INSERT | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `expenses_update_own` | UPDATE | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `expenses_delete_own` | DELETE | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |

**Explanation:** Expense records (both fixed and variable types) are accessible only when they belong to a business owned by the authenticated user.

### fixed_costs

| Policy Name | Operation | Condition |
|---|---|---|
| `fixed_costs_select_own` | SELECT | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `fixed_costs_insert_own` | INSERT | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `fixed_costs_update_own` | UPDATE | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `fixed_costs_delete_own` | DELETE | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |

**Explanation:** Fixed cost entries are accessible only when they belong to a business owned by the authenticated user.

### monthly_summaries

| Policy Name | Operation | Condition |
|---|---|---|
| `monthly_summaries_select_own` | SELECT | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `monthly_summaries_insert_own` | INSERT | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `monthly_summaries_update_own` | UPDATE | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `monthly_summaries_delete_own` | DELETE | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |

**Explanation:** KPI summary records are accessible only when they belong to a business owned by the authenticated user.

### csv_uploads

| Policy Name | Operation | Condition |
|---|---|---|
| `csv_uploads_select_own` | SELECT | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `csv_uploads_insert_own` | INSERT | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `csv_uploads_update_own` | UPDATE | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |
| `csv_uploads_delete_own` | DELETE | `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` |

**Explanation:** CSV upload history records are accessible only when they belong to a business owned by the authenticated user.

## How to Verify in Supabase Dashboard

### Step 1: Check RLS Enabled Status

1. Open Supabase Dashboard > Table Editor
2. For each table, click the table name
3. Look for the "RLS Enabled" badge (shield icon) next to the table name
4. All 6 tables should show RLS as enabled

Alternatively, run this SQL in the SQL Editor:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('businesses', 'revenues', 'expenses', 'fixed_costs', 'monthly_summaries', 'csv_uploads')
ORDER BY tablename;
```

Expected: All rows show `rowsecurity = true`.

### Step 2: List All Policies

Run in SQL Editor:

```sql
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

Expected: 24 rows total (4 policies per table x 6 tables).

### Step 3: Verify Policy Count Per Table

```sql
SELECT tablename, count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

Expected: Each table shows `policy_count = 4`.

### Step 4: View Policy Details

```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## How to Test Data Isolation

### Test 1: Cross-User Data Access (SQL Editor)

Simulate User A trying to access User B's data. Run in Supabase SQL Editor with `SET role` to simulate different users:

```sql
-- Step 1: Find two different users
SELECT id, user_id FROM businesses LIMIT 5;

-- Step 2: Set JWT claims for User A
-- (In Supabase Dashboard, use the API section with User A's token)

-- Step 3: Query revenues - should only see User A's data
SELECT * FROM revenues;

-- Step 4: Try inserting with User B's business_id - should fail
INSERT INTO revenues (business_id, date, amount)
VALUES ('<user_b_business_id>', '2026-01-01', 100000);
-- Expected: ERROR - new row violates row-level security policy
```

### Test 2: API-Level Testing with curl

```bash
# Use User A's anon key + JWT
ANON_KEY="your-anon-key"
USER_A_TOKEN="user-a-jwt-token"
USER_B_BUSINESS_ID="user-b-business-uuid"

# Try to read User B's revenues - should return empty array
curl -X GET \
  "https://your-project.supabase.co/rest/v1/revenues?business_id=eq.${USER_B_BUSINESS_ID}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${USER_A_TOKEN}"
# Expected: []

# Try to insert into User B's business - should fail
curl -X POST \
  "https://your-project.supabase.co/rest/v1/revenues" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"business_id\": \"${USER_B_BUSINESS_ID}\", \"date\": \"2026-01-01\", \"amount\": 100000}"
# Expected: 403 Forbidden or RLS violation error
```

### Test 3: Verify via Application

1. Log in as User A
2. Add a revenue entry
3. Log in as User B
4. Verify User A's revenue is not visible
5. Verify User B cannot modify User A's records via browser DevTools

## Important Notes

### Service Role Key

- The `service_role` key bypasses ALL RLS policies
- It should ONLY be used in trusted server-side environments (admin scripts, migrations)
- The application server actions use the `anon` key, so RLS is enforced
- NEVER expose the `service_role` key to the client

### Performance Considerations

- The subquery `SELECT id FROM businesses WHERE user_id = auth.uid()` runs for every row check
- This is efficient because `businesses.user_id` has an index (`idx_businesses_user_id`)
- For very high-traffic applications, consider a security definer function to cache the lookup

### Policy Type

- All policies are `PERMISSIVE` (default)
- Multiple permissive policies on the same table/operation are OR-combined
- If you need to add restrictive conditions later, use `CREATE POLICY ... AS RESTRICTIVE`

## Migration File Reference

- Initial schema: `supabase/migrations/00001_initial_schema.sql`
- Granular RLS policies: `supabase/migrations/20260224000000_rls_policies.sql`

## Applying the Migration

```bash
# Option 1: Via Supabase CLI (if configured)
supabase db push

# Option 2: Copy-paste into Supabase Dashboard SQL Editor
# Open supabase/migrations/20260224000000_rls_policies.sql
# Paste entire contents into SQL Editor and run
```

# Domain Schema Aliases

> Phase 3.1 — Progressive split of `types/database.ts`

## Why this exists

`src/types/database.ts` is a large (~1,400 LOC) single file that mirrors the
Supabase-generated structure. Splitting it directly breaks the nested
`Database["public"]["Tables"]` shape, so instead we provide **domain-scoped
alias files** here that re-export convenience types.

## Pattern

Each file in this directory:

1. Imports the root `Database` type
2. Exports `Row`, `Insert`, `Update` aliases for tables in that domain
3. Keeps one file per bounded context (finance, reviews, agents, etc.)

Example:

```typescript
import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type Revenue = Tables["revenues"]["Row"];
export type RevenueInsert = Tables["revenues"]["Insert"];
export type RevenueUpdate = Tables["revenues"]["Update"];
```

## Migration path

- **New code**: Import from `@/types/schema/{domain}` instead of `@/types/database`
- **Existing code**: Leave untouched. Progressive migration as files are touched
- **Database.ts**: Remains the single source of truth for table shapes

## Domain catalog

| File | Tables |
|---|---|
| `business.ts` | businesses, user_profiles |
| `finance.ts` | revenues, expenses, fixed_costs, monthly_summaries, budgets, loans, loan_repayments |
| `reviews.ts` | delivery_reviews, reviews, naver_reviews |
| `billing.ts` | subscriptions, payments |
| `agents.ts` | agent_profiles, conversations, messages, agent_memories, agent_events, store_context |
| `sync.ts` | api_connections, sync_logs |
| `insights.ts` | insight_events, action_results |
| `reports.ts` | daily_reports |
| `observability.ts` | ai_call_logs |
| `settlements.ts` | card_settlements |
| `roi.ts` | monthly_roi_reports |
| `index.ts` | Barrel re-export of all domains |

# SPEC-JEONGJANG-001: Jeongjang AI Engine + KakaoTalk Notifications

## Metadata

| Field       | Value                                                  |
| ----------- | ------------------------------------------------------ |
| SPEC ID     | SPEC-JEONGJANG-001                                     |
| Title       | Jeongjang AI Engine - Daily Briefing & Proactive Alerts|
| Created     | 2026-03-18                                             |
| Status      | Planned                                                |
| Priority    | High                                                   |
| Phase       | 5                                                      |
| Lifecycle   | spec-anchored                                          |
| Related     | SPEC-SERI-001, SPEC-DAPJANGI-001, SPEC-HYPHEN-001     |

---

## Environment

- **Runtime**: Next.js 16 App Router, React 19, TypeScript 5.9
- **AI**: Claude API (Sonnet 4.6) via Anthropic SDK with streaming
- **Database**: Supabase PostgreSQL 16 with Row-Level Security
- **Cron**: Supabase Edge Functions with pg_cron for scheduled tasks
- **Messaging**: Solapi SDK (KakaoTalk + SMS fallback)
- **Data Sources**: store_context table (Seri revenue data, Dapjangi review insights)

## Assumptions

- A1: Seri agent (SPEC-SERI-001) writes revenue analysis to store_context table
- A2: Dapjangi agent (SPEC-DAPJANGI-001) writes review insights to store_context table
- A3: Supabase Edge Functions support pg_cron for scheduled daily briefing at 8:00 AM KST
- A4: Solapi SDK supports KakaoTalk AlimTalk with template registration
- A5: Business owners have registered KakaoTalk-capable phone numbers
- A6: Claude API can synthesize multi-source data into natural language briefings
- A7: SMS fallback is acceptable when KakaoTalk delivery fails

---

## Requirements

### J1: Daily Briefing Generator

**[REQ-J1-01]** WHEN the daily cron triggers at 8:00 AM KST THEN the system shall generate a daily briefing for each active business.

**[REQ-J1-02]** WHEN generating a daily briefing THEN the system shall combine outputs from Seri (revenue) and Dapjangi (reviews) via store_context.

**[REQ-J1-03]** The system shall always format briefings in the structure: one-line summary, revenue section, review section, warnings, action items.

**[REQ-J1-04]** WHEN presenting data THEN the system shall use natural language explanations, not raw number dumps (e.g., "Revenue dropped 12%, likely due to rain + 40% delivery reject rate").

**[REQ-J1-05]** The system shall always cache generated briefings in a `daily_reports` table.

### J2: Proactive Diagnosis

**[REQ-J2-01]** WHEN cross-agent data is available THEN the system shall correlate review complaints with financial data to find root causes.

**[REQ-J2-02]** WHEN anomalies are detected across any data source THEN the system shall generate a diagnostic alert.

**[REQ-J2-03]** WHEN generating recommendations THEN the system shall provide actionable, priority-ranked action items.

**[REQ-J2-04]** The system shall not generate alerts for normal fluctuations within expected ranges.

### J3: Chat Interface

**[REQ-J3-01]** WHEN a business owner sends a natural language query THEN the system shall respond with context-aware answers using all available business data.

**[REQ-J3-02]** WHEN responding to chat queries THEN the system shall stream responses via Claude API for real-time feedback.

**[REQ-J3-03]** The system shall always store conversation history per business in the `conversations` and `messages` tables.

**[REQ-J3-04]** The system shall support queries like: "How much was Baemin commission this month?", "Why did revenue drop yesterday?", "What are customers complaining about?"

### J4: KakaoTalk Alert Integration (Solapi)

**[REQ-J4-01]** WHEN a daily briefing is generated THEN the system shall send it via KakaoTalk AlimTalk with a deep link to the app dashboard.

**[REQ-J4-02]** WHEN an urgent alert is triggered (negative review, cash flow warning) THEN the system shall send an instant KakaoTalk notification.

**[REQ-J4-03]** WHEN a weekly summary is available THEN the system shall send it via KakaoTalk.

**[REQ-J4-04]** IF KakaoTalk delivery fails THEN the system shall fall back to SMS via Solapi.

**[REQ-J4-05]** The system shall always use environment variables for Solapi credentials: `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_PFID`.

---

## Specifications

### New Files

| File                                            | Purpose                                      |
| ----------------------------------------------- | -------------------------------------------- |
| `src/lib/ai/jeongjang-engine.ts`                | Supervisor orchestration engine              |
| `src/lib/ai/jeongjang-prompts.ts`               | Briefing and diagnosis prompt templates      |
| `src/lib/ai/briefing-generator.ts`              | Daily briefing composition logic             |
| `src/lib/messaging/solapi-client.ts`            | Solapi SDK wrapper (AlimTalk + SMS)          |
| `src/lib/messaging/templates.ts`                | KakaoTalk AlimTalk template definitions      |
| `src/lib/messaging/sender.ts`                   | Message dispatch logic with fallback         |
| `src/app/api/chat/route.ts`                     | Chat streaming endpoint (POST)               |
| `supabase/functions/daily-briefing/index.ts`    | Supabase Edge Function for daily cron        |

### Database Changes

**New table: `daily_reports`**

| Column        | Type        | Constraints                        |
| ------------- | ----------- | ---------------------------------- |
| id            | uuid        | PK, default gen_random_uuid()     |
| business_id   | uuid        | FK -> businesses, NOT NULL         |
| report_date   | date        | NOT NULL                           |
| summary       | text        | One-line summary                   |
| content       | jsonb       | Full briefing content (sections)   |
| action_items  | jsonb       | Priority-ranked action items       |
| created_at    | timestamptz | default now()                      |

**Unique constraint**: `(business_id, report_date)` - one report per business per day.

**New table: `message_logs`**

| Column        | Type        | Constraints                        |
| ------------- | ----------- | ---------------------------------- |
| id            | uuid        | PK, default gen_random_uuid()     |
| business_id   | uuid        | FK -> businesses, NOT NULL         |
| channel       | text        | "alimtalk" or "sms"               |
| template_id   | text        | AlimTalk template identifier       |
| status        | text        | sent/failed/fallback               |
| sent_at       | timestamptz | default now()                      |
| error_detail  | text        | null on success                    |

### Architecture

```
[Supabase Cron: 8:00 AM KST]
  |
  v
[daily-briefing/index.ts] -- for each active business -->
  |
  v
[briefing-generator.ts]
  |-- Read store_context (Seri: revenue data)
  |-- Read store_context (Dapjangi: review insights)
  |-- Read delivery data (anomalies, trends)
  |
  v
[jeongjang-prompts.ts] --> Claude API --> Natural language briefing
  |
  v
[daily_reports] table (cache)
  |
  v
[sender.ts] --> [solapi-client.ts] --> KakaoTalk AlimTalk
                                        |
                                        v (on failure)
                                      SMS fallback

[Chat Flow]
User query --> /api/chat/route.ts --> [jeongjang-engine.ts]
  |-- Load business context (store_context, daily_reports)
  |-- Claude API streaming response
  |-- Save to conversations/messages tables
  v
Streaming response to client
```

### Constraints

- C1: Daily briefing must complete for all businesses within 30 minutes of cron trigger
- C2: KakaoTalk AlimTalk templates must be pre-registered with Solapi
- C3: Chat responses must begin streaming within 2 seconds
- C4: All data access is business-scoped via RLS
- C5: Solapi credentials must never be exposed to client-side code
- C6: Daily report generation is idempotent (re-running for same date updates, not duplicates)

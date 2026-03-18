# SPEC-JEONGJANG-001: Implementation Plan

## Traceability

| SPEC ID | Tag Range         |
| ------- | ----------------- |
| SPEC-JEONGJANG-001 | REQ-J1-01 ~ REQ-J4-05 |

---

## Milestones

### Primary Goal: Messaging Infrastructure + Daily Briefing (J1, J4)

**Milestone 1: Solapi Messaging Layer**
- Implement `src/lib/messaging/solapi-client.ts`
  - `initSolapiClient()`: Initialize with env vars (SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_PFID)
  - `sendAlimTalk(phoneNumber, templateId, variables)`: Send KakaoTalk AlimTalk
  - `sendSMS(phoneNumber, message)`: SMS fallback
  - `getDeliveryStatus(messageId)`: Check delivery status
- Implement `src/lib/messaging/templates.ts`
  - `DAILY_BRIEFING_TEMPLATE`: AlimTalk template for daily briefing
  - `URGENT_ALERT_TEMPLATE`: AlimTalk template for urgent alerts
  - `WEEKLY_SUMMARY_TEMPLATE`: AlimTalk template for weekly summary
- Implement `src/lib/messaging/sender.ts`
  - `sendNotification(businessId, type, content)`: Dispatch with AlimTalk-first, SMS fallback
  - `logMessage(businessId, channel, templateId, status)`: Write to message_logs
- Tags: REQ-J4-01, REQ-J4-04, REQ-J4-05

**Milestone 2: Database Schema**
- Create migration for `daily_reports` table with unique constraint on (business_id, report_date)
- Create migration for `message_logs` table
- Add RLS policies for both tables (business_id scope)
- Tags: REQ-J1-05

**Milestone 3: Daily Briefing Generator**
- Implement `src/lib/ai/briefing-generator.ts`
  - `gatherContext(businessId)`: Read Seri + Dapjangi data from store_context
  - `composeBriefing(businessId, context)`: Generate briefing via Claude API
  - `saveBriefing(businessId, briefing)`: Upsert to daily_reports
  - `formatForAlimTalk(briefing)`: Truncate and format for KakaoTalk character limits
- Implement `src/lib/ai/jeongjang-prompts.ts`
  - `buildBriefingPrompt(revenueData, reviewInsights, anomalies)`: System + user prompt
  - `buildDiagnosisPrompt(correlatedData)`: Proactive diagnosis prompt
  - `buildChatPrompt(query, businessContext)`: Chat response prompt
- Implement `supabase/functions/daily-briefing/index.ts`
  - Supabase Edge Function triggered by pg_cron at 8:00 AM KST
  - Iterate active businesses, generate briefing, send AlimTalk
  - Error handling with per-business isolation (one failure does not block others)
- Tags: REQ-J1-01, REQ-J1-02, REQ-J1-03, REQ-J1-04, REQ-J4-01

### Secondary Goal: Proactive Diagnosis (J2)

**Milestone 4: Cross-Agent Diagnosis Engine**
- Implement diagnostic features in `src/lib/ai/jeongjang-engine.ts`
  - `correlateData(businessId)`: Cross-reference review complaints with financial metrics
  - `detectAnomalies(businessId)`: Identify out-of-range values across data sources
  - `generateDiagnosis(businessId, anomalies)`: Natural language root cause analysis
  - `rankActionItems(insights)`: Priority-rank recommendations
  - `isNormalFluctuation(metric, value)`: Filter out normal variance
- Tags: REQ-J2-01, REQ-J2-02, REQ-J2-03, REQ-J2-04

### Final Goal: Chat Interface (J3)

**Milestone 5: Streaming Chat Endpoint**
- Implement `src/app/api/chat/route.ts`
  - POST handler accepting `{ message: string, businessId: string }`
  - Load business context from store_context, daily_reports, delivery data
  - Stream response via Claude API with ReadableStream
  - Save conversation to conversations/messages tables
- Implement chat orchestration in `src/lib/ai/jeongjang-engine.ts`
  - `handleChatQuery(businessId, message)`: Parse intent, gather context, generate response
  - `buildChatContext(businessId)`: Aggregate all available business data
  - `saveConversation(businessId, message, response)`: Persist chat history
- Tags: REQ-J3-01, REQ-J3-02, REQ-J3-03, REQ-J3-04

### Optional Goal: Weekly Summary + Alert Integration

**Milestone 6: Weekly Summary and Urgent Alerts**
- Weekly summary generation (reuse briefing-generator with weekly aggregation)
- Urgent alert dispatch for negative reviews (integrate with Dapjangi alerts)
- Cash flow warning alerts (integrate with Seri anomaly detection)
- Tags: REQ-J4-02, REQ-J4-03

---

## Technical Approach

### Claude API Usage
- Briefing generation: Sonnet model, temperature 0.5, max_tokens 2000
- Chat responses: Sonnet model, streaming enabled, temperature 0.7, max_tokens 1000
- Diagnosis: Sonnet model, temperature 0.3, max_tokens 1500

### Solapi Integration
- Use `solapi` npm package for SDK access
- AlimTalk requires pre-registered templates with Solapi dashboard
- Template variables: `#{summary}`, `#{action_items}`, `#{deep_link}`
- SMS fallback message is a condensed version of the AlimTalk content
- Deep links format: `https://sajang.ai/dashboard?ref=alimtalk`

### Cron Architecture
- Supabase Edge Function deployed to `supabase/functions/daily-briefing/`
- pg_cron schedule: `0 23 * * *` (23:00 UTC = 08:00 KST)
- Function fetches all active businesses, processes sequentially with error isolation
- Timeout: 5 minutes per business, 30 minutes total

### Chat Streaming
- Use Next.js Route Handler with `ReadableStream` for SSE
- Claude API `stream: true` option for token-by-token response
- Client-side uses `useChat` pattern with EventSource or fetch streaming

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Cron function timeout for many businesses | Some briefings not sent | Batch processing with pagination; priority to active businesses |
| Solapi AlimTalk template rejection | Cannot send notifications | Pre-test templates in sandbox; maintain SMS fallback |
| store_context data stale or missing | Incomplete briefings | Graceful degradation; indicate missing data sections |
| Chat query misinterpreted | Wrong data returned | Intent classification step; clarification prompt when ambiguous |
| KakaoTalk delivery rate limit | Delayed notifications | Throttle sends; stagger briefing times across businesses |

---

## Dependencies

- SPEC-SERI-001: Revenue analysis data in store_context
- SPEC-DAPJANGI-001: Review insights in store_context
- SPEC-HYPHEN-001: Raw delivery/financial data from Hyphen API
- Solapi account: AlimTalk template registration and API credentials
- Supabase Edge Functions: pg_cron support for scheduled execution

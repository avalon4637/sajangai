# SPEC-JEONGJANG-001: Acceptance Criteria

## Traceability

| SPEC ID | Tag Range         |
| ------- | ----------------- |
| SPEC-JEONGJANG-001 | REQ-J1-01 ~ REQ-J4-05 |

---

## Test Scenarios

### AC-J1: Daily Briefing Generator

**AC-J1-01: Scheduled Briefing Generation** (REQ-J1-01, REQ-J1-05)

```gherkin
Given the daily cron triggers at 8:00 AM KST
And there are 5 active businesses
When the daily-briefing Edge Function executes
Then a briefing is generated for each of the 5 businesses
And each briefing is saved to the daily_reports table
And each record has the current date as report_date
```

**AC-J1-02: Multi-Source Data Combination** (REQ-J1-02)

```gherkin
Given Seri has written revenue analysis to store_context for business B1
And Dapjangi has written review insights to store_context for business B1
When the briefing generator runs for business B1
Then the briefing contains both revenue summary and review summary sections
And data from both agents is accurately reflected
```

**AC-J1-03: Structured Briefing Format** (REQ-J1-03)

```gherkin
Given a business with revenue data and review insights available
When a daily briefing is generated
Then the briefing follows the structure:
  | Section         | Example Content                              |
  | One-line summary | "Yesterday revenue up 8%, but 3 negative reviews" |
  | Revenue         | Revenue breakdown by channel                 |
  | Reviews         | Review summary with sentiment                |
  | Warnings        | Anomalies or concerning trends               |
  | Action Items    | Priority-ranked recommendations              |
```

**AC-J1-04: Natural Language Output** (REQ-J1-04)

```gherkin
Given revenue dropped 12% yesterday and delivery reject rate was 40%
When the briefing is generated
Then it reads: "Revenue dropped 12%, likely due to rain and 40% delivery reject rate"
And it does not read: "Revenue: -12%. Reject rate: 40%."
```

**AC-J1-05: Idempotent Report Generation**

```gherkin
Given a daily report already exists for business B1 on 2026-03-18
When the briefing generator runs again for B1 on the same date
Then the existing report is updated (not duplicated)
And only one record exists for (B1, 2026-03-18)
```

### AC-J2: Proactive Diagnosis

**AC-J2-01: Cross-Data Correlation** (REQ-J2-01)

```gherkin
Given review complaints about "portion size decreased" for business B1
And B1's food cost ratio increased by 15% in the same period
When proactive diagnosis runs
Then the system correlates the two data points
And generates insight: "Portion complaints may be linked to ingredient price increases"
```

**AC-J2-02: Anomaly Detection** (REQ-J2-02)

```gherkin
Given business B1's daily revenue is typically 500,000-700,000 KRW
When yesterday's revenue was 200,000 KRW
Then the system detects an anomaly
And generates a diagnostic alert with possible causes
```

**AC-J2-03: Priority-Ranked Action Items** (REQ-J2-03)

```gherkin
Given 3 insights generated for business B1
When action items are produced
Then each item has a priority level (High, Medium, Low)
And items are sorted by priority
And each item contains a specific actionable recommendation
```

**AC-J2-04: Normal Fluctuation Filter** (REQ-J2-04)

```gherkin
Given business B1's revenue fluctuates within 10% normally
When revenue is 5% lower than yesterday
Then no anomaly alert is generated
And the variation is treated as normal
```

### AC-J3: Chat Interface

**AC-J3-01: Natural Language Query** (REQ-J3-01, REQ-J3-04)

```gherkin
Given business B1 has Baemin commission data for March 2026
When the owner asks "How much was Baemin commission this month?"
Then the system responds with the exact commission amount
And includes context like month-over-month comparison
```

**AC-J3-02: Streaming Response** (REQ-J3-02)

```gherkin
Given a chat query is submitted via POST /api/chat
When the Claude API generates a response
Then the response is streamed token-by-token to the client
And the first token appears within 2 seconds
```

**AC-J3-03: Conversation History** (REQ-J3-03)

```gherkin
Given business B1 has an existing conversation with 5 messages
When the owner sends a new message
Then the response considers the conversation history
And the new message and response are saved to the messages table
And the conversation is scoped to business B1 only
```

### AC-J4: KakaoTalk Alert Integration

**AC-J4-01: Daily Briefing via AlimTalk** (REQ-J4-01)

```gherkin
Given a daily briefing is generated for business B1
When the notification is sent
Then it is delivered via KakaoTalk AlimTalk
And the message contains a summary of the briefing
And includes a deep link to https://sajang.ai/dashboard
And a message_logs record is created with channel "alimtalk" and status "sent"
```

**AC-J4-02: Urgent Alert Delivery** (REQ-J4-02)

```gherkin
Given a 1-star review is received for business B1
When the urgent alert is triggered
Then a KakaoTalk notification is sent within 5 minutes
And the message contains review details and a link to the review page
```

**AC-J4-03: SMS Fallback** (REQ-J4-04)

```gherkin
Given KakaoTalk AlimTalk delivery fails for business B1
When the fallback mechanism activates
Then an SMS is sent with a condensed version of the message
And message_logs records both the failed alimtalk and the sent sms
And the sms status is "fallback"
```

**AC-J4-04: Credential Security** (REQ-J4-05)

```gherkin
Given SOLAPI_API_KEY, SOLAPI_API_SECRET, and SOLAPI_PFID are set as environment variables
When the Solapi client initializes
Then credentials are read from environment variables only
And credentials are never exposed in client-side bundles
And credentials are never logged in application logs
```

---

## Quality Gates

| Gate                      | Criteria                                              |
| ------------------------- | ----------------------------------------------------- |
| Briefing Completeness     | All 5 sections present in every generated briefing    |
| Briefing Delivery         | 95%+ of briefings delivered by 8:15 AM KST            |
| Chat Response Latency     | First token streamed within 2 seconds                 |
| Chat Accuracy             | Correct data in 90%+ of factual queries               |
| AlimTalk Delivery Rate    | 90%+ successful delivery (with SMS fallback)          |
| Anomaly Precision         | <10% false positive rate on anomaly detection         |
| Test Coverage             | 85%+ coverage on all new files                        |
| RLS Compliance            | All queries scoped to authenticated business_id       |

---

## Definition of Done

- [ ] Daily briefing generated at 8:00 AM KST for all active businesses
- [ ] Briefing combines Seri revenue + Dapjangi review data
- [ ] Briefing uses natural language, not raw numbers
- [ ] Proactive diagnosis correlates cross-agent data
- [ ] Anomaly alerts fire only for significant deviations
- [ ] Chat endpoint streams responses from Claude API
- [ ] Chat stores conversation history per business
- [ ] KakaoTalk AlimTalk sends with deep link
- [ ] SMS fallback works when AlimTalk fails
- [ ] message_logs tracks all notification deliveries
- [ ] Solapi credentials secured in environment variables
- [ ] All database operations use RLS policies
- [ ] Test coverage >= 85% on new files
- [ ] No TypeScript errors, no ESLint warnings

# SPEC-SCREENS-001: Acceptance Criteria

## Traceability

| SPEC ID | Tag Range         |
| ------- | ----------------- |
| SPEC-SCREENS-001 | REQ-S1-01 ~ REQ-S4-02 |

---

## Test Scenarios

### AC-S1: Dashboard (/dashboard)

**AC-S1-01: Daily Briefing Display** (REQ-S1-01)

```gherkin
Given a daily_report exists for business B1 for today
When the owner navigates to /dashboard
Then the latest daily briefing is displayed in a card
And the card shows the one-line summary prominently
And the full briefing is expandable to show all sections
```

**AC-S1-02: Real-Time KPI Cards** (REQ-S1-02)

```gherkin
Given business B1 has monthly_summaries and live revenue data
When the owner views the dashboard
Then KPI cards display total revenue, total expense, net profit, and survival score
And values reflect real data, not hardcoded placeholders
And cards update when underlying data changes
```

**AC-S1-03: Action Items** (REQ-S1-03)

```gherkin
Given Jeongjang has generated 3 action items for business B1
When the owner views the dashboard
Then action items are displayed in priority order (High, Medium, Low)
And each item has a clear actionable description
```

**AC-S1-04: Agent Status Indicators** (REQ-S1-04)

```gherkin
Given Seri last ran 2 hours ago, Dapjangi 30 minutes ago, Viral never ran
When the owner views the dashboard
Then Seri shows green indicator with "2h ago"
And Dapjangi shows green indicator with "30m ago"
And Viral shows gray indicator with "Not active"
```

**AC-S1-05: Chat Input** (REQ-S1-05)

```gherkin
Given the owner is on the dashboard page
When the owner types a question and presses send
Then the message is sent to /api/chat
And a streaming response appears below the input
```

### AC-S2: Analysis (/analysis)

**AC-S2-01: Calendar Heatmap** (REQ-S2-01)

```gherkin
Given business B1 has revenue records for the past 30 days
When the owner navigates to /analysis
Then a calendar heatmap displays revenue intensity per day
And days with higher revenue show darker colors
And hovering a day shows the exact revenue amount
```

**AC-S2-02: Channel Breakdown** (REQ-S2-02)

```gherkin
Given business B1 has Baemin, Coupang Eats, and card sales data
When the owner views the analysis page
Then a chart shows revenue breakdown by channel
And each channel has a distinct color and label
And percentages are calculated from real data
```

**AC-S2-03: Day-of-Week Patterns** (REQ-S2-03)

```gherkin
Given business B1 has 6 weeks of historical revenue data
When the owner views day-of-week patterns
Then a bar chart shows average revenue per day of week
And the busiest and slowest days are highlighted
```

**AC-S2-04: AI Insight Card** (REQ-S2-04)

```gherkin
Given Seri has written analysis to store_context for business B1
When the owner views the analysis page
Then an AI insight card displays Seri's latest analysis
And the insight is in natural language format
```

### AC-S3: Review (/review)

**AC-S3-01: Review List** (REQ-S3-01)

```gherkin
Given business B1 has 25 reviews in delivery_reviews
When the owner navigates to /review
Then reviews are displayed in a paginated list
And each review shows: platform badge, rating stars, review text, date
And reviews are sortable by date, rating, and platform
```

**AC-S3-02: Sentiment Analysis Display** (REQ-S3-02)

```gherkin
Given reviews have been analyzed with sentiment_score and keywords
When the owner views a review
Then the sentiment score is displayed as a colored badge (-1.0 to 1.0)
And extracted keywords are shown as tags
And a sentiment trend chart is visible at the top of the page
```

**AC-S3-03: Reply Approval Queue** (REQ-S3-03)

```gherkin
Given 3 reviews have reply_status "pending"
When the owner views the reply queue section
Then 3 pending replies are shown with the AI-generated draft
And each has Approve, Edit, and Skip buttons
And approving a reply changes status to "published"
And skipping changes status to "skipped"
```

**AC-S3-04: Reply Status Tracking** (REQ-S3-04)

```gherkin
Given reviews have various reply statuses
When the owner views the review list
Then each review shows its reply status badge
And "auto" shows as green, "pending" as yellow, "published" as blue, "skipped" as gray
```

### AC-S4: Empty States

**AC-S4-01: Guided Empty State** (REQ-S4-01)

```gherkin
Given business B1 has no revenue data connected
When the owner navigates to /analysis
Then an empty state is displayed with:
  | Element     | Content                                    |
  | Icon        | Chart icon or illustration                 |
  | Title       | "No revenue data yet"                      |
  | Description | "Connect your delivery platforms to see analytics" |
  | CTA Button  | "Go to Settings" linking to /settings      |
```

**AC-S4-02: No Broken UI** (REQ-S4-02)

```gherkin
Given business B1 has no data in delivery_reviews
When the owner navigates to /review
Then no "undefined", "NaN", or broken chart errors are displayed
And the empty state component renders cleanly
And no console errors are thrown
```

---

## Quality Gates

| Gate                   | Criteria                                            |
| ---------------------- | --------------------------------------------------- |
| Page Load Time         | All pages load within 2 seconds (LCP < 2s)         |
| Mobile Responsive      | All pages render correctly on 375px-428px width     |
| Data Accuracy          | Displayed values match database records exactly     |
| Empty State Coverage   | Every data-dependent section has an empty state     |
| Chart Graceful Failure | Charts handle 0 data points without errors          |
| Accessibility          | All interactive elements keyboard navigable         |
| Test Coverage          | 85%+ coverage on new components                     |
| RLS Compliance         | All queries scoped to authenticated business_id     |

---

## Definition of Done

- [ ] Dashboard shows real daily briefing from daily_reports
- [ ] KPI cards display real data from monthly_summaries
- [ ] Action items from Jeongjang appear in dashboard
- [ ] Agent status indicators show real last-run times
- [ ] Chat input connects to /api/chat endpoint
- [ ] Calendar heatmap shows real revenue data
- [ ] Channel breakdown shows Hyphen-sourced data
- [ ] Review page lists real delivery_reviews
- [ ] Sentiment scores and keywords visible per review
- [ ] Reply approval queue works for pending replies
- [ ] Empty states guide users to settings for all pages
- [ ] No broken UI (undefined, NaN, errors) with missing data
- [ ] All pages load within 2 seconds
- [ ] Mobile responsive following pencil-new.pen designs
- [ ] Test coverage >= 85% on new components
- [ ] No TypeScript errors, no ESLint warnings

# SPEC-SCREENS-001: Implementation Plan

## Traceability

| SPEC ID | Tag Range         |
| ------- | ----------------- |
| SPEC-SCREENS-001 | REQ-S1-01 ~ REQ-S4-02 |

---

## Milestones

### Primary Goal: Dashboard with Real Data (S1)

**Milestone 1: Data Query Layer**
- Implement `src/lib/queries/daily-report.ts`
  - `getLatestBriefing(businessId)`: Fetch most recent daily_report
  - `getBriefingByDate(businessId, date)`: Fetch specific date report
- Implement `src/lib/queries/delivery-review.ts`
  - `getReviews(businessId, filters)`: Paginated review list with sentiment
  - `getPendingReplies(businessId)`: Reviews with reply_status "pending"
  - `getReviewStats(businessId)`: Aggregated review statistics
- Tags: REQ-S1-01, REQ-S3-01

**Milestone 2: Dashboard Components**
- Implement `src/components/dashboard/daily-briefing-card.tsx`
  - Display latest briefing summary, expandable for full content
  - Show report_date and freshness indicator
- Implement `src/components/dashboard/agent-status.tsx`
  - Display last run time for Seri, Dapjangi, Viral agents
  - Green/yellow/red indicator based on recency
- Implement `src/components/dashboard/action-items.tsx`
  - Priority-ranked list from daily_report.action_items
  - Checkable items for owner tracking
- Implement `src/components/dashboard/chat-input.tsx`
  - Text input with send button
  - Connect to POST /api/chat endpoint
  - Display streaming response inline
- Update `src/app/(dashboard)/dashboard/page.tsx`
  - Server Component fetches daily_reports, monthly_summaries, store_context
  - Pass real data to KPI cards and new components
- Tags: REQ-S1-01, REQ-S1-02, REQ-S1-03, REQ-S1-04, REQ-S1-05

### Secondary Goal: Analysis Page with Hyphen Data (S2)

**Milestone 3: Analysis Components**
- Update `src/app/(dashboard)/analysis/page.tsx`
  - Server Component fetches revenue records from Hyphen-synced data
  - Pass channel breakdown data to client components
- Update `src/app/(dashboard)/analysis/page-client.tsx`
  - Wire calendar heatmap to actual revenue records
  - Wire channel breakdown to Hyphen delivery + card data
  - Wire day-of-week patterns to historical data
- Update `src/components/analysis/*`
  - Replace mock data with real data props
  - Add loading states and error boundaries
  - Add AI insight card from Seri store_context
- Tags: REQ-S2-01, REQ-S2-02, REQ-S2-03, REQ-S2-04

### Final Goal: Review Page + Empty States (S3, S4)

**Milestone 4: Review Page**
- Implement `src/app/(dashboard)/review/page.tsx`
  - Server Component fetches delivery_reviews with sentiment data
- Implement `src/app/(dashboard)/review/page-client.tsx`
  - Client component for reply approval interactions
- Implement `src/components/review/review-list.tsx`
  - Review cards with platform badge, rating, sentiment keywords
  - Sortable by date, rating, platform, sentiment
- Implement `src/components/review/reply-queue.tsx`
  - Pending replies with edit/approve/skip actions
  - Inline editing of AI-generated draft replies
- Implement `src/components/review/sentiment-chart.tsx`
  - Sentiment score trend over time (Recharts line chart)
  - Keyword frequency breakdown (bar chart)
- Tags: REQ-S3-01, REQ-S3-02, REQ-S3-03, REQ-S3-04

**Milestone 5: Empty States**
- Implement `src/components/shared/empty-state.tsx`
  - Reusable component with icon, title, description, CTA button
  - CTA links to settings page for data source connection
- Apply empty states to all pages:
  - Dashboard: "Connect your business data to see daily briefings"
  - Analysis: "Connect Hyphen to see revenue analytics"
  - Review: "Connect delivery platforms to manage reviews"
- Tags: REQ-S4-01, REQ-S4-02

---

## Technical Approach

### Server-Client Component Split
- **Server Components**: All data fetching in page.tsx (zero client-side API calls for initial data)
- **Client Components**: Interactive elements only (chart interactions, reply editing, chat input)
- **Pattern**: Server fetches -> passes as props -> Client renders

### Chart Library (Recharts)
- Calendar heatmap: Custom implementation using Recharts ResponsiveContainer
- Channel breakdown: PieChart or BarChart with platform colors
- Day-of-week patterns: BarChart grouped by day
- Sentiment trend: LineChart with date axis

### Performance Strategy
- Use React Suspense boundaries for progressive loading
- Implement loading.tsx for page-level skeleton states
- Use `unstable_cache` or `cache()` for frequently accessed queries
- Lazy load charts below the fold

### Mobile Responsive
- Follow pencil-new.pen mobile designs
- Stack cards vertically on mobile
- Collapsible briefing card on small screens
- Swipeable review cards on mobile

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| daily_reports empty (Jeongjang not yet running) | Dashboard shows nothing useful | Empty state with explanation; show KPI cards even without briefing |
| Hyphen data not synced yet | Analysis page empty | Empty state guiding to Hyphen connection; show manual data if available |
| delivery_reviews empty | Review page empty | Empty state; show "Connect delivery platforms" CTA |
| Chart rendering slow with large datasets | Page load > 2 seconds | Pagination for reviews; date-range limiting for charts; virtualization |
| pencil-new.pen designs not pixel-perfect | Inconsistent mobile UX | Iterative design review with Tailwind responsive classes |

---

## Dependencies

- SPEC-JEONGJANG-001: daily_reports table and briefing content
- SPEC-SERI-001: store_context revenue analysis data
- SPEC-DAPJANGI-001: delivery_reviews with sentiment data
- SPEC-HYPHEN-001: Hyphen API revenue sync for channel breakdown
- SPEC-DASHBOARD-001: Existing KPI cards and chart components (extend, not replace)

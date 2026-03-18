# SPEC-DAPJANGI-001: Dapjangi AI Engine (Review Manager)

## Metadata

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| SPEC ID     | SPEC-DAPJANGI-001                                  |
| Title       | Dapjangi AI Engine - Review Response & Sentiment   |
| Created     | 2026-03-18                                         |
| Status      | Planned                                            |
| Priority    | High                                               |
| Phase       | 4                                                  |
| Lifecycle   | spec-anchored                                      |
| Related     | SPEC-SERI-001, SPEC-JEONGJANG-001, SPEC-HYPHEN-001 |

---

## Environment

- **Runtime**: Next.js 16 App Router, React 19, TypeScript 5.9
- **AI**: Claude API (Sonnet 4.6) via Anthropic SDK
- **Database**: Supabase PostgreSQL 16 with Row-Level Security
- **Data Source**: Hyphen API for delivery platform reviews (Baemin, Coupang Eats, Yogiyo), Naver Place reviews
- **Messaging**: Solapi SDK for KakaoTalk alerts on negative reviews
- **Auth**: Supabase Auth with business-scoped access

## Assumptions

- A1: Businesses have existing review replies (10-20 samples) to learn brand voice from
- A2: Hyphen API provides review data including review text, rating, platform, and timestamp
- A3: Claude API can reliably extract writing style traits from sample replies
- A4: Auto-published replies for positive reviews are acceptable without owner approval
- A5: Negative review alerts must be delivered within 5 minutes via KakaoTalk
- A6: Sentiment analysis runs on review ingestion, not on-demand
- A7: delivery_reviews table already exists from SPEC-DELIVERY-001 migration

---

## Requirements

### D1: Brand Voice Learning

**[REQ-D1-01]** WHEN a business owner initiates brand voice setup THEN the system shall collect 10-20 existing review replies as training samples.

**[REQ-D1-02]** WHEN training samples are collected THEN the system shall extract tone, expressions, and patterns using Claude API and store them as a brand voice profile.

**[REQ-D1-03]** The system shall always store one brand voice profile per business in the `brand_voice_profiles` table.

**[REQ-D1-04]** WHEN generating a review reply THEN the system shall match the owner's writing style based on the stored brand voice profile.

**[REQ-D1-05]** Where possible, the system shall allow owners to update their brand voice profile by adding new sample replies.

### D2: Auto-Reply System (Tiered Response)

**[REQ-D2-01]** WHEN a review with rating 4-5 stars is received THEN the system shall generate and auto-publish a reply without owner approval.

**[REQ-D2-02]** WHEN a review with rating 3 stars is received THEN the system shall generate a draft reply and require owner approval before publishing.

**[REQ-D2-03]** WHEN a review with rating 1-2 stars is received THEN the system shall instantly send a KakaoTalk alert to the owner, generate an empathetic draft reply, and require owner edit before publishing.

**[REQ-D2-04]** The system shall support reviews from Baemin, Coupang Eats, Yogiyo, and Naver Place platforms.

**[REQ-D2-05]** The system shall track reply status as one of: `auto`, `pending`, `published`, `skipped`.

**[REQ-D2-06]** The system shall not auto-publish replies for reviews with rating below 4 stars.

### D3: Cross-Platform Sentiment Analysis

**[REQ-D3-01]** WHEN reviews are ingested from any platform THEN the system shall aggregate them into a single unified view.

**[REQ-D3-02]** WHEN sentiment analysis runs THEN the system shall extract the most mentioned positive and negative keywords.

**[REQ-D3-03]** WHEN a keyword complaint frequency increases significantly THEN the system shall detect the trend (e.g., "portion complaints increased 3x this week").

**[REQ-D3-04]** The system shall always track sentiment scores over time on weekly and monthly intervals.

### D4: Review-to-Business Insight Bridge

**[REQ-D4-01]** WHEN review complaints map to operational metrics THEN the system shall correlate them (e.g., "slow delivery" complaints mapped to delivery reject rate).

**[REQ-D4-02]** WHEN insights are generated THEN the system shall feed them to the Jeongjang agent for inclusion in daily briefings.

**[REQ-D4-03]** Where possible, the system shall suggest actionable improvements based on review complaint patterns.

---

## Specifications

### New Files

| File                                        | Purpose                                   |
| ------------------------------------------- | ----------------------------------------- |
| `src/lib/ai/dapjangi-engine.ts`             | Core engine: orchestrates all D1-D4 flows |
| `src/lib/ai/dapjangi-prompts.ts`            | Prompt templates for voice/reply/analysis |
| `src/lib/ai/brand-voice.ts`                 | Brand voice learning and storage logic    |
| `src/lib/ai/sentiment-analyzer.ts`          | Cross-platform sentiment analysis         |
| `src/lib/ai/review-responder.ts`            | Auto-reply generation and tiered routing  |
| `supabase/migrations/00005_brand_voice.sql` | Brand voice profiles table migration      |

### Database Changes

**New table: `brand_voice_profiles`**

| Column        | Type      | Constraints                       |
| ------------- | --------- | --------------------------------- |
| id            | uuid      | PK, default gen_random_uuid()    |
| business_id   | uuid      | FK -> businesses, UNIQUE, NOT NULL|
| sample_replies| jsonb     | Array of sample reply texts       |
| voice_traits  | jsonb     | Extracted tone/style/patterns     |
| created_at    | timestamptz | default now()                   |
| updated_at    | timestamptz | default now()                   |

**Modified table: `delivery_reviews`** (add columns)

| Column          | Type      | Purpose                        |
| --------------- | --------- | ------------------------------ |
| ai_reply        | text      | Generated reply text           |
| reply_status    | text      | auto/pending/published/skipped |
| sentiment_score | float     | -1.0 to 1.0 sentiment value   |
| keywords        | jsonb     | Extracted keyword array        |

### Architecture

```
Review Ingestion (Hyphen API)
  |
  v
[sentiment-analyzer.ts] --> sentiment_score, keywords --> delivery_reviews
  |
  v
[review-responder.ts] --> Tiered routing (4-5: auto, 3: pending, 1-2: alert)
  |                              |
  v                              v
[brand-voice.ts] -------> [dapjangi-prompts.ts] --> Claude API --> ai_reply
  |
  v
[dapjangi-engine.ts] --> Orchestration + insight bridge to Jeongjang
```

### Constraints

- C1: Claude API calls must be rate-limited to avoid quota exhaustion
- C2: Auto-published replies must be indistinguishable from owner-written replies
- C3: All review data is business-scoped via RLS policies
- C4: Sentiment analysis must handle Korean text natively
- C5: Brand voice extraction must work with as few as 10 sample replies

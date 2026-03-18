# SPEC-DAPJANGI-001: Implementation Plan

## Traceability

| SPEC ID | Tag Range         |
| ------- | ----------------- |
| SPEC-DAPJANGI-001 | REQ-D1-01 ~ REQ-D4-03 |

---

## Milestones

### Primary Goal: Brand Voice Learning + Auto-Reply (D1, D2)

**Milestone 1: Database Schema**
- Create `supabase/migrations/00005_brand_voice.sql`
- Add `brand_voice_profiles` table with RLS policies
- Alter `delivery_reviews` to add `ai_reply`, `reply_status`, `sentiment_score`, `keywords` columns
- Tags: REQ-D1-03, REQ-D2-05

**Milestone 2: Brand Voice Engine**
- Implement `src/lib/ai/brand-voice.ts`
  - `collectSampleReplies(businessId)`: Fetch existing replies from delivery_reviews
  - `extractVoiceTraits(samples)`: Claude API call to analyze writing style
  - `saveBrandVoiceProfile(businessId, traits)`: Persist to brand_voice_profiles
  - `getBrandVoiceProfile(businessId)`: Retrieve stored profile
- Implement `src/lib/ai/dapjangi-prompts.ts`
  - `buildReplyPrompt(review, voiceTraits, tier)`: Construct reply generation prompt
  - `buildVoiceExtractionPrompt(samples)`: Construct voice analysis prompt
  - `buildSentimentPrompt(reviewText)`: Construct sentiment analysis prompt
- Tags: REQ-D1-01, REQ-D1-02, REQ-D1-04

**Milestone 3: Tiered Auto-Reply System**
- Implement `src/lib/ai/review-responder.ts`
  - `classifyReview(rating)`: Return tier (auto/pending/alert)
  - `generateReply(review, voiceProfile)`: Generate reply via Claude API
  - `autoPublishReply(reviewId, reply)`: Publish for 4-5 star reviews
  - `createDraftReply(reviewId, reply)`: Save as pending for 3 star reviews
  - `alertAndDraft(reviewId, reply, businessId)`: Send KakaoTalk alert for 1-2 star reviews
- Tags: REQ-D2-01, REQ-D2-02, REQ-D2-03, REQ-D2-06

### Secondary Goal: Sentiment Analysis (D3)

**Milestone 4: Sentiment Analyzer**
- Implement `src/lib/ai/sentiment-analyzer.ts`
  - `analyzeSentiment(reviewText)`: Return sentiment_score and keywords
  - `aggregateReviews(businessId, period)`: Cross-platform aggregation
  - `detectTrends(businessId)`: Identify keyword frequency changes
  - `getWeeklySummary(businessId)`: Weekly sentiment summary
  - `getMonthlySummary(businessId)`: Monthly sentiment summary
- Tags: REQ-D3-01, REQ-D3-02, REQ-D3-03, REQ-D3-04

### Final Goal: Engine Orchestration + Insight Bridge (D4)

**Milestone 5: Core Engine**
- Implement `src/lib/ai/dapjangi-engine.ts`
  - `processNewReview(review)`: Full pipeline: sentiment -> classify -> respond
  - `generateInsights(businessId)`: Map complaints to operational metrics
  - `feedToJeongjang(businessId, insights)`: Write insights to store_context
- Tags: REQ-D4-01, REQ-D4-02, REQ-D4-03

---

## Technical Approach

### Claude API Integration
- Use Anthropic SDK with streaming for reply generation
- System prompt includes brand voice traits for style matching
- Temperature: 0.7 for replies (creative but consistent), 0.3 for analysis (precise)
- Max tokens: 500 for replies, 1000 for sentiment analysis

### Rate Limiting
- Queue-based processing for review batches
- Maximum 10 Claude API calls per minute per business
- Retry with exponential backoff on rate limit errors

### Data Flow
1. Hyphen API syncs reviews to `delivery_reviews`
2. On new review insert, trigger sentiment analysis
3. Classify review by rating tier
4. Generate reply using brand voice profile
5. Route based on tier (auto-publish / pending / alert)
6. Aggregate insights for Jeongjang daily briefing

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Brand voice quality too low with few samples | Replies sound generic | Fallback to polite default style; prompt user for more samples |
| Claude API rate limits hit during review batch | Delayed replies | Queue system with priority for negative reviews |
| Auto-published reply contains inappropriate content | Reputation damage | Content safety check before auto-publish; profanity filter |
| Hyphen API review data format changes | Ingestion failure | Schema validation layer; graceful degradation |
| KakaoTalk alert delivery failure | Owner misses negative review | SMS fallback via Solapi; in-app notification |

---

## Dependencies

- SPEC-HYPHEN-001: Hyphen API integration for review data ingestion
- SPEC-DELIVERY-001: delivery_reviews table schema
- SPEC-JEONGJANG-001: Jeongjang agent for insight consumption
- Solapi SDK: KakaoTalk alert delivery (shared with SPEC-JEONGJANG-001)

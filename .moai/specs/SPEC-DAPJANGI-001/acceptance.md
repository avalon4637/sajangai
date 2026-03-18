# SPEC-DAPJANGI-001: Acceptance Criteria

## Traceability

| SPEC ID | Tag Range         |
| ------- | ----------------- |
| SPEC-DAPJANGI-001 | REQ-D1-01 ~ REQ-D4-03 |

---

## Test Scenarios

### AC-D1: Brand Voice Learning

**AC-D1-01: Voice Profile Creation** (REQ-D1-01, REQ-D1-02, REQ-D1-03)

```gherkin
Given a business owner with 15 existing review replies in delivery_reviews
When the owner initiates brand voice setup
Then the system collects the 15 replies as training samples
And extracts tone, expressions, and patterns via Claude API
And stores a brand_voice_profile record for that business
And the voice_traits JSON contains at least: tone, formality_level, common_expressions, greeting_style
```

**AC-D1-02: Voice-Matched Reply Generation** (REQ-D1-04)

```gherkin
Given a business with a stored brand voice profile containing casual tone and emoji usage
When a new 5-star review is received
Then the generated reply matches the owner's casual tone
And includes emoji patterns similar to sample replies
And reads naturally as if the owner wrote it
```

**AC-D1-03: Voice Profile Update** (REQ-D1-05)

```gherkin
Given a business with an existing brand voice profile
When the owner adds 5 new sample replies
Then the voice_traits are re-extracted including the new samples
And the updated_at timestamp is refreshed
```

### AC-D2: Tiered Auto-Reply System

**AC-D2-01: Positive Review Auto-Publish** (REQ-D2-01, REQ-D2-06)

```gherkin
Given a business with a brand voice profile
When a 5-star review is received from Baemin
Then a reply is generated matching the owner's voice
And the reply is auto-published without owner approval
And reply_status is set to "auto"
```

**AC-D2-02: Neutral Review Draft** (REQ-D2-02)

```gherkin
Given a business with a brand voice profile
When a 3-star review is received from Coupang Eats
Then a draft reply is generated
And reply_status is set to "pending"
And the owner can view and edit the draft in the review dashboard
And the reply is not published until owner approves
```

**AC-D2-03: Negative Review Alert** (REQ-D2-03)

```gherkin
Given a business with a brand voice profile and KakaoTalk configured
When a 1-star review is received from Yogiyo
Then a KakaoTalk alert is sent to the owner within 5 minutes
And an empathetic draft reply is generated
And reply_status is set to "pending"
And the owner must edit and approve before publishing
```

**AC-D2-04: Multi-Platform Support** (REQ-D2-04)

```gherkin
Given reviews from Baemin, Coupang Eats, Yogiyo, and Naver Place
When each review is processed by the auto-reply system
Then replies are generated for all four platforms
And platform-specific formatting is applied where needed
```

### AC-D3: Cross-Platform Sentiment Analysis

**AC-D3-01: Unified Review Aggregation** (REQ-D3-01)

```gherkin
Given a business with reviews across Baemin, Coupang Eats, and Naver Place
When the owner views the review dashboard
Then all reviews are displayed in a single unified list
And each review shows its source platform
And reviews are sortable by date, rating, and platform
```

**AC-D3-02: Keyword Extraction** (REQ-D3-02)

```gherkin
Given 50 reviews for a business over the past month
When sentiment analysis completes
Then the top 5 positive keywords are extracted (e.g., "맛있다", "친절")
And the top 5 negative keywords are extracted (e.g., "늦다", "양 적다")
And keywords are stored in the delivery_reviews.keywords column
```

**AC-D3-03: Trend Detection** (REQ-D3-03)

```gherkin
Given a business where "양 적다" keyword appeared 3 times last week and 9 times this week
When trend detection runs
Then the system identifies "양 적다 complaints increased 3x this week"
And the trend is flagged for inclusion in Jeongjang briefing
```

**AC-D3-04: Sentiment Score Tracking** (REQ-D3-04)

```gherkin
Given a business with reviews over 3 months
When the owner views sentiment analytics
Then weekly sentiment scores are displayed as a trend chart
And monthly sentiment scores are available for comparison
And sentiment_score values range from -1.0 to 1.0
```

### AC-D4: Review-to-Business Insight Bridge

**AC-D4-01: Complaint-to-Metric Mapping** (REQ-D4-01)

```gherkin
Given multiple reviews containing "배달 느림" complaints
And the business has delivery reject rate data from Hyphen
When the insight engine runs
Then it correlates "배달 느림" with elevated delivery reject rate
And generates an insight: "Slow delivery complaints may be linked to 40% reject rate"
```

**AC-D4-02: Jeongjang Integration** (REQ-D4-02)

```gherkin
Given the Dapjangi engine has generated 3 review insights for today
When Jeongjang generates the daily briefing
Then the briefing includes a review summary section
And all 3 insights are present in the briefing
And insights are formatted as actionable items
```

---

## Quality Gates

| Gate                    | Criteria                                                |
| ----------------------- | ------------------------------------------------------- |
| Brand Voice Accuracy    | Owner confirms reply "sounds like me" in 8/10 samples   |
| Auto-Reply Latency      | Reply generated within 30 seconds of review ingestion   |
| Negative Alert Latency  | KakaoTalk sent within 5 minutes of negative review      |
| Sentiment Accuracy      | Sentiment score within 0.2 of human-labeled baseline    |
| Keyword Relevance       | 80%+ of extracted keywords are meaningful to the owner  |
| Test Coverage           | 85%+ coverage on all new files                          |
| RLS Compliance          | All queries scoped to authenticated business_id         |

---

## Definition of Done

- [ ] Brand voice profile creation works with 10-20 sample replies
- [ ] Auto-replies for 4-5 star reviews publish without owner intervention
- [ ] 3-star reviews generate drafts requiring approval
- [ ] 1-2 star reviews trigger KakaoTalk alert within 5 minutes
- [ ] Sentiment analysis extracts keywords and scores from Korean text
- [ ] Trend detection identifies significant keyword frequency changes
- [ ] Review insights are written to store_context for Jeongjang consumption
- [ ] All database operations use RLS policies
- [ ] Test coverage >= 85% on new files
- [ ] No TypeScript errors, no ESLint warnings

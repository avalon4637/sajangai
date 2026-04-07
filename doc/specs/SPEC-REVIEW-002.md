# SPEC-REVIEW-002: Weekly Review Analysis & Report

## Goal
최근 200건 리뷰를 AI로 분석하여 주간 리포트 생성. 답장이가 "리뷰 수집기"에서 "리뷰 분석가"로 레벨업.

## Trigger
- 자동: 매주 월요일 오전 7시 (Cron)
- 수동: 답장이 페이지 "주간 분석 실행" 버튼

## 분석 대상
- delivery_reviews 테이블에서 해당 비즈니스의 최근 200건
- 이번 주 신규 리뷰 별도 카운트 (7일 이내)

## 분석 항목

### 1. 기본 통계
- 이번 주 신규 리뷰 수
- 긍정/중립/부정 비율
- 평균 별점 + 전주 대비 변화

### 2. 키워드 추출 (AI)
- 긍정 키워드 Top 5 (빈도수 포함)
- 부정 키워드 Top 5
- 신규 등장 키워드 (이전 분석 대비)

### 3. 트렌드 분석 (AI)
- 반복 불만 패턴 감지 (3회 이상 동일 키워드)
- 개선/악화 트렌드 (전주 대비)
- 계절적 패턴 (해당 시 언급)

### 4. 액션 제안 (AI)
- 불만 기반 개선 제안 (구체적)
- 긍정 키워드 기반 마케팅 포인트
- 미답변 리뷰 알림

## 데이터 흐름

```
Cron (월요일 7AM) 또는 수동 트리거
    ↓
fetchRecentReviews(businessId, 200)
    ↓
AI 분석 (Claude Sonnet)
- System: 리뷰 분석 전문가 프롬프트
- Input: 200건 리뷰 (별점, 내용, 날짜, 플랫폼)
- Output: JSON (stats, keywords, trends, actions)
    ↓
DB 저장 (daily_reports 테이블, report_type="review_weekly")
    ↓
카카오톡 알림 (요약 + 딥링크)
    ↓
앱 내 표시 (답장이 페이지 상단 카드)
```

## 구현 파일

### 신규
- `src/lib/ai/review-analyzer.ts` — AI 분석 로직 + 프롬프트
- `src/app/api/cron/weekly-review/route.ts` — Cron 트리거
- `src/components/dapjangi/weekly-report-card.tsx` — UI 카드

### 수정
- `src/app/(dashboard)/review/page-client.tsx` — 주간 리포트 카드 표시
- `src/lib/messaging/sender.ts` — 주간 리뷰 리포트 알림톡 추가

## AI 프롬프트 설계

```
System: 당신은 F&B 소상공인 리뷰 분석 전문가입니다.
200건의 고객 리뷰를 분석하여 사장님이 즉시 행동할 수 있는 인사이트를 도출하세요.

규칙:
- 숫자와 근거를 반드시 포함
- "양이 적다" 같은 불만은 횟수와 함께 보고
- 긍정 키워드는 마케팅 활용 포인트와 함께 제안
- 전문 용어 대신 사장님이 이해할 수 있는 말로
- JSON 형식으로 구조화된 응답

Output JSON:
{
  "summary": "이번 주 리뷰 한줄 요약",
  "stats": { newCount, positiveCount, negativeCount, neutralCount, avgRating, ratingChange },
  "positiveKeywords": [{ keyword, count, example }],
  "negativeKeywords": [{ keyword, count, example }],
  "trends": [{ type: "improving"|"declining"|"new", description }],
  "actions": [{ priority: 1-3, action, reason, expectedImpact }],
  "marketingPoints": [{ keyword, suggestion }]
}
```

## Acceptance Criteria
- [ ] 200건 리뷰 AI 분석 완료 (30초 이내)
- [ ] 주간 리포트 JSON DB 저장
- [ ] 답장이 페이지에 리포트 카드 표시
- [ ] 카카오톡 주간 리뷰 알림 발송
- [ ] 수동 트리거 버튼 동작

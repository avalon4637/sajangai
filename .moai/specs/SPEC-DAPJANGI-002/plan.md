# SPEC-DAPJANGI-002 Implementation Plan

<!-- TAG: SPEC-DAPJANGI-002 -->

## Overview

답장이 감성 분석 파이프라인 구축 및 일괄 AI 답글 생성/게시 UX를 구현한다.

---

## Phases

### Phase 1: 감성 분석 파이프라인 (Primary Goal)

- **TASK-01**: 감성 분석 프롬프트 작성 (`src/lib/agents/prompts/sentiment.ts`)
  - 입력: 리뷰 텍스트
  - 출력: sentiment_score (0.0~1.0), sentiment_label (positive/neutral/negative), keywords[]
- **TASK-02**: 감성 분석 Server Action (`src/lib/actions/reviews.ts`)
  - `analyzeSentiment(reviewId)`: 개별 리뷰 감성 분석
  - `batchAnalyzeSentiment()`: `sentiment_score IS NULL` 건 일괄 분석
- **TASK-03**: DB 스키마 확인
  - reviews 테이블에 `sentiment_score`, `sentiment_label` 컬럼 존재 확인
  - 없으면 migration 추가

### Phase 2: 일괄 답글 생성 (Primary Goal)

- **TASK-04**: 답글 생성 프롬프트 작성 (`src/lib/agents/prompts/reply.ts`)
  - 컨텍스트: 리뷰 내용, 감성, 매장 정보
  - 출력: 친절하고 전문적인 답글 초안
- **TASK-05**: 일괄 답글 생성 API (`src/app/api/agents/dapjangi/batch-reply/`)
  - POST: 미답변 리뷰 ID 목록 → AI 답글 초안 배열 반환
- **TASK-06**: 일괄 답글 저장 Server Action
  - `saveBatchReplies(replies[])`: 선택된 답글 일괄 저장

### Phase 3: UI 구현 (Primary Goal)

- **TASK-07**: 미답변 리뷰 목록 + 일괄 답글 UI
  - 리뷰 카드: 원본 리뷰 + 감성 뱃지 + AI 초안 + 수정 영역
  - "일괄 답글 생성" 버튼 (상단)
  - "일괄 게시" 버튼 (하단, 체크박스 선택)
- **TASK-08**: 답글 검토/수정 인터랙션
  - 각 카드에서 AI 초안 직접 편집 가능
  - 체크박스로 게시 대상 선택/해제

### Phase 4: 감성 기반 필터링 (Secondary Goal)

- **TASK-09**: 리뷰 목록에 감성 필터 추가 (긍정/중립/부정 탭 또는 드롭다운)
- **TASK-10**: 감성 뱃지 컴포넌트 (초록: 긍정, 회색: 중립, 빨강: 부정)

## Affected Files

### 신규 생성

- `src/lib/agents/prompts/sentiment.ts`
- `src/lib/agents/prompts/reply.ts`
- `src/app/api/agents/dapjangi/batch-reply/route.ts`
- `src/components/agents/dapjangi/batch-reply-panel.tsx`
- `src/components/agents/dapjangi/review-reply-card.tsx`
- `src/components/agents/dapjangi/sentiment-badge.tsx`

### 수정

- `src/lib/actions/reviews.ts` - 감성 분석 + 일괄 답글 액션 추가
- `src/components/agents/dapjangi/` - 기존 답장이 UI에 일괄 답글 진입점 추가

## Risk Assessment

- **Medium Risk**: Claude API 호출 비용 - 배치 처리 시 Haiku 모델 사용으로 완화
- **Medium Risk**: 답글 품질 - 프롬프트 튜닝 필요, 사용자 검토 과정으로 리스크 완화
- **Low Risk**: 감성 분석 정확도 - LLM 기반이므로 대부분의 한국어 리뷰에 높은 정확도 기대

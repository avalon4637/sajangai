---
id: SPEC-DAPJANGI-002
version: "1.0.0"
status: done
created: "2026-04-05"
updated: "2026-04-05"
author: avalon4637
priority: P1
---

# SPEC-DAPJANGI-002: 답장이 감성 분석 파이프라인 + 일괄 답글

## HISTORY

| 버전  | 날짜       | 작성자     | 변경 내용 |
| ----- | ---------- | ---------- | --------- |
| 1.0.0 | 2026-04-05 | avalon4637 | 초기 작성 |

---

## Overview

- **Title**: 답장이 감성 분석 파이프라인 + 일괄 답글
- **Status**: Planned
- **Priority**: P1 (core feature)
- **Estimated Effort**: L

## Problem Statement

두 가지 핵심 문제가 있다:

1. **감성 분석 미연동 (1-5)**: 리뷰 데이터가 DB에 존재하지만 `sentiment_score` 컬럼이 모두 null이다. 감성 분석 파이프라인이 구현되어 있지 않거나 연동되지 않은 상태다. 이로 인해 부정 리뷰 자동 감지, 리뷰 트렌드 분석 등 AI 답장이의 핵심 기능이 작동하지 않는다.
2. **일괄 AI 답글 UX 부재 (2-7)**: 미답변 리뷰가 쌓이면 하나씩 답글을 작성해야 하는 불편함이 있다. AI가 일괄로 답글 초안을 생성하고, 사용자가 검토 후 한 번에 게시할 수 있는 UX가 필요하다.

## Requirements

### Must Have

1. **WHEN** 새로운 리뷰가 DB에 저장될 **THEN** 감성 분석이 실행되어 `sentiment_score` (0.0~1.0)이 저장되어야 한다
2. **WHEN** 감성 분석이 완료될 **THEN** 리뷰에 `sentiment_label` (positive/neutral/negative)이 태깅되어야 한다
3. 시스템은 **항상** 기존 리뷰 중 `sentiment_score`가 null인 건에 대해 배치 감성 분석을 실행할 수 있어야 한다
4. **WHEN** 사용자가 "일괄 답글 생성" 버튼을 클릭할 **THEN** 미답변 리뷰 전체에 대해 AI 답글 초안이 생성되어야 한다
5. **WHEN** AI 답글 초안이 생성될 **THEN** 각 리뷰별로 초안을 검토/수정할 수 있는 UI가 표시되어야 한다
6. **WHEN** 사용자가 "일괄 게시" 버튼을 클릭할 **THEN** 선택된 답글이 일괄로 저장되어야 한다
7. 시스템은 감성 분석에 **실패**하더라도 리뷰 데이터 자체에 영향을 주지 않아야 한다

### Nice to Have

8. 감성 분석 결과를 기반으로 리뷰 목록 필터링 (긍정/중립/부정)
9. 답글 초안 생성 시 매장의 톤앤매너 설정 반영
10. 답글 템플릿 라이브러리 (자주 쓰는 답글 저장)

## Technical Notes

### 감성 분석 파이프라인

- **접근법**: Claude API를 사용한 감성 분석 (별도 ML 모델 불필요)
- **프롬프트**: 리뷰 텍스트 → sentiment_score(0.0~1.0) + sentiment_label + 키워드 추출
- **배치 처리**: `sentiment_score IS NULL` 조건으로 미분석 리뷰 일괄 처리
- **비용 최적화**: Haiku 모델 사용 (감성 분석은 경량 태스크)

### 일괄 답글 생성

- **AI 모델**: Claude Sonnet으로 답글 초안 생성 (품질 중시)
- **프롬프트 컨텍스트**: 리뷰 내용 + 감성 + 매장 정보 + 이전 답글 패턴
- **UI**: 리뷰 카드 리스트 형태, 각 카드에 원본 리뷰 + AI 초안 + 수정 영역

### 영향 파일

- `src/lib/agents/prompts/` - 감성 분석/답글 생성 프롬프트
- `src/lib/actions/reviews.ts` - 리뷰 관련 Server Actions
- `src/app/api/agents/dapjangi/` - 답장이 API 엔드포인트
- `src/components/agents/dapjangi/` - 답장이 UI 컴포넌트
- `supabase/migrations/` - sentiment_score, sentiment_label 컬럼 확인/추가

## Dependencies

- Claude API (ANTHROPIC_API_KEY) - 감성 분석 및 답글 생성
- Agent DB 테이블 (00002 migration) - reviews 테이블 존재
- SPEC-DAPJANGI-001 (답장이 기본 구조) - Done

## Exclusions (What NOT to Build)

- Shall NOT implement 외부 플랫폼(배달앱)에 직접 답글 게시 (reason: API 연동은 SPEC-DELIVERY-001 범위)
- Shall NOT implement 실시간 리뷰 수집 파이프라인 (reason: 데이터 수집은 SPEC-CONNECT-001 범위)
- Shall NOT implement 별도 ML 감성 분석 모델 학습 (reason: LLM API로 충분)

---
id: SPEC-AI-001
version: "1.0.0"
status: draft
created: "2026-02-20"
priority: P1
depends_on:
  - SPEC-DASHBOARD-001
---

# SPEC-AI-001: AI 경영 분석 인사이트

## 개요

Claude Sonnet 4.5를 활용한 AI 경영 분석 기능을 대시보드에 통합한다. 기존 `src/app/api/ai/route.ts` 엔드포인트를 활용하여 현재 KPI 기반 경영 인사이트를 스트리밍 방식으로 제공한다.

## 범위

- 대시보드에 AI 분석 패널/위젯 추가
- KPI 데이터 기반 자동 분석 요청
- Claude 스트리밍 응답 실시간 표시
- 분석 내용: 경영 현황 해석, 리스크 경고, 개선 제안

## 범위 제외

- 대화형 AI 챗봇 (채팅 인터페이스)
- 분석 결과 저장/이력 관리
- 다중 월 비교 분석

---

## Requirements (EARS)

### REQ-01: AI 분석 위젯

**Ubiquitous:**
- 시스템은 대시보드에 "AI 경영 분석" 위젯을 표시해야 한다.
- 위젯은 shadcn/ui Card 내에 표시되어야 한다.

### REQ-02: 분석 요청

**Event-Driven:**
- WHEN 사용자가 "AI 분석 시작" 버튼을 클릭하면 THEN 시스템은 현재 월의 KPI 데이터를 `/api/ai` 엔드포인트에 전송해야 한다.

**State-Driven:**
- IF 현재 월의 KPI 데이터가 없으면 THEN "데이터를 먼저 입력해주세요" 메시지를 표시해야 한다.

### REQ-03: 스트리밍 응답 표시

**Ubiquitous:**
- 시스템은 Claude의 응답을 실시간으로 스트리밍하여 표시해야 한다.
- 응답은 마크다운 형식으로 렌더링되어야 한다.

**State-Driven:**
- IF 스트리밍 중이면 THEN 로딩 인디케이터를 표시해야 한다.
- IF 분석이 완료되면 THEN "다시 분석" 버튼을 표시해야 한다.
- IF API 오류가 발생하면 THEN 사용자에게 오류 메시지를 표시해야 한다.

### REQ-04: 분석 내용 구성

**Ubiquitous:**
- AI 분석은 다음을 포함해야 한다:
  - 경영 상태 요약 (현황 해석)
  - 리스크 경고 (수익성 악화, 비용 과중 등)
  - 실행 가능한 개선 제안 (1~2개)

---

## 기존 인프라

- `src/app/api/ai/route.ts`: POST 엔드포인트 (Claude Sonnet 4.5 스트리밍)
- `@ai-sdk/anthropic`: Anthropic SDK
- `ai` (Vercel AI SDK): streamText(), useChat() hook 사용 가능
- `src/lib/kpi/calculator.ts`: KpiResult 타입

<!-- TAG: SPEC-AI-001 -->

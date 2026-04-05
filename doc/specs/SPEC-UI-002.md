# SPEC-UI-002: UI Completeness + Navigation + Process Connectivity

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-UI-002 |
| Title | UI 전면 개선: 네비게이션 + Dead Page 연결 + 프로세스 검증 |
| Priority | P0 |
| Source | UI Expert Agent Audit (2026-04-03) |
| Status | Active |

## Key Finding
"엔진은 있고 UI가 빠졌다" — 백엔드 기능은 완성되었으나 프론트엔드에서 접근 불가한 페이지가 다수.

## Milestones

### M1: Navigation Fix (Dead Pages 연결)
- /settings 페이지에 하위 탭/카드 (connections, budget, loans)
- 모바일 헤더 동적화 (사용자명, 구독상태, 데이터 입력 링크)
- 온보딩 → preferences 흐름 연결 확인
- not-found.tsx 생성

### M2: Simulation + Cashflow UI 연결
- /analysis 페이지에 시뮬레이션 탭 추가 (기존 컴포넌트 연결)
- run_simulation 인사이트 액션이 실제로 시뮬레이션 UI로 이동

### M3: UX Polish
- Toast 알림 시스템 (shadcn sonner)
- loading.tsx (Skeleton 대체)

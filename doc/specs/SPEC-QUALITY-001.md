# SPEC-QUALITY-001: Test Coverage + Code Quality + Data Integrity

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-QUALITY-001 |
| Title | 품질 강화: 테스트 보강 + 코드 정리 + 데이터 무결성 |
| Priority | P2 |
| Source | doc/TODO.md P2 섹션 |
| Status | Active |

## Milestones

### M1: Core Unit Tests
- Insight scenarios (A1~A3, B1~B2): trigger + no-trigger 케이스
- Insight engine: 레지스트리, 실행, 에러 격리, 카테고리 스킵
- ROI calculator: 각 항목별 계산 검증

### M2: Code Quality
- Supabase 타입 재생성 (as any 제거)
- 주요 catch {} 블록 에러 로깅 추가
- 미구현 TODO 함수 정리

### M3: Data Integrity
- businesses 테이블 user_id UNIQUE 제약
- upsertInsight 레이스 컨디션 수정
- vercel.json cron schedule 정리

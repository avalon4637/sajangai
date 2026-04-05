# SPEC-QUALITY-002: Code Quality & Test Coverage

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-QUALITY-002 |
| Title | 코드 품질 강화 — 테스트 + 타입 + 에러 처리 |
| Priority | P2 (품질 강화) |
| Status | Defined |
| Estimated | 1~2일 |

## Background

현재 139개 테스트 존재하나 인사이트 엔진, ROI 계산기 등 핵심 비즈니스 로직 테스트 부족.
catch {} silent fail 51건, as any 10건 존재.

## Acceptance Criteria

### AC-1: 핵심 비즈니스 로직 테스트
- 인사이트 시나리오 단위 테스트 (A1~A3, B1~B2 각 trigger/no-trigger)
- ROI 계산기 테스트 (각 항목별 계산 검증)
- 인사이트 엔진 테스트 (레지스트리, 실행, dedup, 에러 격리)
- 채팅 메모리 테스트 (추출 + 주입)

### AC-2: 타입 안전성
- supabase gen types 실행 → database.types.ts 갱신
- as any 10건 제거 → 실제 타입으로 교체

### AC-3: 에러 처리 정리
- 주요 API 라우트 catch {} → catch (err) { console.error(err) } (최소 20건)
- TODO/미구현 함수 정리 (rent-benchmark.ts, commercial-zone.ts)

### AC-4: 데이터 무결성
- businesses.user_id UNIQUE 제약 추가
- upsertInsight DELETE+INSERT → 트랜잭션 또는 upsert 변경
- vercel.json cron schedule 실제 동작 확인

## Out of Scope
- E2E 테스트 (별도 SPEC)
- 부하 테스트 (런칭 후)
- 새 기능 개발

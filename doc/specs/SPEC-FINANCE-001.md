# SPEC-FINANCE-001: Financial Agent Enhancement

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-FINANCE-001 |
| Title | 재무 에이전트 고도화 — 엑셀 가계부 흡수 |
| Phase | Phase 3 (추가) |
| Priority | P0 |
| Source | doc/template_excel/financial-agent-spec.md |
| Status | Active |

## Strategy

기존 DB 구조(revenues/expenses/fixed_costs 분리)를 유지하면서 빠진 테이블과 SQL 뷰/함수를 추가.
통합 transactions 테이블 마이그레이션은 별도 SPEC으로 분리 (리스크 관리).

## Milestones

### M1: Missing Tables (대출 + 예산 + 입출금)
- loans + loan_repayments 테이블 + RLS
- budgets 테이블 + RLS
- cashflow_entries 테이블 + RLS
- v_loan_balance 뷰

### M2: KPI SQL Functions + Views
- v_monthly_unified (revenues+expenses+fixed_costs 통합 뷰)
- v_category_monthly (대분류/소분류별 월별 집계)
- calculate_category_ranking() 함수
- calculate_daily_cumulative() 함수 (7일 이동평균 포함)
- v_budget_vs_actual 뷰

### M3: Enhanced KPI Calculator + UI
- RankingKPI 계산 (카테고리 랭킹)
- TrendKPI 계산 (일별 누적, 7일 이동평균)
- 대출 현황 API
- 예산 CRUD API + 예산 vs 실적 UI

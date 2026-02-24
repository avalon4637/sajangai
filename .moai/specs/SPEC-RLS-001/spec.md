---
id: SPEC-RLS-001
version: "1.0.0"
status: ready
created: "2026-02-24"
priority: P1
depends_on: []
---

# SPEC-RLS-001: Supabase RLS 정책 검증

## 개요

sajang.ai의 모든 Supabase 테이블에 대해 Row Level Security(RLS) 정책을 점검하고, 다른 사용자의 데이터에 접근할 수 없도록 보안을 검증한다. 프로덕션 배포 전 필수 보안 작업이다.

## 범위

- 전체 테이블 RLS 활성화 여부 점검
- 각 테이블별 SELECT/INSERT/UPDATE/DELETE 정책 검증
- 사용자 간 데이터 격리 확인
- 누락된 RLS 정책 추가
- RLS 정책 문서화

## 범위 제외

- 애플리케이션 레벨 권한 관리 (RBAC)
- API Rate Limiting
- CORS 설정

---

## Requirements (EARS)

### REQ-01: RLS 활성화 점검

**Ubiquitous:**
- 시스템의 모든 데이터 테이블에 RLS가 활성화되어 있어야 한다:
  - `businesses`
  - `revenues`
  - `expenses`
  - `fixed_costs`
  - `monthly_summaries`
  - `csv_uploads`

### REQ-02: 데이터 격리 정책

**Ubiquitous:**
- 각 테이블은 다음 기본 정책을 준수해야 한다:
  - SELECT: 자신의 business_id에 해당하는 데이터만 조회 가능
  - INSERT: 자신의 business_id로만 데이터 생성 가능
  - UPDATE: 자신의 business_id에 해당하는 데이터만 수정 가능
  - DELETE: 자신의 business_id에 해당하는 데이터만 삭제 가능

### REQ-03: businesses 테이블 정책

**Ubiquitous:**
- `businesses` 테이블은 `auth.uid() = user_id` 조건으로 접근 제어해야 한다.
- 사용자는 자신의 사업체 정보만 조회/수정 가능해야 한다.

### REQ-04: 하위 테이블 정책

**Ubiquitous:**
- `revenues`, `expenses`, `fixed_costs`, `monthly_summaries`, `csv_uploads` 테이블은 `business_id`를 통해 접근 제어해야 한다.
- 정책 조건: `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())`

### REQ-05: 서비스 키 접근

**Ubiquitous:**
- 서버 사이드(Server Actions)에서 service_role key를 사용하는 경우, RLS를 바이패스할 수 있어야 한다.
- 클라이언트 사이드에서는 반드시 anon key + RLS를 통해 접근해야 한다.

---

## 기술 설계

### RLS 정책 패턴

```sql
-- businesses 테이블 (user_id 직접 참조)
CREATE POLICY "Users can view own businesses"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

-- 하위 테이블 (business_id를 통한 간접 참조)
CREATE POLICY "Users can view own revenues"
  ON revenues FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );
```

### 점검 절차

1. Supabase 대시보드에서 각 테이블 RLS 활성화 상태 확인
2. 기존 정책 목록 확인 (SQL: `SELECT * FROM pg_policies`)
3. 누락된 정책 식별 및 추가
4. 테스트 시나리오로 격리 검증

### 검증 SQL

```sql
-- RLS 활성화 상태 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 정책 목록 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### 산출물

- RLS 정책 SQL 마이그레이션 파일: `supabase/migrations/xxx_rls_policies.sql`
- RLS 정책 현황 문서

---

## 수용 기준

- [ ] 6개 테이블 모두 RLS 활성화 확인
- [ ] 각 테이블 SELECT/INSERT/UPDATE/DELETE 정책 존재
- [ ] 사용자 A가 사용자 B의 데이터 접근 불가 검증
- [ ] anon key로 직접 API 호출 시 타인 데이터 차단 확인
- [ ] RLS 정책 SQL 마이그레이션 파일 생성

<!-- TAG: SPEC-RLS-001 -->

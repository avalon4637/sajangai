---
id: SPEC-INFRA-001
version: "1.0.0"
status: ready
created: "2026-02-24"
priority: P1
depends_on: []
blocks:
  - SPEC-CONNECT-001
  - SPEC-DELIVERY-001
---

# SPEC-INFRA-001: 하이픈 API 연동 인프라 선행 구축

## 개요

하이픈(HYPHEN) API 마켓과 통신하기 위한 공통 인프라를 API Key 발급 전에 선행 구축한다. 클라이언트 모듈, DB 스키마, 설정 페이지 UI를 미리 만들어 API Key 발급 후 즉시 실제 연동을 시작할 수 있도록 준비한다.

## 결정 사항

- SPEC-CONNECT-001, SPEC-DELIVERY-001에서 공유하는 공통 인프라
- API Key 없이 구축 가능한 범위만 포함
- 실제 API 호출은 SPEC-CONNECT-001에서 구현

## 범위

- 하이픈 API 공통 클라이언트 모듈 (`src/lib/hyphen/client.ts`)
- DB 스키마 확장 (`api_connections`, `sync_logs` 테이블)
- 설정 페이지 UI (`/settings/connect` - API 연결 관리)
- 환경변수 구조 (`HYPHEN_API_KEY`)
- 에러 핸들링 패턴

## 범위 제외

- 실제 하이픈 API 호출 (API Key 필요)
- 카드매출 동기화 로직 (SPEC-CONNECT-001)
- 배달앱 동기화 로직 (SPEC-DELIVERY-001)

---

## Requirements (EARS)

### REQ-01: 공통 API 클라이언트

**Ubiquitous:**
- 시스템은 하이픈 API와 통신하기 위한 공통 클라이언트를 제공해야 한다.
- 클라이언트는 다음 기능을 포함해야 한다:
  - API Key 기반 인증 헤더 설정
  - 요청/응답 타입 안전성 (TypeScript 제네릭)
  - 에러 응답 처리 (4xx, 5xx, 네트워크 오류)
  - 요청 재시도 (최대 3회, 지수 백오프)
  - 요청/응답 로깅 (개발 모드)

### REQ-02: DB 스키마 확장

**Ubiquitous:**
- 시스템은 API 연결 상태를 관리하는 `api_connections` 테이블을 제공해야 한다:
  - business_id (FK → businesses)
  - provider: "hyphen"
  - connection_type: "card_sales" | "delivery"
  - status: "active" | "inactive" | "error" | "expired"
  - config: JSONB (암호화된 설정)
  - last_synced_at: timestamp
  - created_at, updated_at

- 시스템은 동기화 이력을 관리하는 `sync_logs` 테이블을 제공해야 한다:
  - connection_id (FK → api_connections)
  - sync_type: "card_sales" | "delivery"
  - status: "pending" | "running" | "completed" | "failed"
  - records_count: integer
  - error_message: text (nullable)
  - started_at, completed_at

### REQ-03: 설정 페이지 UI

**Ubiquitous:**
- 시스템은 `/settings` 경로에 API 연결 관리 페이지를 제공해야 한다.
- 페이지는 다음을 표시해야 한다:
  - 현재 연결 상태 (카드매출, 배달앱 각각)
  - 연결/해제 버튼
  - 마지막 동기화 일시
  - 동기화 이력 (최근 10건)

**State-Driven:**
- IF API Key가 설정되지 않았으면 THEN 설정 안내 메시지를 표시해야 한다.
- IF 연결이 활성화되어 있으면 THEN 동기화 버튼과 이력을 표시해야 한다.

### REQ-04: 환경변수 구조

**Ubiquitous:**
- 시스템은 다음 환경변수를 지원해야 한다:
  - `HYPHEN_API_KEY`: 하이픈 API 인증 키 (서버 전용, NEXT_PUBLIC_ 접두사 없음)
- `.env.local.example`에 환경변수 템플릿을 추가해야 한다.

### REQ-05: 사이드바 네비게이션

**Ubiquitous:**
- 사이드바에 "설정" 메뉴를 추가해야 한다.
  - 아이콘: Settings (lucide-react)
  - 경로: `/settings`
  - 위치: 사이드바 하단

---

## 기술 설계

### 파일 구조

```
src/
  lib/
    hyphen/
      client.ts          # 공통 API 클라이언트
      types.ts           # 하이픈 API 타입 정의
  actions/
    connection.ts        # 연결 관리 Server Actions
  queries/
    connection.ts        # 연결 상태 조회
  app/
    (dashboard)/
      settings/
        page.tsx         # 설정 메인 페이지
        connect/
          page.tsx       # API 연결 관리
  components/
    settings/
      connection-card.tsx    # 연결 상태 카드
      sync-history.tsx       # 동기화 이력 테이블
```

### 공통 클라이언트 설계

```typescript
// src/lib/hyphen/client.ts 인터페이스
interface HyphenClient {
  get<T>(endpoint: string, params?: Record<string, string>): Promise<T>
  post<T>(endpoint: string, body: unknown): Promise<T>
}

interface HyphenConfig {
  apiKey: string
  baseUrl: string
  timeout: number
  retries: number
}
```

### DB 마이그레이션

- 파일: `supabase/migrations/xxx_api_connections.sql`
- api_connections + sync_logs 테이블 생성
- RLS 정책 포함 (business_id 기반)
- 인덱스: business_id, provider, status

---

## 수용 기준

- [ ] `src/lib/hyphen/client.ts` 공통 클라이언트 구현 (타입 안전, 에러 핸들링, 재시도)
- [ ] `api_connections`, `sync_logs` DB 마이그레이션 SQL 생성
- [ ] `/settings` 설정 페이지 UI 구현 (연결 상태, 동기화 이력)
- [ ] 사이드바에 설정 메뉴 추가
- [ ] `.env.local.example`에 HYPHEN_API_KEY 추가
- [ ] 공통 클라이언트 단위 테스트 (모킹 기반)
- [ ] TypeScript 컴파일 에러 0건

<!-- TAG: SPEC-INFRA-001 -->

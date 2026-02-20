---
id: SPEC-CONNECT-001
type: plan
version: "1.0.0"
---

# SPEC-CONNECT-001 구현 계획: 카드매출 자동 연계

## 개요

여신금융협회 Open API 또는 중개 API 플랫폼을 통해 카드사 매출 데이터를 자동 조회하여 sajang.ai에 연계한다.

---

## 선행 과제 (구현 전 필요)

1. **API 플랫폼 선정**: 여신금융협회 직접 연동 vs 하이픈/CODEF 중개 플랫폼
2. **계약/심사**: 핀테크 기업 등록 (여신금융협회) 또는 API 구독 계약 (중개 플랫폼)
3. **보안 설계**: 인증정보 암호화 방식 결정 (Supabase Vault, 환경변수 등)

---

## 마일스톤

### Primary Goal: 연결 설정 + 수동 동기화

1. **연계 설정 페이지** (`src/app/(dashboard)/settings/connections/page.tsx`)
   - 카드매출 연계 방식 선택
   - API 계정 연결 (ID/PW 또는 API Key)
   - 연결 상태 표시

2. **동기화 서비스** (`src/lib/services/card-sync.ts`)
   - API 호출 → 데이터 변환 → revenues 테이블 저장
   - 중복 필터링
   - KPI 재계산

3. **동기화 Server Action** (`src/lib/actions/card-sync.ts`)
   - 수동 동기화 트리거
   - 조회 기간 선택

### Secondary Goal: 자동 동기화

4. Vercel Cron Jobs 또는 Supabase Edge Functions로 스케줄링
5. 동기화 이력 및 로그

### Tertiary Goal: 데이터 매핑 최적화

6. 카드사별 가맹점 유형 → 카테고리 자동 매핑
7. 수수료 자동 분리 (매출 vs 수수료 비용)

---

## 파일 구조

```
src/
├── app/(dashboard)/settings/
│   └── connections/page.tsx          # [신규] 연계 설정 페이지
├── components/settings/
│   ├── card-connection-form.tsx      # [신규] 카드매출 연결 폼
│   └── connection-status.tsx         # [신규] 연결 상태 표시
├── lib/services/
│   └── card-sync.ts                  # [신규] 카드매출 동기화 서비스
├── lib/actions/
│   └── card-sync.ts                  # [신규] 동기화 Server Action
└── types/
    └── connections.ts                # [신규] 연계 관련 타입
```

---

## 아키텍처 고려사항

### API 인증 흐름

```
사용자 → 설정에서 계정 연결
  → 인증정보 AES-256 암호화 → Supabase 저장
  → 동기화 시 복호화 → API 호출
  → 응답 데이터 → revenues 테이블 저장
  → KPI 재계산
```

### DB 스키마 추가 (제안)

```sql
CREATE TABLE card_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id),
  provider TEXT NOT NULL, -- 'crefia', 'hyphen', 'codef'
  encrypted_credentials TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'error', 'expired'
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES card_connections(id),
  synced_at TIMESTAMPTZ DEFAULT now(),
  records_added INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  errors TEXT[],
  status TEXT DEFAULT 'success'
);
```

<!-- TAG: SPEC-CONNECT-001 -->

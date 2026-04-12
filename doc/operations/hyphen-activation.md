# 하이픈 API 프로덕션 활성화 체크리스트

> Phase 1.1 deliverable
> Last updated: 2026-04-11

사장AI의 **PMF 핵심 차단 요소**. 이 체크리스트가 모두 체크되기 전까지는 "자동 수집"이라는 랜딩 카피가 유효하지 않습니다.

---

## 1. 외부 계약 & 키

- [ ] 하이픈 대시보드에서 계약 활성화 (월정액 ≈ 11만원)
- [ ] `HYPHEN_USER_ID` 발급받기
- [ ] `HYPHEN_HKEY` 발급받기
- [ ] Vercel 환경변수 설정
  - `HYPHEN_USER_ID=<실제값>`
  - `HYPHEN_HKEY=<실제값>`
  - `HYPHEN_TEST_MODE=false` ← **가장 중요**

## 2. 암호화 키 운영 설정

- [ ] 프로덕션용 암호화 키 생성
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] `CREDENTIAL_ENCRYPTION_KEY` Vercel 환경변수에 저장
- [ ] 키는 별도 secret manager(예: 1Password)에도 백업
- [ ] **주의**: 키 교체 시 기존 `api_connections.encrypted_credentials`는 전부 폐기되고 재입력 필요

## 3. 베타 매장 1개 연결 (카나리 테스트)

- [ ] 베타 사장님 매장 1곳 선정
- [ ] `/settings/connections`에서 배달앱 계정 등록
  - 배민 계정/비밀번호
  - (선택) 쿠팡이츠, 요기요
- [ ] `/settings/connections`에서 카드사 계정 등록
  - 카드사 코드 (신한=001, 현대=002 등)
  - 사업자 계정/비밀번호
- [ ] `api_connections.status`가 `active`로 변경되었는지 확인

## 4. 수동 동기화 검증

- [ ] `/admin/operations` 접속
- [ ] "하이픈 연동 상태" 섹션 확인:
  - API 키: `설정됨` ✅
  - 모드: `PROD` ✅
  - 활성 연결: `1개 이상` ✅
- [ ] "수동 실행" 섹션에서 **"하이픈 동기화"** 버튼 클릭
- [ ] 성공 메시지 확인: `하이픈 동기화 완료 (N건 저장)`
- [ ] `sync_logs` 테이블에 `completed` 레코드 확인
- [ ] `revenues` 테이블에 배달앱 매출이 실제 삽입되었는지 확인
- [ ] `delivery_reviews` 테이블에 리뷰가 들어왔는지 확인

## 5. Cron 자동 동기화 검증

- [ ] `/api/cron/sync`가 정상 동작하는지 Vercel dashboard에서 확인
- [ ] 다음날 아침 08:00 KST에 새 데이터가 들어왔는지 확인
- [ ] `ai_call_logs`에 일일 브리핑 관련 호출이 기록되었는지 확인 (Phase 0.5)

## 6. 장애 대응 시나리오

| 시나리오 | 대응 |
|---|---|
| 배달앱 계정 비번 변경됨 | `api_connections.status = 'error'` 자동 전환, 사장님에게 재입력 알림 (Phase 1.3에서 구현 예정) |
| 하이픈 API 5xx | 자동 재시도 3회, 실패 시 `sync_logs.status='failed'` 기록 |
| 하이픈 API 4xx (인증 실패) | 즉시 실패, 해당 연결 상태만 `error`로 |
| 중복 주문 | `revenues` UNIQUE 제약으로 자동 스킵 |

## 7. 해제 & 롤백

- [ ] `HYPHEN_TEST_MODE=true`로 되돌리면 즉시 mock 모드 복귀
- [ ] 모든 `api_connections.status`를 `inactive`로 일괄 변경하면 동기화 중단
- [ ] 환불 필요 시 해당 사업장의 `revenues`를 `source='hyphen'` 조건으로 삭제

---

## 현재 구현 상태 (2026-04-11 기준)

### ✅ 완성된 것

- `src/lib/hyphen/` 1,769 LOC, client/orchestrator/sync-delivery/sync-card/sync-review/normalizer/encryption 모두 구현
- AES-256-GCM credential 암호화
- 재시도 3회 + 지수 백오프
- 에러 격리 (1건 실패가 전체 차단 안 함)
- `POST /api/sync` (사용자 트리거)
- `/api/cron/sync` (5시간마다 자동)
- `POST /api/admin/operations { action: "hyphen_sync" }` ← **Phase 1.1 신규**
- `/admin/operations`의 "하이픈 연동 상태" 카드 ← **Phase 1.1 신규**
- Mock 자동 폴백이 `HYPHEN_ALLOW_MOCK_FALLBACK=true` opt-in으로 전환 ← **Phase 1.1 신규**

### ⚠️ 향후 과제

- 리뷰 감정 분석 자동 실행 (현재 `sentiment_score = null`, Phase 1.4에서 매출-리뷰 크로스에 포함)
- 자격증명 만료 감지 → 사장님 재입력 알림 (Phase 1.3 카톡 연동과 연계)
- 홈택스 연동 (하이픈 미지원, 별도 공급사 검토 필요)
- 배달앱 정산 예정 금액을 `revenues`가 아닌 별도 캐시플로우 테이블에 저장 (Phase 2)

---

## 빠른 명령어

```bash
# 개발 모드에서 mock 유지하고 싶을 때
export HYPHEN_ALLOW_MOCK_FALLBACK=true

# 프로덕션 전환
# Vercel Environment Variables:
#   HYPHEN_TEST_MODE=false
#   HYPHEN_USER_ID=<...>
#   HYPHEN_HKEY=<...>
#   CREDENTIAL_ENCRYPTION_KEY=<64 hex chars>

# 암호화 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

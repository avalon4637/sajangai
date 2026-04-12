# 카카오 알림톡 프로덕션 활성화 체크리스트

> Phase 1.3 deliverable
> Last updated: 2026-04-11

PMF 확보의 두 번째 핵심. **"매일 아침 카톡 리포트"** 약속을 실제로 이행하기 위한 운영 절차.

---

## 1. 카카오 비즈채널 등록

- [ ] business.kakao.com 접속
- [ ] 카카오 채널 개설 (@사장AI 등)
- [ ] 비즈니스 인증 자료 업로드 (사업자등록증)
- [ ] 심사 대기 (보통 1~3 영업일)
- [ ] 승인 후 **채널 프로필 ID (PFID)** 발급받기

## 2. SolAPI 설정

- [ ] solapi.com 가입
- [ ] API 키 / API secret 발급
- [ ] 카카오 채널을 SolAPI에 연결 (PFID 등록)
- [ ] 템플릿 등록 & 심사:
  - `DAILY_BRIEFING` — 아침 브리핑
  - `URGENT_REVIEW` — 긴급 리뷰 알림
  - `CASHFLOW_WARNING` — 현금흐름 경고
  - `WEEKLY_SUMMARY` — 주간 요약
  - `INSIGHT_ALERT` — 인사이트 알림
  - `SUBSCRIPTION_STARTED` / `EXPIRING` / `PAYMENT_FAILED`
- [ ] 각 템플릿 승인 완료 확인 (전체 승인에 3~7일 소요)

## 3. 환경변수 설정

Vercel Production Environment Variables:

```
SOLAPI_API_KEY=<실제값>
SOLAPI_API_SECRET=<실제값>
SOLAPI_KAKAO_PFID=<PFID>
SOLAPI_TEST_MODE=false         # ← TEST에서는 시뮬레이션만
```

- [ ] 위 4개 환경변수 설정 완료
- [ ] `vercel env pull` 후 로컬에서도 확인

## 4. 템플릿 내용 검증

`src/lib/messaging/templates.ts`의 각 템플릿 variable이 SolAPI 등록본과 정확히 일치해야 함.

- [ ] `TEMPLATES.DAILY_BRIEFING.templateId` = SolAPI 템플릿 ID
- [ ] `buildVariables()`가 생성하는 키와 SolAPI 변수명 1:1 매칭
- [ ] 버튼 URL 도메인이 `NEXT_PUBLIC_APP_URL`과 일치 (딥링크)

## 5. 기술 검증 (카나리)

- [ ] 베타 사장님 1명에게 실 전화번호 등록 받기
- [ ] `/admin/operations` → "일일 브리핑" 버튼 클릭
- [ ] 10초 이내 실제 카톡 수신 확인
- [ ] `/admin/operations` Section C(알림 발송 이력)에 성공 기록 확인
- [ ] 알림 내용이 템플릿대로 렌더링되는지 확인
- [ ] 버튼을 눌렀을 때 앱으로 정상 딥링크되는지 확인

## 6. 사용자 설정 존중 확인 (Phase 1.3 Bug Fix)

이전에는 `isNotificationEnabled` 체크가 누락되어 사용자가 꺼놨어도 발송되는 버그가 있었음. Phase 1.3에서 `shouldSend()` helper 추가로 수정됨.

- [ ] 테스트 계정으로 `/settings/notifications`에서 "매일 리포트" 끄기
- [ ] 수동으로 `sendDailyBriefing()` 호출 (또는 cron 수동 실행)
- [ ] 해당 계정으로는 발송되지 **않아야** 함 (로그에 `disabled_or_quiet_hours` 남음)
- [ ] 다시 켜고 재시도 → 발송 성공

## 7. 방해금지 시간 검증

- [ ] 테스트 계정 설정에서 방해금지 시간을 현재 시각대로 변경
- [ ] 수동 발송 시도 → 건너뜀 확인
- [ ] 방해금지 해제 후 → 발송 성공

## 8. 대량 발송 stress test (선택)

- [ ] 10개 테스트 계정 생성
- [ ] 10건 동시 발송 시나리오
- [ ] SolAPI rate limit 확인 (기본 100 msg/sec)
- [ ] 전체 성공률 95% 이상 확보

## 9. 장애 대응 매뉴얼

| 증상 | 원인 | 조치 |
|---|---|---|
| 전체 미발송 | SOLAPI_TEST_MODE=true | env 확인 |
| 특정 템플릿만 실패 | SolAPI 템플릿 승인 안 됨 | 승인 상태 확인 |
| 특정 사용자만 실패 | 전화번호 없음 | auth.users.phone 확인 |
| "disabled_or_quiet_hours" | 사용자 설정 | /settings/notifications 확인 |
| 알림톡은 실패, SMS로 대체됨 | 카카오 채널 차단 or 미등록 | 사용자에게 채널 추가 안내 |

---

## 현재 구현 상태 (2026-04-11 기준)

### ✅ 완성된 것

- `src/lib/messaging/sender.ts` — 4개 send 함수 + SMS fallback
- `src/lib/messaging/solapi-client.ts` — SolAPI HTTP client
- `src/lib/messaging/templates.ts` — 8개 템플릿 정의
- `src/lib/messaging/notification-preferences.ts` — 사용자 설정 + 방해금지 시간
- `src/app/(dashboard)/settings/notifications/` — 사용자 설정 UI
- `src/app/api/cron/daily-briefing/route.ts` — 매일 08:00 KST cron
- `runMorningRoutine()`이 내부에서 `sendDailyBriefing()` 호출
- **Phase 1.3 신규**: `shouldSend()` gate로 preference 체크 (이전 버그 수정)
- **Phase 1.3 신규**: `/admin/operations` Section C 실 데이터 표시

### ⚠️ 외부 의존

- 카카오 비즈채널 승인 (1~3일)
- SolAPI 템플릿 심사 (3~7일)
- 위 두 개가 끝나기 전까지는 실 발송 불가 → 골격 완성 상태로 대기

### ❌ 향후 과제 (Phase 2)

- `agent_activity_log` 대신 전용 `notification_history` 테이블 (성능 + 쿼리 편의성)
- 실패 건 자동 재시도 큐
- 발송 성공률 대시보드
- 사용자별 발송 횟수 제한 (스팸 방지)

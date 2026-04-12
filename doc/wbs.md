# 사장AI WBS (Work Breakdown Structure)

> 2026-04-11 냉정한 진단 리포트 기반 실행 WBS
> 원칙: "기능 완성도"가 아니라 "데이터 → 행동 루프 1개가 완전히 도는가"

---

## Phase 0 — 출시 전 정직화 (1주 이내, 최우선)

**목표**: 랜딩 카피와 실제 구현의 간극을 줄이고, 관측/보안 구멍을 메운다.
**완료 기준**: 랜딩에서 거짓/과장된 약속 0개, AI 호출 비용·실패율 측정 가능.

| ID | Task | 산출물 | 담당 | 상태 |
|---|---|---|---|---|
| 0.1 | 랜딩 카피 정직화 | "25가지 인사이트" → 실제 수, "월간 ROI 보고서" → 준비중 뱃지, "원클릭" → "버튼 하나로" | expert-frontend | - |
| 0.2 | 베타/체험판 뱃지 시스템 | 랜딩 히어로·대시보드 헤더에 "BETA" 뱃지 | expert-frontend | - |
| 0.3 | PortOne 웹훅 서명 검증 감사 | 현재 검증 로직 리뷰 + 누락 시 추가 | expert-security | - |
| 0.4 | 환불/결제 정책 페이지 정비 | `(legal)/refund-policy` 약관 정합성 확인 | direct edit | - |
| 0.5 | AI 호출 로깅 인프라 | `ai_call_log` 테이블 + `claude-client.ts` 래퍼 | expert-backend | - |
| 0.6 | /admin/operations에 AI 카운터 | 일별 호출수·실패율·평균 지연 카드 | direct edit | - |

**DoD (Definition of Done)**:
- [ ] 랜딩에 사실과 다른 주장 0개 (checklist 리뷰)
- [ ] `ai_call_log` 테이블에 데이터가 실제 쌓임 (카나리 1건 확인)
- [ ] PortOne 웹훅 서명 검증 유닛 테스트 통과
- [ ] /admin/operations 카드가 실데이터 표시
- [ ] `npm run lint` + `npm test` 통과

---

## Phase 1 — PMF 확보 (4~6주, 본 게임)

**목표**: 한 명의 사장님이 로그인 없이 카톡 한 번으로 오늘의 돈을 아끼는 루프 1개 완성.

| ID | Task | 산출물 | 담당 | 상태 |
|---|---|---|---|---|
| 1.1 | 하이픈 배민 API 실연동 | `sync-delivery.ts` 프로덕션 전환, 1가게 실데이터 흐름 | expert-backend | - |
| 1.2 | 능동적 아침 브리핑 카드 | 로그인 시 자동 펼쳐지는 "오늘의 브리핑" | expert-frontend | - |
| 1.3 | 카톡 알림톡 발송 트리거 실배포 | daily-briefing cron → SolAPI 실발송 | expert-backend | - |
| 1.4 | 매출-리뷰 크로스 쿼리 1개 | "매출 하락 + 부정 리뷰 동시 발생" 인사이트 | expert-backend | - |
| 1.5 | ROI 미니 버전 | "이번 주 점장이 아낀 시간/돈" 단순 지표 | expert-backend | - |
| 1.6 | AI 엔진 Golden Test | 각 에이전트 fixture 기반 스냅샷 5~10개 | expert-testing | - |
| 1.7 | 체험 D+1~D+6 시퀀스 | trial 가입일 기반 자동 넛지 cron | expert-backend | - |

**DoD**:
- [ ] 실제 배민 매장 1개 연결 → 자동 매출/리뷰 수집 → 카톡 아침 브리핑 발송 전 과정 E2E 통과
- [ ] 로그인 시 브리핑 카드가 펼쳐진 상태로 보임
- [ ] AI 엔진 Golden Test 5개 이상 통과
- [ ] 체험→유료 전환 funnel 이벤트 로그 수집 시작

---

## Phase 2 — 리텐션 & Unit Economics (6~12주)

**목표**: 월 29,700원 가격을 정당화하고, 이탈 방어선을 구축한다.

| ID | Task | 산출물 | 담당 |
|---|---|---|---|
| 2.1 | 쿠팡이츠/요기요 하이픈 연동 | sync-delivery 확장 | expert-backend |
| 2.2 | 카드매출 하이픈 연동 | sync-card 프로덕션 전환 | expert-backend |
| 2.3 | 월간 ROI 보고서 정식 구현 | `monthly_roi_reports` 테이블 + PDF | expert-backend |
| 2.4 | Level 3 처방형 프롬프트 전환 | 모든 에이전트 프롬프트 재작성 | manager-docs |
| 2.5 | 1-click 실행 카드 UI | 답글·문자·프로모션 전송 원클릭 | expert-frontend |
| 2.6 | 멀티 비즈니스 가격 플랜 | +9,900원/추가점 과금 로직 | expert-backend |
| 2.7 | PostHog 또는 mixpanel 도입 | D1/D7/D30 코호트 | expert-devops |

---

## Phase 3 — 확장 & 품질 (12주+)

**목표**: 코드 품질, 관측, 규모화 대비.

| ID | Task | 산출물 | 담당 |
|---|---|---|---|
| 3.1 | `types/database.ts` 도메인 분할 | 1,056줄 → 5~6개 파일 | expert-refactoring |
| 3.2 | 대형 page-client 컴포넌트 분해 | 500줄+ 컴포넌트 분리 | expert-frontend |
| 3.3 | Observability 스택 | Sentry + Vercel Analytics + AI 토큰 대시보드 | expert-devops |
| 3.4 | E2E 테스트 (Playwright) | 결제/체험 전환/브리핑 3개 플로우 | expert-testing |
| 3.5 | 카카오 비즈채널 정식 승인 | 알림톡 템플릿 등록 | direct |
| 3.6 | N+1 쿼리 감사 | `queries/` 전체 감사 + DataLoader 패턴 | expert-performance |

---

## 리스크 & 전제

- **하이픈 API 월정액 11만원**: 초기 가입자 수 적으면 Unit Economics 위험. Phase 1에서 매장 실연동 1~2개만 우선.
- **카카오 비즈채널 심사 1~3일**: Phase 1 병렬 진행, Phase 2 시작 전 승인 완료.
- **가격 정책**: 현재 29,700원 단일가는 약속 미이행 상태. Phase 1 DoD 달성 전까지는 폐쇄 베타(월 9,900원) 권장.

---

## HARD Rules (WBS 실행 중 준수)

- [HARD] 랜딩 카피 변경 시 구현 매트릭스 동반 업데이트
- [HARD] Phase 0 완료 전 정식 론칭 금지
- [HARD] Phase 1 DoD 미달성 시 29,700원 가격 적용 금지
- [HARD] AI 엔진 변경 시 Golden Test 통과 필수 (Phase 1.6 이후)

---

Version: 1.0.0
Created: 2026-04-11
Source: 냉정한 진단 리포트 v1

# sajang.ai Project Memory

## ★ Session Handoff (READ FIRST)
- ★ [session-handoff.md](session-handoff.md) — 2026-06-29 인계 상태: 11개 커밋 push 완료(origin 동기화), 정식 인계서는 git의 `docs/SESSION-HANDOFF.md`. remote URL PAT 노출 주의(폐기·재발급).

## Development Workflow (MUST FOLLOW)
- [feedback_dev_workflow.md](feedback_dev_workflow.md) - Design first → Code → Verify cycle

## Project Overview
- **Type**: Next.js 16 SaaS - AI 점장 서비스 for Korean small business owners (소상공인)
- **Concept**: "하루 990원, 점장 한 명" - AI 점장이 매장 운영을 알아서 챙겨드립니다
- **Stack**: React 19, Supabase, shadcn/ui (new-york), Tailwind CSS 4.x, Recharts
- **Language**: Korean UI, English code comments
- **Repo**: github.com/avalon4637/sajangai
- **Dev server port**: 2000

## AI Agent System (핵심 설계)
4명의 AI 에이전트 팀 구조 (Supervisor + 3 Sub-Agents):
- **점장** (jeongjang): Supervisor - 전체 오케스트레이션, 에이전트 답변 정리, 일간 리포트 발송, 이상 알림
- **답장이** (dapjangi): 리뷰 매니저 - 리뷰 수집/분석/자동 답글/감성 분석
- **세리** (seri): 매출 분석가 - 매출 집계/정산 분석/이상 감지
- **바이럴** (viral): 마케터 - 재방문 유도/문자 발송/SNS 제안

## Data Integration
- 배달앱 (배민/쿠팡이츠/요기요): 하이픈 API (마지막에 연동, 월 11만원)
- 네이버 플레이스: Supabase Edge Function 크롤링 (GraphQL API, 검증 완료)
- 카드매출 (여신금융협회): 하이픈 API
- 사업자 인증: 국세청 진위확인 API (무료)

## Revenue Model
- 무료 체험: 0원 / 7일 (수집 제한)
- 점장 고용: 9,900원 / 월 (전체 에이전트 무제한)
- 멀티 사업장: 기본 1개, 최대 5개까지 추가 가능

## Tech Stack (Updated 2026-04-07)
- LLM: Claude API (Sonnet 4.6) + Prompt Caching via @ai-sdk/anthropic
- Agent: AI SDK (Vercel)
- Data: 하이픈 API (배달앱/카드/홈택스 통합) + 네이버 자체 크롤링
- Channel: SolAPI + 카카오 알림톡 (앱 푸시 대신 카톡으로 알림)
- Payment: PortOne V2 브라우저 SDK (카드 토큰화, PCI-DSS 준수)
- Auth: Supabase Auth + 국세청 사업자 인증
- App: PWA (Capacitor 코드 준비됨, 네이티브 빌드는 불필요 — PWA로 충분)

## SPEC Status (전체 - 2026-04-07 기준)
| SPEC | Description | Status | Commit |
|------|------------|--------|--------|
| SPEC-AUTH-001 | Auth + business registration | Done | 84fe86e |
| SPEC-DATA-001 | Revenue/Expense/FixedCost CRUD | Done | d4f4167 |
| SPEC-DASHBOARD-001 | KPI dashboard + charts | Done | 972b109 |
| SPEC-IMPORT-001 | CSV upload + auto-classify | Done | 2300969 |
| SPEC-SIMULATION-001 | What-if simulation UI | Done | 2300969 |
| SPEC-AI-001 | AI business analysis widget | Done | 2300969 |
| SPEC-UX-001 | UI/UX responsive + mobile | Done | 635cfd6 |
| SPEC-TEST-001 | Test coverage 139 tests | Done | 635cfd6 |
| SPEC-RLS-001 | RLS policies 24 rules | Done | 635cfd6 |
| SPEC-INFRA-001 | Hyphen API infrastructure | Done | 635cfd6 |
| SPEC-UI-003 | 4 agent page redesign | Done | 7f47006 |
| SEC-002 | IDOR fix + rate limiting | Done | e98b461 |
| SPEC-SERI-001 | Survival gauge + cashflow | Done | f2f94f5 |
| SPEC-FINANCE-002 | Expense upload + invoices | Done | 6d377d2 |
| SPEC-LAUNCH-001 | Security headers + catch logging | Done | 201f68e |
| SPEC-ADMIN-001 | Admin dashboard | Done | f890e47 |
| SPEC-PAYMENT-001 | PortOne browser SDK | Done | 389467e |
| SPEC-NAVER-001 | Naver Place review crawling (Edge Function) | Done | 21b990a |
| SPEC-REVIEW-001 | Review reply UX (copy+deeplink) | Done | 4ba999c |
| SPEC-MOBILE-002 | Mobile responsive UI fixes | Done | 76ef4c6 |
| SPEC-MOBILE-001 | Capacitor app setup (PWA sufficient) | Done | 5b69c92 |
| SPEC-QA-001 | Full flow QA (0 failures) | Done | 5b69c92 |
| SPEC-MULTI-BIZ-001 | Multi-business support | Done | bb015df |
| SPEC-KAKAO-001 | AlimTalk templates + notification settings | Done | df5be2d |
| SPEC-UI-004 | Design overhaul (5.4→8.0+, 3 loops) | Done | 3694cf7 |
| SPEC-AI-002 | Insight prioritization + false positive filter | Done | a6700df |
| SPEC-AI-003 | Benchmark briefing + period comparison | Done | a6700df |
| SPEC-AI-004~007 | Prompt L3 + simulation + feedback + chat UX | Done | 16927e7 |
| SPEC-UX-002 | Mobile-first agent UX (seri/dapjangi/jeongjang) | Done | 9707a10 |
| SPEC-REVIEW-002 | Weekly review analysis engine + report card | Done | 933b61e |
| SPEC-CONTENT-001 | KakaoTalk↔App visual card 1:1 mapping (6 cards) | Done | be4c6c6 |
| UI Review | P0/P1/P2/P3 + card defects 전량 수정 | Done | a3a7154 |

## Notification Strategy (2026-04-06 결정)
- 앱 푸시(FCM) 대신 카카오 알림톡으로 모든 알림 처리
- 이유: 소상공인 사장님은 카톡 확인율이 앱 푸시보다 압도적
- FCM 코드는 Capacitor에 준비만 해둠, Phase 2에서 필요시 활성화
- 알림 설정 UI: /settings/notifications (6종 토글 + 방해금지 시간)
- PWA 설치로 앱 스토어 없이도 앱처럼 동작 (아이폰/안드로이드 모두)

## Admin Features
- /admin (KPI, 사용자 목록, 구독 변경, 사업장 비활성화/삭제)
- /admin/operations (수동 트리거: 주간 리뷰 분석, 네이버 크롤링)
- /admin/card-preview (카카오톡↔앱 카드 프리뷰 갤러리, 기획자 검토용)

## Key Architecture
- Route group: (dashboard) doesn't add URL segment
- Sidebar: BusinessSwitcher + AI 팀 nav + 데이터 관리 nav
- Server actions: src/lib/actions/ with revalidatePath
- Auth: createClient -> auth.getUser -> redirect if !user
- Business selection: cookie-based (getCurrentBusinessId reads cookie)
- Naver crawling: Supabase Edge Function (naver-crawl) — 서버 직접 호출은 차단됨

## Vercel Cron Jobs
- 매일 08:00 KST: /api/cron/daily-briefing (점장 아침 루틴)
- 매일 07:00 KST: /api/cron/sync (데이터 동기화)
- 매주 월 07:00 KST: /api/cron/weekly-review (주간 리뷰 분석)

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- ANTHROPIC_API_KEY
- NEXT_PUBLIC_PORTONE_STORE_ID, NEXT_PUBLIC_PORTONE_CHANNEL_KEY
- PORTONE_API_SECRET, PORTONE_WEBHOOK_SECRET, PORTONE_TEST_MODE
- SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_KAKAO_PFID
- HYPHEN_USER_ID, HYPHEN_HKEY, HYPHEN_TEST_MODE
- CRON_SECRET, NEXT_PUBLIC_APP_URL

## User Feedback (Field Research)
- [project_user_feedback_reviews.md](project_user_feedback_reviews.md) - Review reply: AI draft + copy + deep link (no RPA)
- [project_user_feedback_multi_biz.md](project_user_feedback_multi_biz.md) - 1인 2~3개 업체 운영 사장님 많음

## Development Decisions
- [feedback_dev_decisions_2026q2.md](feedback_dev_decisions_2026q2.md) - AI SDK유지, SPEC단위관리, 하이픈 마지막, Capacitor앱화
- [feedback_no_design_sync.md](feedback_no_design_sync.md) - Pencil 동기화 안함, 코드가 source of truth
- [feedback_ui_design_direction.md](feedback_ui_design_direction.md) - 점장=Chat-first, 세리=Calendar-first

## Naver Crawling (2026-04-07 검증)
- Supabase Edge Function에서 Naver GraphQL API 호출 (서버 직접 호출은 차단됨)
- 크롤링 정책: 1가게당 하루 1회, 최근 20건
- API 변경 반영: entry 필드 제거, sortType→sort
- 검증 완료: place ID 1428471321 (시면당 부천본점, 2390건 중 50건 수집 성공)

## Next Session TODO
- 카카오 비즈채널 신청 (business.kakao.com) — 수동, 심사 1-3일
- PortOne 콘솔에서 키 발급 → .env.local 설정 → 실결제 테스트
- 하이픈 연동 (전체 완성 후 마지막)
- AI audit checklist 기반 추가 개선 (doc/참조/sajang-ai-audit-checklist.md)

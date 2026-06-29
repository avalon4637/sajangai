# 세션 인계서 (SESSION-HANDOFF)

> 작성일: 2026-06-29 · 작성 기준: 도구로 직접 조사한 사실만 (기억/추측 배제)
> 이 문서는 git에 커밋되므로 새 컴퓨터에서 `git clone` 후 바로 이 파일을 읽으면 됩니다.

---

## 1. 현재 상태

- **브랜치**: `main` 단일 브랜치, `origin/main` 추적. (로컬에 다른 브랜치 없음)
- **워킹트리**: clean — 미커밋 변경 없음, untracked 파일 없음.
- **origin 대비**: **ahead 10, behind 0** → 로컬에 **푸시되지 않은 커밋 10개**. behind 0이므로 푸시 시 fast-forward (충돌 없음).
- **마지막 작업 성격**: "베타 출시 전 안정화". 진행 중 끊긴 작업은 없음(워킹트리 clean). 마지막 10개 커밋이 통째로 미푸시 상태.

### 미푸시 커밋 10개 (오래된 순 → 최신)

| # | 해시 | 요약 |
|---|------|------|
| 1 | f1f7af4 | fix: Phase 4 — N+1 batch upsert + revenues dedup bug fix |
| 2 | bef9770 | test: Phase 4 — normalizer + sync batch upsert tests (32 cases) |
| 3 | 2fd84e3 | security: Tier 1 — CSRF + IDOR + rate limit + AI cap + webhook fix |
| 4 | 8a70b78 | feat: Tier 2 — trial UX + payment error + onboarding + empty data guard |
| 5 | 6a39113 | fix: Tier 3 — iOS viewport height + chat keyboard overlap |
| 6 | 987f3cd | fix: CSV BOM/date validation + revalidatePath dashboard coverage |
| 7 | 8a66dee | fix: KPI race condition — Postgres advisory lock + atomic recalculation |
| 8 | e94f1d6 | test: fix 4 pre-existing test failures (30 tests green) |
| 9 | 68ed7e3 | security: fix 3 evaluator-found blockers before beta |
| 10 | 0a7ab1c | fix: 3 critical UX navigation issues found by journey simulation |

- diff 규모: **70 files changed, +1758 / −401**.
- **신규 DB 마이그레이션 3개** (`supabase/migrations/`, 미적용 가능성 있음):
  - `20260412000003_revenues_external_id.sql`
  - `20260412100000_rate_limit_entries.sql`
  - `20260412200000_recalculate_monthly_kpi_fn.sql` (KPI 원자적 재계산 함수)

---

## 2. 머지 / PR 현황

- **열린 PR**: 없음.
- **이번 작업분(10개 커밋)**: PR 없이 `main`에 직접 커밋됨, **아직 origin에 미푸시**.
- **최근 머지된 PR (1건)**: `feat(SPEC-AI-004~007): enhance AI modules` — 브랜치 `claude/enhance-ai-modules-IL7Zg` → main, 2026-04-06 머지. 그 이후 작업은 전부 main 직접 커밋 방식.
- **충돌(mergeable)**: origin/main 대비 behind 0 → fast-forward push 가능, 충돌 없음.
- **운영 방식**: 개인 프로젝트라 브랜치 분리 없이 main 직접 push 허용.

---

## 3. 먼저 할 것 (신규 컴퓨터 셋업 순서)

1. **저장소 클론 + 인증**
   - `git clone` 후, 푸시하려면 GitHub 인증 필요. `gh auth login` 또는 git credential 설정.
   - ⚠️ **보안 주의**: 기존 컴퓨터의 `git remote -v`에는 Personal Access Token이 URL에 박혀 있음. 신규 컴퓨터에는 토큰 없는 깨끗한 HTTPS URL(`https://github.com/avalon4637/sajangai.git`)로 remote를 설정하고 자격증명은 gh/credential manager로 분리할 것. (이 노출된 토큰은 폐기 후 재발급 권장)
2. **미푸시 10개 커밋 푸시**: `git push origin main` (fast-forward, 충돌 없음).
3. **의존성 설치**: `npm install` (패키지매니저는 **npm** — `package-lock.json`만 존재).
4. **환경변수 설정**: `.env.local.example`를 복사해 `.env.local` 작성 (4번 섹션 참조). `.env.local`은 gitignore되어 인계 안 됨.
5. **DB 마이그레이션 적용**: 신규 마이그레이션 3개를 Supabase에 적용 (`supabase db push` 또는 MCP `apply_migration`). 적용 누락 시 rate limit / 외부 ID dedup / KPI 재계산이 동작하지 않음.
6. **검증**: `npm run test` (vitest) → `npm run build` (타입체크 포함) → `npm run dev` (포트 2000).

---

## 4. 다음 할 일 (조사로 확인된 잔여 작업)

### 즉시 (배포 전 외부 연동)
- **카카오 비즈채널 신청** (business.kakao.com) — 수동, 심사 1~3일.
- **PortOne 콘솔 키 발급** → `.env.local` 설정 → 실결제 테스트.
- **하이픈(Hyphen) API 연동** — 전체 완성 후 마지막 단계 예정 (배달앱/카드/홈택스 통합, `HYPHEN_TEST_MODE=true` 상태).

### 품질 잔여 (doc/TODO.md, 2026-04-03 기준 — P0/P1 완료, 아래는 미완)
- **P2 테스트**: 인사이트 시나리오/엔진/ROI 계산기/채팅 메모리/rate limiter/InsightCard 단위 테스트.
- **P2 코드 품질**: `supabase gen types`로 `as any` 제거, 빈 `catch {}` 블록 정리, 미구현 stub 정리.
- **P2 데이터 무결성**: `businesses.user_id` UNIQUE 제약, `upsertInsight` 트랜잭션화, vercel cron schedule 주석 불일치 확인.
- **P3 고도화**: 인사이트 stub 시나리오(신메뉴/배달시간/날씨/경쟁) 활성화, 카드 수수료 분석, 랜딩 페이지 비전 반영.
> 주의: doc/TODO.md의 P0 보안 항목 다수는 이후 커밋(2fd84e3, 68ed7e3 등)으로 이미 해결됨. 항목별로 코드 현황을 먼저 대조할 것.

### 감사 기반 개선
- `doc/참조/sajang-ai-audit-checklist.md` 및 `docs/system-audit.md`의 잔여 항목 점검.

---

## 5. 참조 문서 (직접 존재 확인)

### 빌드/실행 전제
- **패키지매니저**: npm (`package-lock.json`). pnpm 10.30.0이 설치돼 있으나 lockfile은 npm 기준이므로 **npm 사용**.
- **Node**: v22.19.0 / npm 11.6.0 (`.nvmrc`·`engines` 없음).
- **스크립트**: `dev`(next dev --port **2000**), `build`(next build, 타입체크 포함 — 별도 tsc 없음), `lint`(eslint), `test`(vitest run), `test:watch`(vitest), `cap:*`(Capacitor).
- **E2E**: playwright 설치됨, 그러나 전용 npm script 없음(수동 실행).
- **알려진 노이즈**: Vercel SessionStart hook이 "Vercel CLI 미설치" 경고를 내지만 **실제로는 설치됨**(`~/AppData/Roaming/npm/vercel`) — 무해.

### 툴 절대경로 (PATH 미등록 시)
- `gh`: `/c/Program Files/GitHub CLI/gh` (PATH에 없음 → 절대경로 호출. 인증은 keyring에 avalon4637 활성).
- `node`: `/c/Program Files/nodejs/node` (PATH 있음).

### 핵심 문서
- `doc/architecture.md`, `doc/data-schema.md`, `doc/roadmap.md`, `doc/TODO.md` (할일 마스터, 2026-04-03 기준)
- `doc/specs/*` (제품 SPEC 마크다운 다수), `.moai/specs/SPEC-*/` (spec/plan/acceptance 3종 세트)
- `docs/system-audit.md` (Auth gap + 보안 취약점 맵 — 일부는 이후 커밋으로 해결됨)
- `doc/참조/sajang-ai-audit-checklist.md` (AI 감사 체크리스트)
- `doc/operations/` (hyphen-activation, kakao-alimtalk-activation, n-plus-one-audit)
- `CLAUDE.md` (MoAI 오케스트레이터 지침), `.claude/rules/` (TRUST 5, 워크플로 규칙)

### 환경변수 목록 (`.env.local.example` 기준)
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET
NTS_API_KEY                          # 국세청 사업자 진위확인
NEXT_PUBLIC_PORTONE_STORE_ID, NEXT_PUBLIC_PORTONE_CHANNEL_KEY
PORTONE_API_SECRET, PORTONE_WEBHOOK_SECRET, PORTONE_TEST_MODE
SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_TEST_MODE
HYPHEN_USER_ID, HYPHEN_HKEY, HYPHEN_TEST_MODE
CREDENTIAL_ENCRYPTION_KEY            # production 필수, dev는 자동 유도
CRON_SECRET
NEXT_PUBLIC_APP_URL                  # 딥링크/메시지 버튼용
```
- `.env.local` (실제 시크릿)은 로컬 전용·gitignore → 신규 컴퓨터에 **자동 인계 안 됨**, 직접 채워야 함.

---

## 6. 도메인 핵심 (잊으면 안 되는 규칙)

- **제품**: AI 점장 SaaS for 소상공인. "하루 990원, 점장 한 명". Stack: Next.js 16 / React 19 / Supabase / shadcn(new-york) / Tailwind 4.
- **AI 4-에이전트 팀**: 점장(supervisor·오케스트레이션/리포트) + 답장이(리뷰) + 세리(매출분석) + 바이럴(마케팅).
- **요금**: 무료 7일 → 9,900원/월. 멀티 사업장 기본 1개, 최대 5개.
- **불변식 — 소유권 검증(IDOR 방지)**: 모든 server action은 `getCurrentBusinessId()`로 business 소유권을 검증. business 선택은 **쿠키 기반**. 신규 API/액션 추가 시 반드시 소유권 검증 포함 (audit에서 반복 지적된 취약점 클래스).
- **Route group**: `(dashboard)`는 URL 세그먼트를 추가하지 않음.
- **인증 플로우 GAP 주의**: dashboard layout이 business=null일 때 온보딩으로 강제 리다이렉트하지 않는 갭이 audit에 기록됨 — 신규 작업 시 확인.
- **KPI 재계산**: race condition을 Postgres advisory lock + 원자적 재계산 함수(`recalculate_monthly_kpi_fn`)로 해결. KPI 관련 수정 시 이 함수 경유.
- **알림 전략**: 앱 푸시(FCM) 대신 **카카오 알림톡**으로 통일 (소상공인 카톡 확인율 우위). FCM 코드는 Capacitor에 준비만.
- **네이버 리뷰 크롤링**: Supabase **Edge Function**(`naver-crawl`)으로만 호출 (서버 직접 호출 차단). 정책: 1가게/일 1회, 최근 20건.
- **Vercel Cron (KST)**: daily-briefing 08:00, sync 07:00, weekly-review 월 07:00.
- **HARD 규칙 (CLAUDE.md/글로벌)**: 한국어 응답 / 코드 수정 전 기존 코드 읽기 / **배포·커밋은 명시적 요청 시에만**.

---

## 복붙용 인계 프롬프트 (신규 컴퓨터 Claude Code 첫 메시지)

```
sajang.ai 프로젝트를 이어서 진행한다. 아래는 직전 세션에서 도구로 직접 조사한 인계 사실이다.

[현재 상태]
- main 단일 브랜치, 워킹트리 clean. origin/main 대비 ahead 10 / behind 0 → 미푸시 커밋 10개(fast-forward, 충돌 없음).
- 마지막 작업은 "베타 출시 전 안정화"(보안 Tier1/블로커, trial UX, iOS viewport, CSV, KPI race condition, 테스트 안정화). 진행 중 끊긴 작업 없음.
- 미푸시 분에 신규 DB 마이그레이션 3개 포함(revenues_external_id, rate_limit_entries, recalculate_monthly_kpi_fn) — 적용 여부 확인 필요.

[머지/PR 현황]
- 열린 PR 없음. 이번 10개 커밋은 PR 없이 main 직접 커밋, 아직 미푸시.
- 최근 머지 PR: SPEC-AI-004~007(2026-04-06). 이후는 main 직접 push 방식(개인 프로젝트).

[먼저 할 것]
- GitHub 인증 설정(gh auth login). remote URL에 토큰 박지 말 것(기존 PC에 노출됨 → 폐기·재발급 권장).
- git push origin main(미푸시 10개) → npm install(패키지매니저 npm) → .env.local 작성(.env.local.example 복사) → 신규 마이그레이션 3개 Supabase 적용 → npm run test → npm run build → npm run dev(포트 2000).

[다음 할일]
- 외부 연동: 카카오 비즈채널 신청, PortOne 키 발급+실결제 테스트, 하이픈 API 연동(마지막).
- 품질: P2 테스트 보강 / as any 제거 / 빈 catch 정리 / 데이터 무결성. doc/TODO.md의 P0 보안은 이미 커밋으로 해결됐으니 코드 대조 후 진행.

[참조 문서]
- docs/SESSION-HANDOFF.md(이 인계서 원본), doc/TODO.md, doc/architecture.md, doc/data-schema.md, docs/system-audit.md, doc/참조/sajang-ai-audit-checklist.md, doc/operations/, .moai/specs/, CLAUDE.md.
- 빌드 전제: Node v22.19.0/npm 11.6.0, dev는 포트 2000, build에 타입체크 포함, test는 vitest. gh는 PATH에 없을 수 있음.

[도메인 핵심]
- AI 4-에이전트(점장/답장이/세리/바이럴). 요금 무료7일→9,900원/월, 멀티사업장 최대 5개.
- 불변식: 모든 server action은 getCurrentBusinessId()로 소유권 검증(IDOR 방지), business 선택은 쿠키 기반.
- (dashboard) route group은 URL 세그먼트 없음. 알림은 카카오 알림톡(FCM 아님). 네이버 크롤링은 Supabase Edge Function(naver-crawl), 1가게/일 1회·최근 20건.
- KPI는 advisory lock + recalculate_monthly_kpi_fn으로 원자적 재계산. Vercel Cron(KST): daily 08:00, sync 07:00, weekly 월 07:00.
- HARD: 한국어 응답 / 코드 수정 전 기존 코드 읽기 / 배포·커밋은 명시 요청 시에만.

먼저 git 상태를 확인하고 무엇부터 할지 물어봐라.
```

---

## 7. 깊은 이력(로컬 메모리) — git에 포함됨

세션 단위 깊은 이력(SPEC 진행 표, 필드 리서치 피드백, 개발 결정, 세션 인계 노트)은
원래 git 비추적 폴더(`C:\Users\E16\.claude\projects\c--Users-E16-sajang-ai\memory\`)에 있었으나,
**2026-06-29부로 repo의 `docs/handoff-memory/`에 스냅샷으로 복사·커밋**했습니다.
따라서 clone하면 이력도 함께 따라옵니다.

신규 컴퓨터에서 이를 Claude Code 메모리로 **복원**하려면 `docs/handoff-memory/README.md`의
복사 명령(PowerShell/Git Bash)을 실행해 동일 메모리 경로로 복사하세요.

> 이 스냅샷은 시점 복사본입니다. 이후 작업으로 원본 메모리가 갱신되면
> `docs/handoff-memory/`도 다시 복사·재커밋해야 최신 상태가 인계됩니다.

---
🗿 MoAI <email@mo.ai.kr>
</content>
</invoke>

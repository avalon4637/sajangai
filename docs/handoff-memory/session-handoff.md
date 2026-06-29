---
name: session-handoff
description: "Session/machine transfer state as of 2026-06-29 — git push status, setup order, and where the committed handoff doc lives"
metadata: 
  node_type: memory
  type: project
  originSessionId: 513ca34b-0ee1-4e37-bcba-8c3255c13758
---

# 세션 인계 상태 (2026-06-29 기준)

새 컴퓨터/새 세션 인계 준비를 도구 조사 사실로 수행하고, 인계서를 git에 커밋·푸시한 세션의 기록.

## 핵심 사실 (조사 확인)
- **git**: `main` 단일 브랜치, 워킹트리 clean. 이 세션 시작 시 origin/main 대비 **ahead 10**(미푸시 10개) 상태였음 → 인계서 커밋 추가해 11개를 **전부 push 완료**(origin/main `3c70a2d`로 동기화, ahead 0).
- **미푸시였던 작업**: 베타 출시 전 안정화 — 보안 Tier1/블로커, trial UX, iOS viewport, CSV 검증, KPI race condition(advisory lock + `recalculate_monthly_kpi_fn`), 테스트 안정화. 신규 마이그레이션 3개(revenues_external_id, rate_limit_entries, recalculate_monthly_kpi_fn) 포함.
- **PR**: 열린 PR 없음. 최근 머지는 SPEC-AI-004~007(2026-04-06). 이후는 main 직접 push 방식.
- **환경**: 패키지매니저 **npm**(package-lock.json), Node v22.19.0/npm 11.6.0, dev 포트 2000, build에 타입체크 포함, test는 vitest. gh 절대경로 `/c/Program Files/GitHub CLI/gh`. vercel CLI는 실제 설치됨(hook 경고 오탐).

## 인계서 위치
- git에 커밋된 정식 인계서: **`docs/SESSION-HANDOFF.md`** (커밋 `3c70a2d`). 6섹션 + 복붙용 인계 프롬프트 포함. 새 컴퓨터는 clone 후 이 파일을 먼저 읽으면 됨.

## 보안 주의 (반드시 처리)
- 기존 PC의 `git remote -v` URL에 **GitHub PAT가 평문 노출**되어 있음. 신규 PC는 토큰 없는 HTTPS URL + gh/credential manager로 분리하고, **노출된 토큰은 폐기·재발급** 권장.

## 메모리 폴더 수동 복사
- 이 `memory/` 폴더는 git 비추적 → clone으로 안 따라옴. 깊은 이력까지 옮기려면 신규 PC의 동일 경로 `C:\Users\E16\.claude\projects\c--Users-E16-sajang-ai\memory\`로 수동 복사할 것.

## 다음 할 일
- 외부 연동: 카카오 비즈채널 신청, PortOne 키 발급+실결제 테스트, 하이픈 API 연동(마지막).
- 품질: [[MEMORY]] Next Session TODO 및 doc/TODO.md P2/P3 (단 P0 보안은 이미 커밋 해결됨 → 코드 대조 후).
</content>
</invoke>

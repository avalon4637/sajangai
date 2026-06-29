# handoff-memory — 로컬 메모리 스냅샷

이 폴더는 직전 작업 컴퓨터의 Claude Code 로컬 메모리
(`C:\Users\E16\.claude\projects\c--Users-E16-sajang-ai\memory\`)를
**git으로 인계하기 위해 복사한 스냅샷**입니다. (2026-06-29 시점)

원래 메모리 폴더는 git 비추적이라 clone으로 따라오지 않으므로, 여기에 복사해 둡니다.

## 신규 컴퓨터에서 메모리로 복원하기

clone 후, 이 폴더 내용을 신규 컴퓨터의 동일 메모리 경로로 복사하면
Claude Code가 세션 시작 시 자동으로 읽습니다.

PowerShell:
```powershell
$dst = "$env:USERPROFILE\.claude\projects\c--Users-E16-sajang-ai\memory"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item -Recurse -Force "docs\handoff-memory\*" $dst
```

Git Bash:
```bash
dst="$HOME/.claude/projects/c--Users-E16-sajang-ai/memory"
mkdir -p "$dst" && cp -r docs/handoff-memory/. "$dst/"
```

> 주의: 사용자 폴더명이 다른 PC라면 프로젝트 해시 경로
> (`c--Users-E16-sajang-ai`)도 새 경로명에 맞게 바뀔 수 있습니다.
> 복원 후 이 README는 메모리 폴더에서 지워도 됩니다.

## 동기화 정책
- 이 스냅샷은 **시점 복사본**입니다. 작업을 이어가면 원본 메모리는 계속 갱신되지만
  이 폴더는 자동으로 갱신되지 않습니다.
- 최신 상태로 다시 인계하려면 위 복사를 **반대 방향**으로 한 번 더 수행해
  (메모리 → `docs/handoff-memory/`) 재커밋하세요.
</content>

---
id: SPEC-AI-001
type: plan
version: "1.0.0"
---

# SPEC-AI-001 구현 계획: AI 경영 분석 인사이트

## 개요

기존 `/api/ai` 엔드포인트와 Vercel AI SDK의 `useChat()`/`useCompletion()` 훅을 활용하여 대시보드에 AI 경영 분석 위젯을 추가한다.

---

## 마일스톤

### Primary Goal: AI 분석 위젯

1. **AI 분석 위젯** (`src/components/dashboard/ai-insights-widget.tsx`)
   - "use client" 컴포넌트
   - "AI 분석 시작" 버튼
   - Vercel AI SDK `useCompletion()` 훅으로 스트리밍
   - 마크다운 렌더링 (react-markdown 또는 직접 파싱)
   - 로딩/완료/오류 상태 표시

2. **API 엔드포인트 개선** (`src/app/api/ai/route.ts`)
   - 사업장 유형(businessType) 활용
   - 추이 데이터(trend) 추가 전달 (선택)

### Secondary Goal: 대시보드 통합

3. 대시보드 페이지에 AI 위젯 배치
4. KPI 데이터 없는 경우 비활성 처리

---

## 파일 구조

```
src/
├── components/dashboard/
│   └── ai-insights-widget.tsx      # [신규] AI 분석 위젯
├── app/api/ai/
│   └── route.ts                    # [수정] 프롬프트 개선 (선택)
└── app/(dashboard)/dashboard/
    └── page.tsx                    # [수정] AI 위젯 배치
```

**수정 1~2개, 신규 1개**

---

## 기술 접근

- Vercel AI SDK `useCompletion()` 훅: fetch + 스트리밍 자동 처리
- 기존 API 엔드포인트 재사용 (수정 최소화)
- 마크다운 렌더링: 단순 포맷은 직접 처리, 복잡한 경우 react-markdown

<!-- TAG: SPEC-AI-001 -->

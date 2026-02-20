---
id: SPEC-SIMULATION-001
type: plan
version: "1.0.0"
---

# SPEC-SIMULATION-001 구현 계획: What-if 시뮬레이션 UI

## 개요

기존 `src/lib/simulation/engine.ts`의 runSimulation() 함수를 활용하여 소상공인이 경영 의사결정 전 KPI 변화를 미리 시뮬레이션할 수 있는 UI를 구현한다.

---

## 마일스톤

### Primary Goal: 시뮬레이션 폼 + 결과 비교

1. **시나리오 선택 카드** (`src/components/simulation/scenario-cards.tsx`)
   - 4가지 시나리오 카드 (아이콘 + 설명)
   - 선택 시 하이라이트

2. **시뮬레이션 폼** (`src/components/simulation/simulation-form.tsx`)
   - 값 입력 (원 또는 % 전환)
   - 프리셋 버튼 ("알바 1명 추가", "매출 10% 증가" 등)
   - "시뮬레이션 실행" 버튼

3. **결과 비교 패널** (`src/components/simulation/simulation-result.tsx`)
   - Before/After KPI 카드 나란히 비교
   - 변화량 + 변화율 표시
   - 색상 코딩 (개선: 초록, 악화: 빨강)

### Secondary Goal: 시각화 + 페이지

4. **생존점수 비교 차트** (`src/components/simulation/score-comparison.tsx`)
   - 변경 전/후 게이지 차트 비교

5. **시뮬레이션 페이지** (`src/app/(dashboard)/simulation/page.tsx`)
   - Server Component: 현재 월 KPI 페칭
   - Client Component: 시뮬레이션 인터랙션

6. 사이드바에 "시뮬레이션" 메뉴 추가

---

## 파일 구조

```
src/
├── app/(dashboard)/simulation/
│   └── page.tsx                       # [신규] 시뮬레이션 페이지
├── components/simulation/
│   ├── scenario-cards.tsx             # [신규] 시나리오 선택
│   ├── simulation-form.tsx            # [신규] 파라미터 입력
│   ├── simulation-result.tsx          # [신규] 결과 비교
│   └── score-comparison.tsx           # [신규] 점수 비교 차트
└── app/(dashboard)/sidebar.tsx        # [수정] 메뉴 추가
```

**수정 1개, 신규 5개**

---

## 기술 접근

- 시뮬레이션은 클라이언트 사이드에서 실행 (순수 함수, 서버 불필요)
- Server Component에서 현재 KPI를 페칭하여 Client Component에 전달
- runSimulation()은 "use client" 컴포넌트에서 직접 호출

<!-- TAG: SPEC-SIMULATION-001 -->

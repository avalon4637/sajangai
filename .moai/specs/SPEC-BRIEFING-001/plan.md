# SPEC-BRIEFING-001 Implementation Plan

<!-- TAG: SPEC-BRIEFING-001 -->

## Overview

대시보드 자동 브리핑 시스템 구현. 로그인 즉시 오늘의 핵심 요약(매출, 리뷰, 이상 징후)을 보여주는 PMF Critical 기능이다.

---

## Phases

### Phase 1: 데이터 레이어 구축 (Primary Goal)

- **TASK-01**: `src/lib/actions/briefing.ts` - 브리핑 데이터 fetching Server Actions 생성
  - `getDailyRevenueSummary()`: 어제 매출, 전일 대비, 전주 동일 요일 대비
  - `getReviewAlerts()`: 미답변 리뷰 수, 최근 부정 리뷰
  - `getAnomalies()`: 이상 징후 감지 결과
- **TASK-02**: `src/lib/utils/anomaly-detection.ts` - 이상 징후 감지 유틸리티
  - 매출 급감/급증 판단 (7일 평균 대비 30%/50% 기준)
  - 지출 이상 판단 (전월 동기 대비 50% 기준)
- **TASK-03**: 타입 정의 (`src/types/briefing.ts`)
  - `DailyBriefingData`, `RevenueSummary`, `ReviewAlert`, `AnomalyItem` 인터페이스

### Phase 2: UI 컴포넌트 구축 (Primary Goal)

- **TASK-04**: `src/components/dashboard/daily-briefing.tsx` - 메인 브리핑 카드
  - 점장 아바타 + 날짜 헤더
  - 매출 요약 섹션 (증감률 색상 코딩)
  - 리뷰 알림 섹션 (미답변 수 뱃지)
  - 이상 징후 섹션 (경고 아이콘 + 빨간 뱃지)
- **TASK-05**: `src/components/dashboard/briefing-skeleton.tsx` - 스켈레톤 로딩 UI
- **TASK-06**: `src/components/dashboard/onboarding-briefing.tsx` - 신규 사용자 온보딩 카드
  - "데이터를 연결하면..." 메시지
  - 데이터 연결 CTA 버튼

### Phase 3: 대시보드 통합 (Primary Goal)

- **TASK-07**: `src/app/(dashboard)/page.tsx` 수정
  - 기존 KPI 카드 위에 브리핑 카드 삽입
  - `<Suspense>` + 스켈레톤으로 감싸기
  - 데이터 유무에 따라 브리핑 카드 vs 온보딩 카드 분기

### Phase 4: 폴리시 (Secondary Goal)

- **TASK-08**: 반응형 레이아웃 최적화
  - 모바일: 세로 스택
  - 데스크톱: 가로 배치 고려
- **TASK-09**: "자세히 보기" 링크 연결 (매출분석, 리뷰 페이지)
- **TASK-10**: "점장에게 물어보기" CTA → AI 채팅 페이지 연결

### Phase 5: 시간대별 인사말 (Optional Goal)

- **TASK-11**: 시간대별 인사말 분기 로직
  - 오전 5~11시: "좋은 아침이에요, {사장님}"
  - 오전 11시~17시: "오늘 하루 어떠세요?"
  - 오후 17시~22시: "오늘 하루도 수고 많으셨어요"
  - 밤 22시~5시: "늦은 시간까지 수고하세요"

## Affected Files

### 신규 생성

- `src/components/dashboard/daily-briefing.tsx`
- `src/components/dashboard/briefing-skeleton.tsx`
- `src/components/dashboard/onboarding-briefing.tsx`
- `src/lib/actions/briefing.ts`
- `src/lib/utils/anomaly-detection.ts`
- `src/types/briefing.ts`

### 수정

- `src/app/(dashboard)/page.tsx` - 브리핑 카드 삽입

## Risk Assessment

- **Medium Risk**: revenues 테이블에 데이터가 없는 경우 처리 필요 (온보딩 카드로 대응)
- **Low Risk**: reviews 테이블이 agent migration 미적용 상태일 수 있음 (리뷰 섹션을 graceful하게 비활성화)
- **Low Risk**: 이상 징후 감지 로직의 임계값 튜닝이 필요할 수 있음 (하드코딩 후 config로 이동 가능)

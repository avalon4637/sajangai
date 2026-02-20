---
id: SPEC-DELIVERY-001
type: plan
version: "1.0.0"
---

# SPEC-DELIVERY-001 구현 계획: 배달앱 매출 자동 연계

## 개요

하이픈(HYPHEN) API 또는 배달 플랫폼 표준 API를 통해 배민/쿠팡이츠/요기요의 매출/정산 데이터를 자동 조회하여 sajang.ai에 연계한다.

---

## 선행 과제 (구현 전 필요)

1. **SPEC-CONNECT-001 완료**: 카드매출 연계 인프라 (card_connections, sync_logs 테이블, 암호화)
2. **API 플랫폼 계약**: 하이픈 API 구독 또는 개별 배달앱 API 이용 신청
3. **수수료 구조 분석**: 배달앱별 수수료 항목 정리

---

## 마일스톤

### Primary Goal: 배달앱 연결 + 매출 동기화

1. **배달앱 연결 설정** (`src/components/settings/delivery-connection-form.tsx`)
   - 배민/쿠팡이츠/요기요 계정 연결
   - 기존 card_connections 테이블 재사용 (provider 구분)

2. **배달앱 동기화 서비스** (`src/lib/services/delivery-sync.ts`)
   - API 호출 → 매출 데이터 조회
   - 매출 → revenues 테이블 (channel: "배민" 등)
   - 수수료 → expenses 테이블 (category: "배달수수료")
   - KPI 재계산

### Secondary Goal: 배달앱 분석 위젯

3. **배달 분석 위젯** (`src/components/dashboard/delivery-breakdown.tsx`)
   - 배달앱별 매출 비중 파이차트
   - 수수료율 비교 테이블
   - 순매출(매출-수수료) 표시

### Tertiary Goal: 통합 데이터 채널 관리

4. 연계 설정 페이지에서 카드 + 배달앱 통합 관리
5. 동기화 이력 통합 뷰

---

## 파일 구조

```
src/
├── components/settings/
│   └── delivery-connection-form.tsx  # [신규] 배달앱 연결 폼
├── components/dashboard/
│   └── delivery-breakdown.tsx        # [신규] 배달 분석 위젯
├── lib/services/
│   └── delivery-sync.ts             # [신규] 배달앱 동기화 서비스
├── lib/actions/
│   └── delivery-sync.ts             # [신규] 동기화 Server Action
└── app/(dashboard)/settings/
    └── connections/page.tsx          # [수정] 배달앱 탭 추가
```

---

## 수수료 구조 (참고)

| 배달앱 | 중개수수료 | 배달수수료 | 기타 |
|--------|----------|----------|------|
| 배민 | 6.8% | 배달건당 | 광고비 |
| 쿠팡이츠 | 9.8% | 포함 | - |
| 요기요 | 12.5% | 배달건당 | 광고비 |

<!-- TAG: SPEC-DELIVERY-001 -->

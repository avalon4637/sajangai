# SPEC-NAVER-001: Naver Place Review Crawling

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-NAVER-001 |
| Title | 네이버 플레이스 리뷰 크롤링 + 답장이 연동 |
| Priority | P1 (VIP 차별화 킥) |
| Status | Defined |
| Estimated | 2일 |
| Dependencies | None |

## Background

하이픈 API는 네이버 플레이스를 지원하지 않음. VIP 10곳 중 배달 안 하는 2곳은 네이버 플레이스 리뷰가 핵심.
공개 페이지 크롤링으로 리뷰 수집 후 답장이가 AI 답글 생성 → 복사 + 스마트플레이스 딥링크 제공.
하이픈이 못하는 영역을 커버하는 차별화 포인트.

## Acceptance Criteria

### AC-1: 네이버 플레이스 URL 등록
- 설정 > 연동 페이지에서 네이버 플레이스 URL 입력
- place.naver.com/restaurant/{id} 형식 검증
- businesses 테이블에 naver_place_id 저장

### AC-2: 리뷰 크롤링 엔진
- 서버 사이드 크롤링 (비로그인, 공개 페이지)
- place.naver.com/restaurant/{id}/review 페이지 파싱
- 수집 데이터: 작성자명, 별점, 리뷰 본문, 작성일, 사진 유무
- 수집 주기: 1일 1회 (cron job 또는 수동 트리거)
- 중복 감지: 리뷰 ID 기반 deduplication

### AC-3: 리뷰 DB 저장
- reviews 테이블에 platform='naver_place'로 저장
- 기존 배달앱 리뷰와 동일한 스키마 사용
- 새 리뷰 감지 시 알림 생성

### AC-4: 답장이 연동
- 네이버 리뷰도 답장이 AI 답글 생성 대상에 포함
- 감성 분석 동일 적용
- 답글 초안 생성 후 [복사] + [스마트플레이스에서 답글 쓰기] 버튼

### AC-5: 에러 처리
- 크롤링 실패 시 재시도 (최대 3회)
- 네이버 차단 감지 시 자동 중단 + 관리자 알림
- User-Agent rotation, 요청 간격 랜덤 지연 (3-10초)

## Technical Notes

- 크롤링: cheerio (HTML 파싱) 또는 puppeteer (SSR 대응)
- 네이버 모바일 페이지가 파싱 용이할 수 있음 (m.place.naver.com)
- VIP 2곳만 대상이라 rate limiting 부담 거의 없음
- 추후 확장 시 Playwright 기반 headless로 전환 고려

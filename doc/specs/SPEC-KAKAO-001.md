# SPEC-KAKAO-001: KakaoTalk Biz Channel Integration

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-KAKAO-001 |
| Title | 카카오톡 비즈채널 + 알림톡 연동 |
| Priority | P2 (런칭 후 개선) |
| Status | Defined |
| Estimated | 2일 (채널 승인 별도) |
| Dependencies | 카카오 비즈채널 신청 완료 |

## Background

SolAPI 코드로 카카오 알림톡 + SMS 발송 로직은 구현되어 있으나, 실제 카카오 비즈채널/템플릿이 미연동 상태.
비즈채널 개설 + 템플릿 검수에 3-5 영업일 소요되므로 조기 신청 필요.

## Acceptance Criteria

### AC-1: 카카오 비즈채널 개설
- 카카오 비즈니스 채널 생성 (sajang.ai)
- 프로필 이미지, 소개 설정
- 채널 ID 확보

### AC-2: 알림톡 템플릿 등록 + 검수
- 일일 리포트 템플릿
- 이상 감지 알림 템플릿
- 결제 관련 템플릿 (구독 시작/만료/실패)
- 각 템플릿 카카오 검수 승인

### AC-3: SolAPI 연동 검증
- SolAPI에 카카오 채널 연결
- 알림톡 발송 테스트 (템플릿 기반)
- SMS 폴백 정상 동작 확인

### AC-4: 사용자 설정
- 설정 페이지에서 알림 수신 ON/OFF
- 카카오톡 수신 동의 관리
- 알림 시간대 설정 (기본 08:00-22:00)

## Technical Notes

- 기존 코드: src/lib/messaging/solapi-client.ts, sender.ts, templates.ts
- 카카오 비즈메시지 가이드: business.kakao.com
- 채널 신청은 개발과 별도로 병렬 진행

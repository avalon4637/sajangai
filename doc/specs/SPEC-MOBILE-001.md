# SPEC-MOBILE-001: Mobile Optimization & App Wrapping

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-MOBILE-001 |
| Title | 모바일 최적화 + Capacitor 앱화 |
| Priority | P3 (다음 스테이지) |
| Status | Defined |
| Estimated | 1~2주 |
| Prerequisite | 웹앱 안정화 완료 후 |

## Background

Capacitor 8 의존성 이미 설치됨. 웹앱이 안정화된 후 네이티브 래핑 진행.
PWA가 아닌 Capacitor 기반 하이브리드 앱 — 푸시 알림 + 딥링크만 네이티브.

## Acceptance Criteria

### AC-1: 모바일 반응형 최적화
- 모든 대시보드 페이지 모바일 뷰포트 정상 동작 (375px~428px)
- 터치 인터랙션 최적화 (버튼 최소 44px, 스와이프 제스처)
- 모바일 전용 하단 네비게이션 바

### AC-2: Capacitor 프로젝트 설정
- iOS/Android 프로젝트 생성 (capacitor.config.ts)
- 앱 아이콘 + 스플래시 스크린
- StatusBar / SafeArea 처리

### AC-3: 푸시 알림
- FCM (Android) + APNS (iOS) 설정
- 일간 브리핑 푸시 알림
- 이상 감지 긴급 알림
- 알림 클릭 → 앱 내 해당 화면 이동

### AC-4: 딥링크
- sajangai:// URL scheme 등록
- 카카오톡 메시지 → 앱 특정 화면 이동
- Universal Links (iOS) / App Links (Android)

### AC-5: 스토어 배포
- App Store 제출 (iOS)
- Play Store 제출 (Android)
- 앱 심사 대응

## Out of Scope
- 네이티브 전용 기능 (카메라, GPS 등)
- 오프라인 모드 (서비스 워커)
- 네이티브 UI 컴포넌트 (WebView 기반 유지)

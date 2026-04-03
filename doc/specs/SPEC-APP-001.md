# SPEC-APP-001: Capacitor App Wrapping

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-APP-001 |
| Title | Capacitor Web → Native App |
| Phase | Phase App (최종) |
| Priority | P2 |
| WBS Ref | — (WBS v2 이후 추가) |
| Dependencies | All Phase 1~4 SPECs |
| Status | Draft |

## Problem Statement

웹앱이 완전히 안정화된 후, 네이티브 앱으로 포팅하여 푸시 알림과 딥링크를 제공한다.

## Requirements (EARS Format)

### REQ-01: Capacitor Wrapping

**The system shall** wrap the Next.js web app using Capacitor for iOS and Android.

Acceptance Criteria:
- [ ] capacitor.config.ts configured
- [ ] iOS and Android projects generated
- [ ] Web app loads correctly in native shell

### REQ-02: Push Notifications

**When** a critical insight or daily report is generated,
**the system shall** send a native push notification.

Acceptance Criteria:
- [ ] @capacitor/push-notifications configured
- [ ] FCM (Android) and APNS (iOS) integration
- [ ] Notification tap opens relevant app page

### REQ-03: Deep Links

**When** a user taps a KakaoTalk button or push notification,
**the system shall** open the app to the correct page.

Acceptance Criteria:
- [ ] @capacitor/app deep link handling
- [ ] URL scheme: sajangai://insight/{id}, sajangai://review, etc.
- [ ] Fallback to web if app not installed

## Tech Notes

- Already in package.json: @capacitor/core, @capacitor/app, @capacitor/push-notifications, @capacitor/cli
- Minimal native code — web app handles all logic
- App Store / Play Store submission as final step

## Out of Scope

- Native UI components
- Offline mode
- Background sync
- In-app purchase (web billing sufficient)

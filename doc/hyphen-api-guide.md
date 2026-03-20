# 하이픈(Hyphen) API 연동 가이드

> 사장 AI에서 하이픈 API를 통해 어떤 데이터를 수집하는지, 실제 API 명세를 기반으로 정리한 문서입니다.
> 작성일: 2026-03-20
> 출처: https://hyphen.im/product-api/view?seq=17, seq=14 (Scalar OAS 3.0.1 기준)

---

## 1. 개요

- **Base URL**: `https://api.hyphen.im`
- **인증 방식**: 모든 요청에 `user-id` + `Hkey` 헤더 필수
- **공통 응답 구조**: `{ common: { userTrNo, hyphenTrNo, errYn, errCd, errMsg }, data: { ... } }`
- **테스트베드**: `hyphen-gustation: Y` 헤더 추가 시 테스트 모드 (일 100건 무료)

### 인증 헤더 (모든 API 공통)

| 헤더 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `Content-Type` | string | O | `application/json` |
| `user-id` | string | O | 회원ID (회원가입 시 생성) |
| `Hkey` | string | O | H보안키 (회원가입 후 이메일로 전달) |
| `user-tr-no` | string | X | 거래고유번호 (고객 생성, 추적용) |
| `hyphen-gustation` | string | X | 테스트 모드: `Y` (운영 시 제거) |

### 공통 응답 구조

```json
{
  "common": {
    "userTrNo": "고객이 보낸 거래고유번호",
    "hyphenTrNo": "하이픈 내부 거래번호",
    "errYn": "Y/N",
    "errCd": "에러코드",
    "errMsg": "에러메시지"
  },
  "data": { ... }
}
```

### 환경 변수

```bash
HYPHEN_USER_ID=하이픈_회원ID
HYPHEN_HKEY=하이픈_보안키
```

---

## 2. sajang.ai에서 사용할 API (우선순위별)

### 핵심 API (MVP 필수)

| 순위 | API | 용도 | 사용 에이전트 |
|------|-----|------|-------------|
| 1 | 배달앱 주문내역조회 (3사) | 매출 수집 | 세리 |
| 2 | 배달앱 리뷰내역조회 (3사) | 리뷰 수집/답글 | 답장이 |
| 3 | 카드사 승인내역 조회 | 카드 매출 수집 | 세리 |
| 4 | 카드사 입금내역 조회 | 정산/현금흐름 | 세리 |

### 부가 API (Phase 2)

| 순위 | API | 용도 |
|------|-----|------|
| 5 | 카드사 매입내역 조회 | 매입 상세 |
| 6 | 네이버리뷰 조회 | 네이버 플레이스 리뷰 |
| 7 | 카드사 가맹점정보 조회 | 가맹점 자동 설정 |

### 불필요 API (sajang.ai에서 미사용)

- 카드사 회원가입/아이디찾기/비밀번호재설정 → 사용자가 직접 하이픈 사이트에서 처리

---

## 3. 배달앱 API 상세 (seq=17)

### 3-1. 쿠팡이츠 리뷰내역조회

```
POST https://api.hyphen.im/in0024000800
```

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| userId | string | O | 쿠팡이츠 사용자 아이디 |
| userPw | string | O | 쿠팡이츠 사용자 비밀번호 |
| dateFrom | string | O | 조회기간 시작 (yyyymmdd) |
| dateTo | string | O | 조회기간 종료 (yyyymmdd) |

**Response (200):**

```json
{
  "common": { "userTrNo": "", "hyphenTrNo": "", "errYn": "", "errCd": "", "errMsg": "" },
  "data": {
    "storeList": [{
      "storeName": "가게명",
      "storeId": "가게ID",
      "allStar": "전체별점",
      "reviewCnt": "리뷰수",
      "commentCnt": "답글수",
      "reviewList": [{
        "orderReviewId": "주문리뷰ID",
        "abbrOrderId": "축약주문ID",
        "reviewId": "리뷰ID",
        "reviewDt": "리뷰날짜",
        "reviewTm": "리뷰시간",
        "allStar": "별점",
        "jumun": "주문메뉴",
        "comment": "리뷰내용",
        "orderType": "주문유형",
        "ownerReplyId": "사장님답글ID",
        "ownerReply": "사장님답글",
        "ownerReplyDt": "답글날짜",
        "ownerReplyTm": "답글시간",
        "reviewImgList": [{ "reviewImg": "이미지URL" }]
      }]
    }]
  }
}
```

**fetch 예시:**

```javascript
fetch('https://api.hyphen.im/in0024000800', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Id': 'HYPHEN_USER_ID',
    'Hkey': 'HYPHEN_HKEY'
  },
  body: JSON.stringify({
    userId: '쿠팡이츠_아이디',
    userPw: '쿠팡이츠_비밀번호',
    dateFrom: '20260301',
    dateTo: '20260320'
  })
})
```

### 3-2. 쿠팡이츠 주문내역조회

```
POST https://api.hyphen.im/in0024000086
```

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| userId | string | O | 쿠팡이츠 사용자 아이디 |
| userPw | string | O | 쿠팡이츠 사용자 비밀번호 |
| dateFrom | string | O | 조회기간 시작 (yyyymmdd) |
| dateTo | string | O | 조회기간 종료 (yyyymmdd) |
| storeId | string | X | 상호ID |

**Response (200):**

```json
{
  "common": { ... },
  "data": {
    "storeList": [{ "storeName": "", "storeId": "", ... }],
    "totOrderCnt": "총주문수",
    "startDate": "시작일",
    "endDate": "종료일",
    "touchSucCnt": "터치주문성공",
    "touchCanCnt": "터치주문취소",
    "callSucCnt": "콜주문성공",
    "callCanCnt": "콜주문취소",
    "touchOrderAmt": "터치주문금액",
    "onlineOrderAmt": "온라인주문금액",
    "offlineOrderAmt": "오프라인주문금액",
    "touchOrderList": [{
      "storeId": "가게ID",
      "adFee": "광고비",
      "orderDiv": "주문구분",
      "orderDt": "주문일자",
      "orderTm": "주문시간",
      "settleDt": "정산일",
      "orderNo": "주문번호",
      "orderName": "주문명",
      "deliveryType": "배달유형",
      "totalAmt": "총금액",
      "discntAmt": "할인금액",
      "orderFee": "주문수수료",
      "cardFee": "카드수수료",
      "deliveryAmt": "배달비",
      "addTax": "부가세",
      "settleAmt": "정산금액",
      "detailList": [{
        "unitPrice": "단가",
        "quantity": "수량",
        "salePrice": "판매가",
        "name": "메뉴명",
        "options": [{
          "optionPrice": "옵션가격",
          "optionName": "옵션명",
          "optionQuantity": "옵션수량"
        }]
      }]
    }]
  }
}
```

### 3-3. 요기요 API (동일 패턴)

| API | 엔드포인트 | Body 필드 |
|-----|-----------|----------|
| 리뷰내역조회 | `POST /in0023000085` | userId, userPw, dateFrom, dateTo |
| 주문내역조회 | `POST /in0023000077` | userId, userPw, dateFrom, dateTo |

> 요기요도 동일하게 요기요 계정의 userId/userPw를 사용합니다.

### 3-4. 배달의민족 API (동일 패턴)

| API | 엔드포인트 | Body 필드 |
|-----|-----------|----------|
| 리뷰내역조회 | `POST /in0022000083` | userId, userPw, dateFrom, dateTo |
| 주문내역조회 | `POST /in0022000066` | userId, userPw, dateFrom, dateTo |

> 배민도 동일하게 배민 계정의 userId/userPw를 사용합니다.

### 3-5. 네이버리뷰 API

| API | 엔드포인트 |
|-----|-----------|
| API 1 | `POST /in0019000058` |
| API 2 | `POST /in0019000057` |
| API 3 | `POST /in0019000056` |

> 네이버 플레이스 리뷰 수집용. 상세 필드는 Expand 후 확인 필요.

---

## 4. 신용카드사 API 상세 (seq=14)

### 카드사 코드표

| 코드 | 카드사 |
|------|--------|
| 001 | 신한카드 |
| 002 | 현대카드 |
| 003 | 삼성카드 |
| 004 | KB국민카드 |
| 005 | 롯데카드 |
| 006 | 하나카드 |
| 007 | 우리카드 |
| 008 | 농협카드 |
| 010 | BC카드 |

### 4-1. 카드 입금내역(정산) 조회 ★핵심

```
POST https://api.hyphen.im/in0007000769
```

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| cardCd | string | O | 카드사코드 (위 표 참조) |
| loginMethod | string | O | 로그인방법 (`ID`: 아이디 로그인만 지원) |
| userId | string | O | 카드사 사용자아이디 |
| userPw | string | O | 카드사 사용자비밀번호 |
| sdate | string | O | 조회시작일 (yyyymmdd) |
| edate | string | O | 조회종료일 (yyyymmdd) |
| memberYn | string | X | 가맹점조회 (`Y`/`N`) |
| memberNo | string | X | 가맹점번호 |

**Response (200):**

```json
{
  "common": { ... },
  "data": {
    "list": [{
      "payDt": "입금일",
      "paySchDt": "입금예정일",
      "recDt": "접수일",
      "totalCnt": "총건수",
      "payCnt": "입금건수",
      "canCnt": "취소건수",
      "curCd": "통화",
      "useDiv": "사용구분",
      "useCard": "사용카드",
      "salesAmt": "매출금액",
      "salesSchAmt": "매출예정금액",
      "payAmt": "입금금액",
      "paySchAmt": "입금예정금액",
      "adjAmt": "조정금액",
      "canAmt": "취소금액",
      "deductAmt": "차감금액",
      "repayAmt": "환불금액",
      "wthAmt": "보류금액",
      "canFee": "취소수수료",
      "svcFee": "서비스수수료",
      "whtTax": "원천세",
      "feeSum": "수수료합계",
      "feeMem": "가맹점수수료",
      "feeIntr": "할부이자",
      "feeInst": "할부수수료",
      "feeEtc": "기타수수료",
      "feePoint": "포인트수수료",
      "feeDisc": "할인수수료",
      "feeVat": "부가세",
      "feeTop": "상위수수료",
      "feePart": "분담수수료",
      "vatAmt": "부가세금액",
      "check_Cnt": "체크카드건수",
      "check_Amt": "체크카드금액",
      "check_Fee": "체크카드수수료",
      "check_SvcFee": "체크서비스수수료",
      "union_Cnt": "제휴건수",
      "union_Amt": "제휴금액",
      "union_Fee": "제휴수수료",
      "union_SvcFee": "제휴서비스수수료"
    }]
  }
}
```

**fetch 예시:**

```javascript
fetch('https://api.hyphen.im/in0007000769', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Id': 'HYPHEN_USER_ID',
    'Hkey': 'HYPHEN_HKEY'
  },
  body: JSON.stringify({
    cardCd: '001',        // 신한카드
    loginMethod: 'ID',
    userId: '카드사_아이디',
    userPw: '카드사_비밀번호',
    sdate: '20260301',
    edate: '20260320',
    memberYn: 'N'
  })
})
```

### 4-2. 카드 매입내역 조회 ★핵심

```
POST https://api.hyphen.im/in0007000768
```

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| cardCd | string | O | 카드사코드 |
| loginMethod | string | O | `ID` |
| userId | string | O | 카드사 아이디 |
| userPw | string | O | 카드사 비밀번호 |
| sdate | string | O | 조회시작일 (yyyymmdd) |
| edate | string | O | 조회종료일 (yyyymmdd) |
| searchType | string | X | `1`: 매입일 기준, `2`: 승인일 기준 |
| memberYn | string | X | 가맹점조회 (`Y`/`N`) |
| memberNo | string | X | 가맹점번호 |
| sourceDetailYn | string | X | 원인전표 상세 (`Y`/`N`), KB국민카드 searchType:1만 |

**Response**: 입금내역과 동일 구조 + `memberNo`, `memberNm` 추가

### 4-3. 카드 승인내역 조회 ★핵심

```
POST https://api.hyphen.im/in0007000033
```

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| cardCd | string | O | 카드사코드 |
| loginMethod | string | O | `ID` |
| userId | string | O | 카드사 아이디 |
| userPw | string | O | 카드사 비밀번호 |
| sdate | string | O | 조회시작일 (yyyymmdd) |
| edate | string | O | 조회종료일 (yyyymmdd) |
| useArea | string | X | `N`: 전체, `D`: 국내, `G`: 해외 (신한카드 전용) |
| iqryDiv | string | X | `1`: 전체, `2`: 신한은행 등 (신한카드 전용) |
| memberYn | string | X | 가맹점조회 (`Y`/`N`) |
| memberNo | string | X | 가맹점번호 |
| cardPw | string | X | 카드 비밀번호 |
| phNo | string | X | 핸드폰번호 |
| mobileCo | string | X | 통신사 (SKT/KTF/LGT/SKM/KTM/LGM) |
| regNo | string | X | 주민번호 앞자리+뒷자리 첫번호 |
| name | string | X | 이름 |
| step | string | X | 본인인증 단계 (`init`: 문자요청, `sign`: 인증) |
| step_data | string | X | 이전 step 결과의 step_data |
| authNum | string | X | 문자 인증번호 |

**Response (200):**

```json
{
  "common": { ... },
  "data": {
    "list": [{
      "appDt": "승인일자",
      "appTm": "승인시간",
      "appNo": "승인번호",
      "appAmt": "승인금액",
      "useCard": "사용카드",
      "useDiv": "사용구분",
      "instMon": "할부개월",
      "cardType": "카드유형",
      "appMethod": "승인방법",
      "appSt": "승인상태",
      "pchDt": "매입일",
      "appCancel": "승인취소여부",
      "pchCancel": "매입취소여부",
      "fee": "수수료",
      "payDt": "입금일",
      "payAmt": "입금금액",
      "comDiv": "구분",
      "svcFee": "서비스수수료",
      "exYn": "제외여부"
    }],
    "step_data": "다음단계용 데이터"
  }
}
```

### 4-4. 카드사 가맹점정보 조회

```
POST https://api.hyphen.im/in0007000031
```

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| cardCd | string | O | 카드사코드 |
| bizNo | string | O | 사업자번호 |
| regNo | string | X | 법인등록번호 |
| ownerBirthDay | string | X | 대표자 생년월일 |
| memberDiv | string | O | `1`: 개인, `2`: 법인 |

**Response (200):**

```json
{
  "common": { ... },
  "data": {
    "list": [{
      "memberDiv": "개인/법인",
      "memberNo": "가맹점번호",
      "memberNm": "가맹점명",
      "memberAddr": "가맹점주소",
      "ownerNm": "대표자명",
      "openDt": "개업일",
      "endDt": "폐업일",
      "activeYn": "활성여부",
      "state": "상태"
    }]
  }
}
```

---

## 5. 현재 코드 vs 실제 API 차이점

### 수정이 필요한 파일들

| 파일 | 현재 (잘못된 추정) | 실제 API |
|------|------------------|---------|
| `src/lib/hyphen/client.ts` | OAuth Bearer 토큰 인증 | `user-id` + `Hkey` 헤더 인증 |
| `src/lib/hyphen/sync-card.ts` | `GET /v1/card/approvals` | `POST /in0007000033` (승인), `/in0007000769` (입금) |
| `src/lib/hyphen/sync-delivery.ts` | `GET /v1/delivery/orders` | `POST /in0024000086` (쿠팡), `/in0023000077` (요기요), `/in0022000066` (배민) |
| `src/lib/hyphen/sync-review.ts` | `GET /v1/delivery/reviews` | `POST /in0024000800` (쿠팡), `/in0023000085` (요기요), `/in0022000083` (배민) |
| `src/lib/hyphen/normalizer.ts` | 추정 필드명 | 실제 필드명 (appDt, appAmt, reviewDt 등) |
| `src/lib/hyphen/oauth.ts` | OAuth 필수 | OAuth는 선택사항 (user-id + Hkey로 충분) |
| `src/lib/hyphen/encryption.ts` | 구조 OK | 배달앱 계정정보도 암호화 필요 |

### 핵심 차이 요약

1. **인증**: OAuth → `user-id` + `Hkey` 헤더 (단순화)
2. **엔드포인트**: RESTful 경로 → 거래코드 기반 (`/inXXXXXXXXXX`)
3. **HTTP 메서드**: GET → 전부 POST
4. **요청 구조**: Query params → JSON Body (플랫폼 로그인 정보 포함)
5. **응답 구조**: 직접 데이터 → `{ common: {...}, data: {...} }` 래퍼
6. **날짜 형식**: ISO → yyyymmdd
7. **배달앱**: 플랫폼별 사용자 계정(ID/PW) 필요 (하이픈이 대리 로그인)

---

## 6. sajang.ai 사용자 흐름

```
사용자(사장님)
  │
  ├─ 1. 하이픈 회원가입 → user-id, Hkey 발급
  │
  ├─ 2. sajang.ai 설정 페이지에서 입력:
  │     ├─ 하이픈 인증정보: user-id, Hkey
  │     ├─ 배달앱 계정 (선택):
  │     │   ├─ 배민 아이디/비밀번호
  │     │   ├─ 쿠팡이츠 아이디/비밀번호
  │     │   └─ 요기요 아이디/비밀번호
  │     └─ 카드사 계정 (선택):
  │         └─ 카드사코드 + 아이디/비밀번호 (카드사별)
  │
  ├─ 3. 모든 계정정보 AES-256-GCM으로 암호화 저장
  │
  └─ 4. 동기화 실행 (수동/자동)
        ├─ 배달앱: 각 플랫폼별 POST 요청
        ├─ 카드사: 각 카드사별 POST 요청
        └─ 결과를 revenues, delivery_reviews 테이블에 저장
```

---

## 7. 개발 우선순위

### Phase 1: MVP (현재)
1. 배달앱 3사 주문내역 → revenues 저장
2. 배달앱 3사 리뷰내역 → delivery_reviews 저장
3. 카드 승인내역 → revenues 저장

### Phase 2: 정산
4. 카드 입금내역 → 현금흐름 예측
5. 카드 매입내역 → 매입 상세

### Phase 3: 확장
6. 네이버리뷰 → delivery_reviews 확장
7. 카드사 가맹점정보 → 자동 설정

---

## 부록: 엔드포인트 빠른 참조

| 플랫폼 | 리뷰조회 | 주문조회 |
|--------|---------|---------|
| 쿠팡이츠 | `POST /in0024000800` | `POST /in0024000086` |
| 요기요 | `POST /in0023000085` | `POST /in0023000077` |
| 배달의민족 | `POST /in0022000083` | `POST /in0022000066` |
| 네이버리뷰 | `POST /in0019000058` | `POST /in0019000057`, `/in0019000056` |

| 카드사 API | 엔드포인트 |
|-----------|-----------|
| 입금내역(정산) | `POST /in0007000769` |
| 매입내역 | `POST /in0007000768` |
| 승인내역 | `POST /in0007000033` |
| 가맹점정보 | `POST /in0007000031` |
| 이메일중복확인 | `POST /in0007000032` |
| 아이디중복확인 | `POST /in0007000030` |
| 비밀번호재설정 | `POST /in0007000029` |
| 아이디찾기 | `POST /in0007000028` |
| 회원가입 | `POST /in0007000027` |

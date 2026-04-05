# SPEC-DAPJANGI-002 Acceptance Criteria

<!-- TAG: SPEC-DAPJANGI-002 -->

## Criteria

1. [ ] 새 리뷰 저장 시 감성 분석이 실행되어 sentiment_score가 저장된다
2. [ ] 감성 분석 결과에 sentiment_label(positive/neutral/negative)이 태깅된다
3. [ ] 기존 미분석 리뷰에 대해 배치 감성 분석이 실행 가능하다
4. [ ] "일괄 답글 생성" 클릭 시 미답변 리뷰 전체에 AI 답글 초안이 생성된다
5. [ ] 각 답글 초안을 개별 검토/수정할 수 있다
6. [ ] "일괄 게시" 클릭 시 선택된 답글이 일괄 저장된다
7. [ ] 감성 분석 실패가 리뷰 데이터에 영향을 주지 않는다

## Test Cases

### TC-01: 개별 리뷰 감성 분석

```
Given: "음식이 정말 맛있었어요! 배달도 빨라서 좋았습니다"라는 리뷰가 저장된다
When:  감성 분석이 실행된다
Then:  sentiment_score가 0.7 이상으로 저장된다
And:   sentiment_label이 "positive"로 태깅된다
```

### TC-02: 부정 리뷰 감성 분석

```
Given: "음식이 식어서 왔고 양도 적었습니다"라는 리뷰가 저장된다
When:  감성 분석이 실행된다
Then:  sentiment_score가 0.3 이하로 저장된다
And:   sentiment_label이 "negative"로 태깅된다
```

### TC-03: 배치 감성 분석

```
Given: sentiment_score가 null인 리뷰가 10건 존재한다
When:  배치 감성 분석을 실행한다
Then:  10건 모두 sentiment_score와 sentiment_label이 저장된다
And:   처리 중 오류가 발생한 건은 null로 유지되고 나머지는 정상 처리된다
```

### TC-04: 일괄 답글 생성

```
Given: 미답변 리뷰가 5건 존재한다
When:  "일괄 답글 생성" 버튼을 클릭한다
Then:  5건 각각에 대해 AI 답글 초안이 생성된다
And:   각 초안은 원본 리뷰의 맥락에 맞는 내용이다
And:   생성 중 로딩 인디케이터가 표시된다
```

### TC-05: 답글 검토 및 수정

```
Given: AI 답글 초안이 생성된 상태이다
When:  특정 답글 초안의 텍스트를 수정한다
Then:  수정된 내용이 해당 카드에 반영된다
And:   다른 답글에는 영향이 없다
```

### TC-06: 일괄 게시

```
Given: 5건의 답글 초안 중 3건을 체크박스로 선택했다
When:  "일괄 게시" 버튼을 클릭한다
Then:  선택된 3건만 DB에 저장된다
And:   미선택된 2건은 저장되지 않는다
And:   성공 토스트 메시지가 표시된다
```

### TC-07: 감성 분석 실패 격리

```
Given: 감성 분석 API 호출이 실패한다
When:  리뷰가 저장된다
Then:  리뷰 데이터는 정상적으로 저장된다
And:   sentiment_score는 null로 유지된다
And:   에러가 로그에 기록된다
```

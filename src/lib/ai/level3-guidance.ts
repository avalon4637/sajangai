// Phase 2.4 — Level 3 prescriptive guidance
//
// Centralizes the "처방형" directives we want every AI agent to follow.
// Instead of rewriting each engine's prompt in place (which risks breaking
// parsing layers), this module exports reusable strings that engines can
// append to their existing system prompt.
//
// The three levels, for reference:
//   L1 집계 — "매출 312,000원"
//   L2 해석 — "매출 32% 하락"
//   L3 처방 — "답글 3개 지금 보내세요 (+8~10만원 회복 기대)"
//
// Level 3 adds: concrete next action + quantitative expected impact + urgency.

/**
 * Universal Level 3 clause. Append this to any agent system prompt to nudge
 * the output from "observation" into "prescription".
 *
 * Usage:
 *   const prompt = `${BASE_PROMPT}\n\n${LEVEL_3_GUIDANCE}`;
 */
export const LEVEL_3_GUIDANCE = `## 처방형 출력 규칙 (Level 3)

관찰이나 해석에서 멈추지 말고, 항상 다음 3가지를 포함해.

1. **구체적 다음 행동** (1가지만, 오늘/이번 주 중 실행 가능)
   - 나쁜 예: "답글 관리가 필요해요"
   - 좋은 예: "배민 4점 미만 리뷰 3건에 답글 달기 (약 10분 소요)"

2. **정량적 기대 효과** (%, 원, 시간, 건수 중 하나 이상)
   - 나쁜 예: "매출이 개선될 수 있어요"
   - 좋은 예: "답글 달면 다음 주 주문 8~12% 회복 기대 (업종 평균 기준)"

3. **긴급도 표시** (오늘/이번 주/이번 달 중 1개)
   - 오늘: 24시간 내 매출/리뷰에 직접 영향
   - 이번 주: 미루면 다음 주에 체감되는 문제
   - 이번 달: 장기 트렌드로 누적되는 문제

## 피해야 할 표현

- "고려해보세요", "검토해보세요" 같은 애매한 제안
- 추측형 "~일 수 있어요" (단정적으로 "~예요"로)
- 여러 행동을 한 번에 나열 (한 번에 1개만)
- 구체성 없는 "최적화", "개선", "점검" 단독 사용`;

/**
 * Light variant for short-form messages (카톡 알림톡 템플릿처럼 90자 이내).
 * Keeps the prescriptive intent but trims verbosity.
 */
export const LEVEL_3_GUIDANCE_SHORT = `## 출력 규칙
- 한 문장으로 구체 행동 제시 (10~30자)
- 정량 수치 1개 포함 (%, 원, 건)
- "~하세요" 명령형으로 끝내기
- 추측 어휘("~수 있어요") 금지`;

/**
 * Append Level 3 guidance to an existing system prompt.
 * Returns the original prompt unchanged when the flag is disabled so callers
 * can easily A/B test by toggling a single env var.
 */
export function appendLevel3Guidance(
  basePrompt: string,
  options: { short?: boolean; enabled?: boolean } = {}
): string {
  const enabled =
    options.enabled ?? process.env.AI_LEVEL3_ENABLED !== "false";
  if (!enabled) return basePrompt;

  const clause = options.short ? LEVEL_3_GUIDANCE_SHORT : LEVEL_3_GUIDANCE;
  return `${basePrompt}\n\n${clause}`;
}

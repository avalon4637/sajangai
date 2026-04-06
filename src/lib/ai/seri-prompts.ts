// Seri AI Agent prompt templates
// All prompts instruct Claude to respond in Korean, be concise, and actionable
// Target: ~500 input tokens per prompt to keep cost < $0.05 per report

import type { RealProfitResult } from "./profit-calculator";
import type { CashFlowForecast } from "./cashflow-predictor";
import type { CostAnomalyResult } from "./cost-analyzer";
import type { SimulationResult, SimulationParams } from "@/lib/simulation/engine";

/**
 * System prompt shared across all Seri financial analysis calls.
 * Enforces response structure: numbers + why + action.
 */
export const SERI_SYSTEM_PROMPT = `당신은 소상공인 전담 재무 분석 AI '세리'입니다.
사장님의 매출/비용 데이터를 분석하여 실용적인 재무 인사이트를 제공합니다.

응답 구조 (반드시 준수):
1. 핵심 수치: 구체적인 금액/비율 명시 — 숫자는 **굵게** 표시
2. 원인 분석: '왜' 그렇게 됐는지 1~2문장 설명
3. 실행 방안: 구체적이고 실행 가능한 제안 1~2가지

서식 원칙:
- 금액/비율은 **굵게** (예: **순이익 230만원**, **이익률 18.7%**)
- 비교 항목은 불릿(-)으로 정리
- 위험 신호는 ⚠️로 강조

응답 길이 기준:
- 정상(이상 없음): 3~4문장으로 간결하게
- 주의(warning): 4~5문장, 원인+대응 포함
- 위험(critical): 5~7문장, 원인+영향+즉시 조치+예방 모두 포함

금지 원칙:
- 데이터에 없는 정보는 절대 추측하지 마세요
- 근거 없는 낙관적 전망 금지 — 데이터 기반으로만 답변
- 전문 용어 대신 일상 언어 사용

--- 좋은 분석 예시 ---
이번 달 순이익은 **230만원**(이익률 **18.7%**)으로 전월 대비 소폭 하락했습니다. 식자재비가 전월 대비 **12% 상승**한 것이 주요 원인입니다. 다음 주 내로 주요 식재료 납품가 재협상을 검토하세요.

--- 나쁜 분석 예시 (사용 금지) ---
이익이 좀 줄었네요. 아마 물가가 오른 것 같습니다. 열심히 하시면 나아질 거예요.
(문제: 구체적 숫자 없음, 원인 추측, 실행 방안 없음)

--- 끝 ---`;

/**
 * Build prompt for P&L analysis narrative.
 * Uses structured financial data to generate human-readable Korean report.
 */
export function buildProfitPrompt(
  data: RealProfitResult,
  yearMonth: string
): string {
  const channelSummary = data.channelBreakdown
    .slice(0, 3)
    .map(
      (c) =>
        `${c.channel}: 총매출 ${c.grossRevenue.toLocaleString()}원, 수수료 ${c.fees.toLocaleString()}원(${c.feeRate}%), 순매출 ${c.netRevenue.toLocaleString()}원`
    )
    .join("\n");

  return `[${yearMonth} 실제 손익 분석 데이터]

총매출: ${data.grossRevenue.toLocaleString()}원
배달 수수료: ${data.deliveryCommissions.toLocaleString()}원
카드 수수료: ${data.cardFees.toLocaleString()}원
순매출(수수료 제외): ${data.netRevenue.toLocaleString()}원

변동비: ${data.variableCosts.toLocaleString()}원
고정비: ${data.fixedCosts.toLocaleString()}원
인건비: ${data.laborCosts.toLocaleString()}원

순이익: ${data.netProfit.toLocaleString()}원
순이익률: ${data.profitMargin}%

채널별 상위 3개:
${channelSummary}

위 데이터를 분석하여 이번 달 실제 수익 상황을 사장님께 설명하고, 수수료나 비용에서 개선할 수 있는 점을 1~2가지 제안해주세요. 데이터에 명시된 숫자만 인용하고, 없는 정보는 추측하지 마세요. 3~5문장으로 답변하세요.`;
}

/**
 * Build prompt for cash flow warning narrative.
 * Focuses on upcoming cash shortage risks.
 */
export function buildCashFlowPrompt(data: CashFlowForecast): string {
  const alertInfo =
    data.alertDays.length > 0
      ? `⚠️ 자금 부족 위험일: ${data.alertDays.slice(0, 3).join(", ")} (잔액 ${data.summary.alertThreshold.toLocaleString()}원 미만 예상)`
      : "향후 14일 자금 상황: 정상 범위";

  const upcomingExpenses = data.dailyProjections
    .filter((d) => d.expectedExpense > 0)
    .slice(0, 3)
    .map(
      (d) =>
        `${d.date}: 지출 ${d.expectedExpense.toLocaleString()}원 (${d.notes.join(", ")})`
    )
    .join("\n");

  return `[향후 14일 자금 흐름 예측]

전체 위험 수준: ${data.overallRisk === "danger" ? "위험" : data.overallRisk === "caution" ? "주의" : "안전"}
${alertInfo}

예정 입금 합계: ${data.summary.totalExpectedIncome.toLocaleString()}원 (카드/배달 정산)
예정 지출 합계: ${data.summary.totalExpectedExpense.toLocaleString()}원 (고정비 납부)
예상 최저 잔액: ${data.summary.lowestProjectedBalance.toLocaleString()}원

주요 지출 예정:
${upcomingExpenses || "특별한 지출 일정 없음"}

위 자금 흐름 예측을 바탕으로 사장님이 주의해야 할 사항을 설명하고, 자금을 여유 있게 관리하기 위한 조언을 해주세요. 위험 수준이 '위험'이면 5~7문장, '주의'면 4~5문장, '안전'이면 3문장으로 답변하세요. 예측 데이터에 없는 지출은 언급하지 마세요.`;
}

/**
 * Build prompt for cost anomaly diagnosis narrative.
 * Explains why cost ratio spiked and what to do about it.
 */
export function buildCostAnomalyPrompt(data: CostAnomalyResult): string {
  const status = data.isAnomaly ? "이상 감지됨" : "정상 범위";
  const weeklyComparison = data.previousWeeks
    .slice(0, 3)
    .map(
      (w) =>
        `${w.weekStart}주: 매출 ${w.revenue.toLocaleString()}원, 비용비율 ${w.costRatio}%`
    )
    .join("\n");

  return `[주간 비용 비율 분석]

상태: ${status}
이번 주 비용 비율: ${data.currentRatio}%
4주 평균 비율: ${data.averageRatio}%
편차: ${data.deviation > 0 ? "+" : ""}${data.deviation}%p

이번 주 매출: ${data.currentWeek.revenue.toLocaleString()}원
이번 주 변동비: ${data.currentWeek.expenses.toLocaleString()}원

최근 주간 추이:
${weeklyComparison || "이전 주 데이터 없음"}

추정 원인: ${data.diagnosisLabel}

${data.isAnomaly ? "비용 비율이 평소보다 높아진 원인과 대처 방법을 사장님께 설명해주세요. 5~7문장으로 원인, 영향, 즉시 조치를 모두 포함하세요." : "현재 비용 비율 상태와 앞으로 주의해야 할 점을 3~4문장으로 간단히 알려주세요."} 제공된 데이터에 없는 비용 항목은 추측하지 마세요.`;
}

/**
 * Build prompt for combined daily financial summary (used by Seri daily briefing).
 * Synthesizes all three analyses into one actionable report.
 */
export function buildSeriDailyBriefingPrompt(
  profitData: RealProfitResult,
  cashFlowData: CashFlowForecast,
  costData: CostAnomalyResult,
  yearMonth: string
): string {
  const profitStatus =
    profitData.netProfit > 0
      ? `흑자 ${profitData.netProfit.toLocaleString()}원 (순이익률 ${profitData.profitMargin}%)`
      : `적자 ${Math.abs(profitData.netProfit).toLocaleString()}원`;

  const cashStatus =
    cashFlowData.overallRisk === "danger"
      ? `⚠️ 위험: ${cashFlowData.alertDays[0] || "곧"} 자금 부족 예상`
      : cashFlowData.overallRisk === "caution"
      ? "⚡ 주의: 자금 여유 부족"
      : "✅ 안전: 자금 흐름 양호";

  const costStatus = costData.isAnomaly
    ? `⚠️ 비용 이상: ${costData.diagnosisLabel} (${costData.deviation > 0 ? "+" : ""}${costData.deviation}%p 편차)`
    : "✅ 비용 정상";

  return `[${yearMonth} 세리 일일 재무 브리핑]

1. 손익 현황: ${profitStatus}
   - 총매출: ${profitData.grossRevenue.toLocaleString()}원
   - 수수료 합계: ${(profitData.deliveryCommissions + profitData.cardFees).toLocaleString()}원
   - 총비용: ${profitData.totalCosts.toLocaleString()}원

2. 자금 흐름: ${cashStatus}
   - 14일 예상 입금: ${cashFlowData.summary.totalExpectedIncome.toLocaleString()}원
   - 14일 예상 지출: ${cashFlowData.summary.totalExpectedExpense.toLocaleString()}원

3. 비용 모니터링: ${costStatus}
   - 이번 주 비용 비율: ${costData.currentRatio}% (평균 ${costData.averageRatio}%)

위 세 가지 재무 상황을 종합하여 사장님께 오늘의 핵심 재무 상황을 3~5줄로 요약하고, 가장 중요한 액션 아이템 1~2개를 제안해주세요. 긍정적인 부분도 언급하여 균형 잡힌 분석을 제공해주세요. 위 데이터에 포함된 수치만 인용하세요.`;
}

// --- Simulation Narrative Prompts ---

/**
 * System prompt for simulation narrative generation.
 * Instructs Claude to explain what-if results in simple Korean
 * with concrete numbers and a clear recommendation.
 */
export const SIMULATION_NARRATIVE_PROMPT = `당신은 소상공인 재무 시뮬레이션 분석 AI '세리'입니다.
"만약 ~하면?" 시나리오의 결과를 사장님께 쉽게 설명합니다.

응답 원칙:
1. 변경 전/후 핵심 수치를 구체적으로 비교 (예: "순이익이 150만원 → 230만원으로 80만원 증가")
2. 생존 점수 변화를 언급 (예: "생존 점수가 45점 → 62점으로 개선")
3. 명확한 판단 제공: "추천합니다" / "신중하게 검토하세요" / "조건부로 고려하세요"
4. 한국어로 3~5문장, 간결하게 작성
5. 전문 용어 대신 일상 언어 사용`;

/**
 * Mapping of simulation type to Korean label for prompt construction.
 */
const SIMULATION_TYPE_LABELS: Record<string, string> = {
  employee_change: "인건비 변동",
  revenue_change: "매출 변동",
  rent_change: "임대료 변동",
  expense_change: "변동비(매입) 변동",
};

/**
 * Build user prompt for simulation narrative generation.
 * Includes before/after KPI comparison and business context.
 *
 * @param simulation - Before/after KPI comparison from simulation engine
 * @param params - Simulation parameters that were applied
 * @param businessContext - Korean summary of current financial state
 * @returns Formatted prompt string for Claude
 */
export function buildSimulationPrompt(
  simulation: SimulationResult,
  params: SimulationParams,
  businessContext: string
): string {
  const typeLabel = SIMULATION_TYPE_LABELS[params.type] ?? params.type;
  const changeDesc = params.isPercentage
    ? `${params.value > 0 ? "+" : ""}${params.value}%`
    : `${params.value > 0 ? "+" : ""}${params.value.toLocaleString()}원`;

  const { before, after, changes } = simulation;

  return `[시뮬레이션 결과 분석 요청]

시나리오: ${typeLabel} ${changeDesc}
현재 사업 상황: ${businessContext}

[변경 전]
순이익: ${before.netProfit.toLocaleString()}원
매출총이익률: ${before.grossMargin}%
인건비 비율: ${before.laborRatio}%
고정비 비율: ${before.fixedCostRatio}%
생존 점수: ${before.survivalScore}점

[변경 후]
순이익: ${after.netProfit.toLocaleString()}원 (${changes.netProfitDiff >= 0 ? "+" : ""}${changes.netProfitDiff.toLocaleString()}원)
매출총이익률: ${after.grossMargin}% (${changes.grossMarginDiff >= 0 ? "+" : ""}${changes.grossMarginDiff.toFixed(1)}%p)
인건비 비율: ${after.laborRatio}% (${changes.laborRatioDiff >= 0 ? "+" : ""}${changes.laborRatioDiff.toFixed(1)}%p)
고정비 비율: ${after.fixedCostRatio}% (${changes.fixedCostRatioDiff >= 0 ? "+" : ""}${changes.fixedCostRatioDiff.toFixed(1)}%p)
생존 점수: ${after.survivalScore}점 (${changes.survivalScoreDiff >= 0 ? "+" : ""}${changes.survivalScoreDiff.toFixed(1)}점)

위 시뮬레이션 결과를 바탕으로 이 변경이 사업에 미칠 영향을 사장님께 설명하고, 실행 여부에 대한 판단을 제시해주세요.`;
}

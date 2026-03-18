// Seri AI Agent prompt templates
// All prompts instruct Claude to respond in Korean, be concise, and actionable
// Target: ~500 input tokens per prompt to keep cost < $0.05 per report

import type { RealProfitResult } from "./profit-calculator";
import type { CashFlowForecast } from "./cashflow-predictor";
import type { CostAnomalyResult } from "./cost-analyzer";

/**
 * System prompt shared across all Seri financial analysis calls.
 */
export const SERI_SYSTEM_PROMPT = `당신은 소상공인 전담 재무 분석 AI '세리'입니다.
사장님의 매출/비용 데이터를 분석하여 실용적인 재무 인사이트를 제공합니다.

응답 원칙:
- 한국어로 간결하게 작성 (3~5문장)
- 숫자는 구체적으로 언급 (예: "순이익 123만원")
- 위험 신호는 명확하게 경고
- 실행 가능한 개선 제안 1~2개 포함
- 전문 용어 대신 일상 언어 사용`;

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

위 데이터를 분석하여 이번 달 실제 수익 상황을 사장님께 설명하고, 수수료나 비용에서 개선할 수 있는 점을 1~2가지 제안해주세요.`;
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

위 자금 흐름 예측을 바탕으로 사장님이 주의해야 할 사항을 설명하고, 자금을 여유 있게 관리하기 위한 조언을 해주세요.`;
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

${data.isAnomaly ? "비용 비율이 평소보다 높아진 원인과 대처 방법을 사장님께 설명해주세요." : "현재 비용 비율 상태와 앞으로 주의해야 할 점을 간단히 알려주세요."}`;
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

위 세 가지 재무 상황을 종합하여 사장님께 오늘의 핵심 재무 상황을 3~5줄로 요약하고, 가장 중요한 액션 아이템 1~2개를 제안해주세요. 긍정적인 부분도 언급하여 균형 잡힌 분석을 제공해주세요.`;
}

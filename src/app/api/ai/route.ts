import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import type { KpiResult } from "@/lib/kpi/calculator";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { kpiData, businessType } = (await req.json()) as {
    kpiData: KpiResult;
    businessType?: string;
  };

  const systemPrompt = `당신은 소상공인 경영 분석 AI 비서입니다.
주어진 KPI 데이터를 분석하여 사장님이 이해하기 쉬운 한국어로 경영 인사이트를 제공하세요.

분석 원칙:
- 간결하고 직관적으로 작성 (3~5줄)
- 위험 요소가 있으면 구체적으로 경고
- 개선 가능한 액션을 1~2개 제안
- 전문 용어 대신 일상 언어 사용`;

  const userPrompt = `다음은 ${businessType || "소상공인"} 사업장의 이번 달 경영 지표입니다:

- 매출총이익: ${kpiData.grossProfit.toLocaleString()}원
- 순이익: ${kpiData.netProfit.toLocaleString()}원
- 매출총이익률: ${kpiData.grossMargin}%
- 인건비 비율: ${kpiData.laborRatio}%
- 고정비 비율: ${kpiData.fixedCostRatio}%
- 생존 점수: ${kpiData.survivalScore}/100

이 데이터를 기반으로 경영 상태를 분석하고 인사이트를 제공해주세요.`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: systemPrompt,
    prompt: userPrompt,
  });

  return result.toTextStreamResponse();
}

import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/api/rate-limit";
import { z } from "zod";

const AiRequestSchema = z.object({
  kpiData: z.object({
    grossProfit: z.number(),
    netProfit: z.number(),
    grossMargin: z.number(),
    laborRatio: z.number(),
    fixedCostRatio: z.number(),
    survivalScore: z.number(),
  }),
  businessType: z.string().optional(),
});

export const maxDuration = 30;

export async function POST(req: Request) {
  // Authentication check (must come before rate limit to use user.id as key)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(
      JSON.stringify({ error: "인증이 필요합니다." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limiting: 10 requests per minute (keyed by user.id to prevent IP spoofing)
  const rlKey = getRateLimitKey(req, "ai", user.id);
  const rl = checkRateLimit(rlKey, 10);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Request body validation
  const body = await req.json();
  const parsed = AiRequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "잘못된 요청 형식입니다.", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { kpiData, businessType } = parsed.data;

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
    model: anthropic("claude-sonnet-4-5-20250514"),
    system: systemPrompt,
    prompt: userPrompt,
  });

  return result.toTextStreamResponse();
}

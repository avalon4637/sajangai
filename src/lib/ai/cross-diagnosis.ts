// Phase 1.4 — AI cross-signal diagnosis (Level 3 prescriptive)
// Takes a revenue-delta + negative-review snapshot and produces a concrete
// root cause + actionable steps via Claude Haiku.
//
// Complements the rule-based cross-analyzer.ts (deterministic pattern matching)
// by adding AI interpretation of review text content.
//
// Design goals:
//   - Cheap (Haiku, bounded token budget ~768)
//   - Deterministic output shape (Zod validated)
//   - Safe fallback when AI fails → rule-based template
//   - Safe when no meaningful signal → returns null

import { z } from "zod/v4";
import { callClaudeObject } from "./claude-client";
import type { RevenueReviewCrossSnapshot } from "@/lib/insights/cross-query";

export interface CrossDiagnosis {
  rootCause: string;
  severity: "critical" | "warning" | "info";
  topComplaints: string[];
  actionableSteps: Array<{
    label: string;
    reason: string;
    urgency: "today" | "this_week" | "this_month";
  }>;
  expectedImpact: string;
  confidence: number; // 0.0 ~ 1.0
  source: "ai" | "fallback";
}

// Zod schema for the AI response portion (source/confidence injected afterwards)
const diagnosisSchema = z.object({
  rootCause: z.string().min(5).max(200),
  severity: z.enum(["critical", "warning", "info"]),
  topComplaints: z.array(z.string()).max(5),
  actionableSteps: z
    .array(
      z.object({
        label: z.string().min(3).max(80),
        reason: z.string().min(5).max(200),
        urgency: z.enum(["today", "this_week", "this_month"]),
      })
    )
    .min(1)
    .max(3),
  expectedImpact: z.string().min(5).max(200),
});

const SYSTEM_PROMPT = `당신은 한국 소상공인을 돕는 AI 점장의 진단 보조예요.
매출 변동 데이터와 최근 부정 리뷰 본문을 받아서 가장 가능성 높은 근본 원인과
사장님이 실행할 수 있는 구체 행동을 제시해요.

규칙:
- rootCause는 한 문장으로 단정적으로
- topComplaints는 리뷰 본문에서 발견된 공통 불만 (중복 제거, 최대 5개)
- actionableSteps는 우선순위 순으로 최대 3개. 각 step은 today/this_week/this_month 중 하나
- expectedImpact는 정량 표현 포함 (%, 건, 원)
- severity는 매출 하락 폭 + 리뷰 긴급도 조합으로 판단
- 한국어 반말/친근체로 작성
- JSON으로만 응답해요. 추가 설명 없음`;

function buildUserPrompt(snapshot: RevenueReviewCrossSnapshot): string {
  const reviewLines = snapshot.negativeReviews
    .slice(0, 10)
    .map(
      (r, i) =>
        `${i + 1}. [${r.platform} / ${r.rating}점] ${r.content.slice(0, 200)}`
    )
    .join("\n");

  return `[매출]
- 이번 주: ${snapshot.revenueThisWeek.toLocaleString()}원
- 지난 주: ${snapshot.revenuePrevWeek.toLocaleString()}원
- 변동률: ${snapshot.revenueDeltaPct.toFixed(1)}%

[최근 7일 부정 리뷰 ${snapshot.negativeReviews.length}건${
    snapshot.unrepliedCount > 0 ? ` (미답변 ${snapshot.unrepliedCount}건)` : ""
  }]
${reviewLines || "(리뷰 없음)"}

위 신호들 사이의 인과를 분석해서 JSON으로 진단해 주세요.`;
}

/**
 * Rule-based fallback when AI call fails but snapshot still has signal.
 */
export function fallbackCrossDiagnosis(
  snapshot: RevenueReviewCrossSnapshot
): CrossDiagnosis {
  const negCount = snapshot.negativeReviews.length;
  const absDelta = Math.abs(snapshot.revenueDeltaPct);

  return {
    rootCause:
      negCount > 0
        ? `최근 7일 매출이 ${absDelta.toFixed(1)}% 움직였고 부정 리뷰 ${negCount}건과 시기가 겹쳐.`
        : `최근 7일 매출이 ${absDelta.toFixed(1)}% 움직였어.`,
    severity:
      absDelta >= 25 ? "critical" : absDelta >= 15 ? "warning" : "info",
    topComplaints: [],
    actionableSteps: [
      {
        label:
          snapshot.unrepliedCount > 0
            ? `미답변 리뷰 ${snapshot.unrepliedCount}건에 답글 달기`
            : "부정 리뷰 원인 점검",
        reason: "고객 신뢰 회복의 첫 단계는 답글이에요",
        urgency: "today",
      },
    ],
    expectedImpact:
      absDelta >= 15
        ? "답글 + 운영 개선 시 매출 5~10% 회복 기대"
        : "관찰 유지 필요",
    confidence: 0.4,
    source: "fallback",
  };
}

/**
 * Analyze the cross-signal between revenue drop and negative reviews.
 *
 * Returns null when there is not enough signal (delta <10% AND 0 negative reviews).
 * Returns a CrossDiagnosis with source='ai' on success or source='fallback'
 * when AI fails but data shape is still meaningful.
 */
export async function analyzeRevenueReviewCross(
  snapshot: RevenueReviewCrossSnapshot,
  options: { caller?: string } = {}
): Promise<CrossDiagnosis | null> {
  // Gate: require at least one signal
  if (
    snapshot.negativeReviews.length === 0 &&
    Math.abs(snapshot.revenueDeltaPct) < 10
  ) {
    return null;
  }

  try {
    const result = await callClaudeObject(
      SYSTEM_PROMPT,
      buildUserPrompt(snapshot),
      diagnosisSchema,
      768,
      {
        caller: options.caller ?? "cross-diagnosis",
        businessId: snapshot.businessId,
      }
    );

    const baseConfidence = Math.min(
      0.9,
      0.5 +
        Math.abs(snapshot.revenueDeltaPct) / 200 +
        snapshot.negativeReviews.length * 0.02
    );

    return {
      rootCause: result.rootCause,
      severity: result.severity,
      topComplaints: result.topComplaints,
      actionableSteps: result.actionableSteps,
      expectedImpact: result.expectedImpact,
      confidence: Math.round(baseConfidence * 100) / 100,
      source: "ai",
    };
  } catch (err) {
    console.error(
      "[cross-diagnosis] AI call failed, falling back to rule-based:",
      err
    );
    return fallbackCrossDiagnosis(snapshot);
  }
}

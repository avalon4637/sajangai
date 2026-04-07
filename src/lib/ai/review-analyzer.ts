// Weekly review analysis engine for Dapjangi (review manager agent)
// Analyzes recent customer reviews and generates actionable insights
// Results are cached in daily_reports table as "review_weekly" type

import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { callClaudeObject } from "./claude-client";

// ─── Schema ──────────────────────────────────────────────────────────────────

const ReviewAnalysisSchema = z.object({
  summary: z.string().describe("One-line summary of this week's reviews"),
  stats: z.object({
    newCount: z.number(),
    positiveCount: z.number(),
    negativeCount: z.number(),
    neutralCount: z.number(),
    avgRating: z.number(),
    ratingChange: z.number().describe("Change vs previous period"),
  }),
  positiveKeywords: z
    .array(
      z.object({
        keyword: z.string(),
        count: z.number(),
        example: z.string().describe("Example review snippet"),
      })
    )
    .max(5),
  negativeKeywords: z
    .array(
      z.object({
        keyword: z.string(),
        count: z.number(),
        example: z.string().describe("Example review snippet"),
      })
    )
    .max(5),
  trends: z
    .array(
      z.object({
        type: z.enum(["improving", "declining", "new"]),
        description: z.string(),
      })
    )
    .max(3),
  actions: z
    .array(
      z.object({
        priority: z.number().min(1).max(3),
        action: z.string(),
        reason: z.string(),
        expectedImpact: z.string(),
      })
    )
    .max(3),
  marketingPoints: z
    .array(
      z.object({
        keyword: z.string(),
        suggestion: z.string(),
      })
    )
    .max(3),
});

export type ReviewAnalysis = z.infer<typeof ReviewAnalysisSchema>;

export interface WeeklyReviewResult {
  success: boolean;
  analysis?: ReviewAnalysis;
  reviewCount: number;
  error?: string;
}

// ─── System prompt ───────────────────────────────────────────────────────────

const REVIEW_ANALYSIS_SYSTEM_PROMPT = `당신은 F&B 소상공인 리뷰 분석 전문가입니다.
고객 리뷰를 분석하여 사장님이 즉시 행동할 수 있는 인사이트를 도출하세요.

규칙:
- 숫자와 근거를 반드시 포함 ("양이 적다" 불만 3건 등)
- 긍정 키워드는 마케팅 활용 포인트와 함께 제안
- 전문 용어 대신 사장님이 이해할 수 있는 쉬운 말로 설명
- 한국어로 모든 분석 결과를 작성하세요`;

// ─── Main analysis function ──────────────────────────────────────────────────

// @MX:ANCHOR: Weekly review analysis entry point - called by cron and manual API
// @MX:REASON: Fan-in from /api/cron/weekly-review and /api/dapjangi/weekly-analysis

/**
 * Analyze recent reviews for a business and generate structured insights.
 * Fetches up to 200 most recent reviews, runs AI analysis via Claude,
 * and saves the result to daily_reports table.
 *
 * @param businessId - UUID of the target business
 * @returns Structured analysis result with success/error status
 */
export async function analyzeWeeklyReviews(
  businessId: string
): Promise<WeeklyReviewResult> {
  const supabase = await createClient();

  // Fetch recent 200 reviews (all platforms)
  const { data: reviews, error } = await supabase
    .from("delivery_reviews")
    .select(
      "rating, content, review_date, platform, customer_name, reply_status"
    )
    .eq("business_id", businessId)
    .order("review_date", { ascending: false })
    .limit(200);

  if (error || !reviews || reviews.length === 0) {
    return {
      success: false,
      reviewCount: 0,
      error: error?.message ?? "No reviews found",
    };
  }

  // Count this week's new reviews (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekReviews = reviews.filter(
    (r) => new Date(r.review_date) >= weekAgo
  );

  const pendingCount = reviews.filter(
    (r) => r.reply_status === "pending"
  ).length;

  // Build review text for AI (numbered, with metadata)
  const reviewText = reviews
    .map(
      (r, i) =>
        `[${i + 1}] ★${r.rating} | ${r.platform} | ${r.review_date} | ${r.content || "(내용 없음)"}`
    )
    .join("\n");

  // Call Claude for structured analysis via shared client
  const analysis = await callClaudeObject(
    REVIEW_ANALYSIS_SYSTEM_PROMPT,
    `다음 ${reviews.length}건의 리뷰를 분석해주세요.
이번 주 신규 리뷰: ${thisWeekReviews.length}건
미답변 리뷰: ${pendingCount}건

${reviewText}`,
    ReviewAnalysisSchema,
    2048
  );

  // Save to daily_reports for caching and history
  await supabase.from("daily_reports").insert({
    business_id: businessId,
    report_date: new Date().toISOString().split("T")[0],
    report_type: "dapjangi_review",
    summary: analysis.summary,
    content: analysis as unknown as Record<string, unknown>,
  });

  return {
    success: true,
    analysis,
    reviewCount: reviews.length,
  };
}

// Sentiment Analyzer
// Batch analyzes delivery reviews for keywords, sentiment scores, and trend detection
// Groups results by category: 맛, 양, 배달, 서비스, 가격, 위생, 기타

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import {
  SENTIMENT_BATCH_PROMPT,
  REVIEW_INSIGHTS_PROMPT,
} from "./dapjangi-prompts";

const CLAUDE_MODEL = "claude-sonnet-4-6";

export type ReviewCategory = "맛" | "양" | "배달" | "서비스" | "가격" | "위생" | "기타";

export interface ReviewSentimentResult {
  id: string;
  sentimentScore: number;
  keywords: string[];
  category: ReviewCategory;
}

export interface TrendPattern {
  pattern: string;
  count: number;
  category: ReviewCategory;
}

export interface BatchAnalysisResult {
  results: ReviewSentimentResult[];
  trends: TrendPattern[];
}

export interface ReviewInsights {
  summary: string;
  topPositiveKeywords: string[];
  topNegativeKeywords: string[];
  sentimentTrend: "improving" | "declining" | "stable";
  actionableRecommendations: string[];
  avgRating: number;
  totalReviews: number;
}

interface ReviewForAnalysis {
  id: string;
  rating: number;
  content: string | null;
}

/**
 * Analyze a batch of reviews for sentiment, keywords, and trends.
 * Processes in groups of 20 to stay within token limits.
 *
 * @param reviews - Array of reviews with id, rating, and content
 * @returns Batch analysis with per-review results and trend patterns
 */
export async function analyzeReviewBatch(
  reviews: ReviewForAnalysis[]
): Promise<BatchAnalysisResult> {
  if (reviews.length === 0) {
    return { results: [], trends: [] };
  }

  const anthropic = createAnthropic();
  const model = anthropic(CLAUDE_MODEL);

  // Process in groups of 20 reviews to stay within token limits
  const BATCH_SIZE = 20;
  const allResults: ReviewSentimentResult[] = [];
  const allTrends: TrendPattern[] = [];

  for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
    const batch = reviews.slice(i, i + BATCH_SIZE);
    const reviewsJson = JSON.stringify(
      batch.map((r) => ({
        id: r.id,
        rating: r.rating,
        content: r.content ?? "",
      }))
    );

    const prompt = SENTIMENT_BATCH_PROMPT.replace("{REVIEWS_JSON}", reviewsJson);

    const { text } = await generateText({
      model,
      prompt,
      maxOutputTokens: 1024,
    });

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;

      const parsed = JSON.parse(jsonMatch[0]) as {
        results: Array<{
          id: string;
          sentiment_score: number;
          keywords: string[];
          category: ReviewCategory;
        }>;
        trends: Array<{
          pattern: string;
          count: number;
          category: ReviewCategory;
        }>;
      };

      if (Array.isArray(parsed.results)) {
        allResults.push(
          ...parsed.results.map((r) => ({
            id: r.id,
            sentimentScore: clampScore(r.sentiment_score),
            keywords: r.keywords ?? [],
            category: (r.category as ReviewCategory) ?? "기타",
          }))
        );
      }

      if (Array.isArray(parsed.trends)) {
        allTrends.push(
          ...parsed.trends.map((t) => ({
            pattern: t.pattern,
            count: t.count,
            category: (t.category as ReviewCategory) ?? "기타",
          }))
        );
      }
    } catch {
      // Skip malformed response and continue with next batch
      continue;
    }
  }

  return { results: allResults, trends: allTrends };
}

/**
 * Generate a comprehensive weekly review insights summary.
 *
 * @param businessId - UUID of the business
 * @param period - Period string (YYYY-MM or YYYY-WXX)
 * @returns Human-readable Korean insights report
 */
export async function getReviewInsights(
  businessId: string,
  period: string
): Promise<ReviewInsights> {
  const supabase = await createClient();

  // Fetch reviews for the period
  const startDate = period.includes("W")
    ? getWeekStartDate(period)
    : `${period}-01`;
  const endDate = period.includes("W")
    ? getWeekEndDate(period)
    : getMonthEndDate(period);

  const { data: reviews } = await supabase
    .from("delivery_reviews")
    .select("id, rating, content, sentiment_score, keywords")
    .eq("business_id", businessId)
    .gte("review_date", startDate)
    .lte("review_date", endDate);

  if (!reviews || reviews.length === 0) {
    return {
      summary: "이 기간에는 리뷰 데이터가 없습니다.",
      topPositiveKeywords: [],
      topNegativeKeywords: [],
      sentimentTrend: "stable",
      actionableRecommendations: [],
      avgRating: 0,
      totalReviews: 0,
    };
  }

  // Aggregate keywords by sentiment
  const positiveKeywords = new Map<string, number>();
  const negativeKeywords = new Map<string, number>();

  reviews.forEach((review) => {
    const score = review.sentiment_score ?? 0;
    const keywords = review.keywords ?? [];

    keywords.forEach((keyword: string) => {
      if (score > 0.2) {
        positiveKeywords.set(keyword, (positiveKeywords.get(keyword) ?? 0) + 1);
      } else if (score < -0.2) {
        negativeKeywords.set(keyword, (negativeKeywords.get(keyword) ?? 0) + 1);
      }
    });
  });

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const avgSentiment =
    reviews.reduce((sum, r) => sum + (r.sentiment_score ?? 0), 0) / reviews.length;

  const topPositive = sortKeywords(positiveKeywords).slice(0, 5);
  const topNegative = sortKeywords(negativeKeywords).slice(0, 5);

  // Determine trend based on average sentiment
  const sentimentTrend: ReviewInsights["sentimentTrend"] =
    avgSentiment > 0.3 ? "improving" : avgSentiment < -0.1 ? "declining" : "stable";

  // Build insights data for Claude
  const insightsData = `
기간: ${period}
총 리뷰 수: ${reviews.length}개
평균 평점: ${avgRating.toFixed(1)}점
평균 감성 점수: ${avgSentiment.toFixed(2)}

긍정 키워드: ${topPositive.join(", ") || "없음"}
부정 키워드: ${topNegative.join(", ") || "없음"}
감성 트렌드: ${sentimentTrend === "improving" ? "개선 중" : sentimentTrend === "declining" ? "악화 중" : "유지"}
`;

  const anthropic = createAnthropic();
  const model = anthropic(CLAUDE_MODEL);

  const prompt = REVIEW_INSIGHTS_PROMPT.replace("{INSIGHTS_DATA}", insightsData);
  const { text } = await generateText({
    model,
    prompt,
    maxOutputTokens: 512,
  });

  return {
    summary: text.trim(),
    topPositiveKeywords: topPositive,
    topNegativeKeywords: topNegative,
    sentimentTrend,
    actionableRecommendations: extractRecommendations(text),
    avgRating,
    totalReviews: reviews.length,
  };
}

// Clamp sentiment score to [-1.0, 1.0]
function clampScore(score: unknown): number {
  const n = typeof score === "number" ? score : 0;
  return Math.max(-1.0, Math.min(1.0, n));
}

// Sort keyword map by frequency descending
function sortKeywords(map: Map<string, number>): string[] {
  return [...map.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([keyword]) => keyword);
}

// Extract action items from insights text (lines containing "추천", "제안", "개선")
function extractRecommendations(text: string): string[] {
  return text
    .split("\n")
    .filter(
      (line) =>
        line.includes("추천") ||
        line.includes("제안") ||
        line.includes("개선") ||
        line.includes("필요")
    )
    .slice(0, 3)
    .map((line) => line.trim().replace(/^[-•*]\s*/, ""));
}

// Get ISO week start date (Monday) from YYYY-WXX format
function getWeekStartDate(period: string): string {
  const [year, week] = period.split("-W").map(Number);
  const date = new Date(year, 0, 1 + (week - 1) * 7);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().split("T")[0];
}

// Get ISO week end date (Sunday) from YYYY-WXX format
function getWeekEndDate(period: string): string {
  const start = new Date(getWeekStartDate(period));
  start.setDate(start.getDate() + 6);
  return start.toISOString().split("T")[0];
}

// Get last day of month from YYYY-MM format
function getMonthEndDate(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${period}-${String(lastDay).padStart(2, "0")}`;
}

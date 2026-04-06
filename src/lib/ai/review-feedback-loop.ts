// Review Feedback Loop
// Tracks reply effectiveness, generates management actions from review patterns,
// and evaluates whether actions led to improvements.
// Closes the loop: reviews -> analysis -> actions -> improvement tracking

import { createClient } from "@/lib/supabase/server";
import { callClaudeHaiku } from "./claude-client";
import { MANAGEMENT_ACTION_PROMPT } from "./dapjangi-prompts";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReplyEffectivenessReport {
  totalReplied: number;
  returnedCustomers: number;
  returnRate: number;
  avgDaysToReturn: number;
  byRating: Record<number, { replied: number; returned: number; rate: number }>;
  period: { start: string; end: string };
}

export type ManagementActionCategory =
  | "quality"
  | "delivery"
  | "service"
  | "pricing"
  | "hygiene";

export type ManagementActionSeverity = "critical" | "warning" | "suggestion";

export interface ManagementAction {
  id: string;
  category: ManagementActionCategory;
  severity: ManagementActionSeverity;
  title: string;
  description: string;
  evidence: {
    reviewCount: number;
    keywords: string[];
    trend: "worsening" | "stable" | "improving";
    sampleReviews: string[];
  };
  recommendation: string;
  estimatedImpact: string;
  createdAt: string;
}

export interface ActionImpactResult {
  actionId: string;
  category: string;
  period: { before: string; after: string };
  sentimentBefore: number;
  sentimentAfter: number;
  ratingBefore: number;
  ratingAfter: number;
  relatedReviewCount: number;
  verdict: "improved" | "no_change" | "worsened";
  narrative: string;
}

// ─── Reply Effectiveness Tracking ───────────────────────────────────────────

/**
 * Track reply effectiveness: correlate review replies with customer retention.
 * Checks if customers who received replies have ordered again.
 *
 * @param businessId - UUID of the business
 * @param lookbackDays - Number of days to look back (default 30)
 * @returns Report with return rates segmented by rating
 */
export async function trackReplyEffectiveness(
  businessId: string,
  lookbackDays = 30
): Promise<ReplyEffectivenessReport> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = new Date().toISOString().split("T")[0];

  // Fetch reviews that received a reply (auto_published or published)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: repliedReviews } = await (supabase as any)
    .from("delivery_reviews")
    .select("id, rating, platform_user_id, customer_phone, review_date, reply_status")
    .eq("business_id", businessId)
    .in("reply_status", ["auto_published", "published"])
    .gte("review_date", startDateStr)
    .order("review_date", { ascending: true });

  if (!repliedReviews || repliedReviews.length === 0) {
    return {
      totalReplied: 0,
      returnedCustomers: 0,
      returnRate: 0,
      avgDaysToReturn: 0,
      byRating: {},
      period: { start: startDateStr, end: endDateStr },
    };
  }

  // Build a map of customer identifiers to their earliest replied review
  const customerReviews = new Map<
    string,
    { rating: number; reviewDate: string }
  >();

  for (const review of repliedReviews) {
    const customerId = review.platform_user_id ?? review.customer_phone;
    if (!customerId) continue;

    if (!customerReviews.has(customerId)) {
      customerReviews.set(customerId, {
        rating: review.rating,
        reviewDate: review.review_date,
      });
    }
  }

  // Check for subsequent orders from same customers
  const customerIds = Array.from(customerReviews.keys());
  if (customerIds.length === 0) {
    return {
      totalReplied: repliedReviews.length,
      returnedCustomers: 0,
      returnRate: 0,
      avgDaysToReturn: 0,
      byRating: {},
      period: { start: startDateStr, end: endDateStr },
    };
  }

  // Query delivery_reviews for repeat orders (new reviews from same customers after reply)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: returnOrders } = await (supabase as any)
    .from("delivery_reviews")
    .select("platform_user_id, customer_phone, review_date")
    .eq("business_id", businessId)
    .gte("review_date", startDateStr);

  // Track which customers returned and calculate days to return
  const returnedSet = new Set<string>();
  const daysToReturn: number[] = [];
  const byRating: Record<number, { replied: number; returned: number; rate: number }> = {};

  // Initialize byRating from replied reviews
  for (const review of repliedReviews) {
    const rating = review.rating;
    if (!byRating[rating]) {
      byRating[rating] = { replied: 0, returned: 0, rate: 0 };
    }
    byRating[rating].replied++;
  }

  for (const order of returnOrders ?? []) {
    const customerId = order.platform_user_id ?? order.customer_phone;
    if (!customerId || !customerReviews.has(customerId)) continue;

    const originalReview = customerReviews.get(customerId)!;
    const originalDate = new Date(originalReview.reviewDate);
    const returnDate = new Date(order.review_date);

    // Only count if the return order is after the original review
    if (returnDate > originalDate) {
      if (!returnedSet.has(customerId)) {
        returnedSet.add(customerId);
        const diffDays = Math.floor(
          (returnDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysToReturn.push(diffDays);

        const rating = originalReview.rating;
        if (byRating[rating]) {
          byRating[rating].returned++;
        }
      }
    }
  }

  // Calculate rates for each rating
  for (const rating of Object.keys(byRating)) {
    const r = byRating[Number(rating)];
    r.rate = r.replied > 0 ? Math.round((r.returned / r.replied) * 100) : 0;
  }

  const avgDays =
    daysToReturn.length > 0
      ? Math.round(daysToReturn.reduce((s, d) => s + d, 0) / daysToReturn.length)
      : 0;

  return {
    totalReplied: repliedReviews.length,
    returnedCustomers: returnedSet.size,
    returnRate:
      customerReviews.size > 0
        ? Math.round((returnedSet.size / customerReviews.size) * 100)
        : 0,
    avgDaysToReturn: avgDays,
    byRating,
    period: { start: startDateStr, end: endDateStr },
  };
}

// ─── Management Action Generation ───────────────────────────────────────────

// Map Korean review categories to management action categories
const CATEGORY_MAP: Record<string, ManagementActionCategory> = {
  "맛": "quality",
  "양": "quality",
  "배달": "delivery",
  "서비스": "service",
  "가격": "pricing",
  "위생": "hygiene",
  "기타": "service",
};

interface ReviewCluster {
  category: ManagementActionCategory;
  koreanCategory: string;
  keywords: string[];
  reviewCount: number;
  sampleContents: string[];
  avgSentiment: number;
  trend: "worsening" | "stable" | "improving";
}

/**
 * Generate management action items from review trend patterns.
 * Connects review insights directly to operational recommendations.
 *
 * @param businessId - UUID of the business
 * @returns Array of management actions sorted by severity
 */
export async function generateManagementActions(
  businessId: string
): Promise<ManagementAction[]> {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split("T")[0];

  // Fetch recent reviews with sentiment data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviews } = await (supabase as any)
    .from("delivery_reviews")
    .select("id, rating, content, keywords, sentiment_score, review_date")
    .eq("business_id", businessId)
    .gte("review_date", startDate)
    .not("sentiment_score", "is", null);

  if (!reviews || reviews.length < 3) {
    return [];
  }

  // Group negative reviews by category keyword
  const clusterMap = new Map<string, {
    keywords: Map<string, number>;
    contents: string[];
    sentiments: number[];
    dates: string[];
  }>();

  for (const review of reviews) {
    if ((review.sentiment_score ?? 0) >= 0) continue; // Skip positive/neutral

    const keywords: string[] = review.keywords ?? [];
    for (const keyword of keywords) {
      // Determine category from keyword context
      const category = detectCategory(keyword, review.content);
      const existing = clusterMap.get(category) ?? {
        keywords: new Map<string, number>(),
        contents: [] as string[],
        sentiments: [] as number[],
        dates: [] as string[],
      };

      existing.keywords.set(keyword, (existing.keywords.get(keyword) ?? 0) + 1);
      if (review.content && existing.contents.length < 5) {
        existing.contents.push(review.content);
      }
      existing.sentiments.push(review.sentiment_score ?? 0);
      existing.dates.push(review.review_date);
      clusterMap.set(category, existing);
    }
  }

  // Build clusters that meet minimum threshold (3+ reviews)
  const clusters: ReviewCluster[] = [];
  for (const [koreanCategory, data] of clusterMap.entries()) {
    const totalCount = data.sentiments.length;
    if (totalCount < 3) continue;

    const avgSentiment =
      data.sentiments.reduce((s, v) => s + v, 0) / data.sentiments.length;

    // Detect trend by comparing first half vs second half sentiment
    const sortedSentiments = [...data.sentiments];
    const half = Math.floor(sortedSentiments.length / 2);
    const firstHalfAvg =
      half > 0
        ? sortedSentiments.slice(0, half).reduce((s, v) => s + v, 0) / half
        : 0;
    const secondHalfAvg =
      sortedSentiments.length - half > 0
        ? sortedSentiments.slice(half).reduce((s, v) => s + v, 0) /
          (sortedSentiments.length - half)
        : 0;
    const diff = secondHalfAvg - firstHalfAvg;

    const trend: ReviewCluster["trend"] =
      diff < -0.1 ? "worsening" : diff > 0.1 ? "improving" : "stable";

    // Get top keywords sorted by frequency
    const topKeywords = [...data.keywords.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([k]) => k);

    clusters.push({
      category: CATEGORY_MAP[koreanCategory] ?? "service",
      koreanCategory,
      keywords: topKeywords,
      reviewCount: totalCount,
      sampleContents: data.contents.slice(0, 3),
      avgSentiment,
      trend,
    });
  }

  if (clusters.length === 0) return [];

  // Use Claude Haiku to generate natural Korean management actions
  const clusterSummary = clusters
    .map(
      (c) =>
        `[${c.koreanCategory}] 불만 ${c.reviewCount}건, 키워드: ${c.keywords.join(", ")}, 추세: ${
          c.trend === "worsening" ? "악화" : c.trend === "improving" ? "개선" : "유지"
        }, 평균 감성: ${c.avgSentiment.toFixed(2)}\n샘플 리뷰:\n${c.sampleContents
          .map((s, i) => `${i + 1}. "${s.slice(0, 100)}"`)
          .join("\n")}`
    )
    .join("\n\n");

  const prompt = `[불만 패턴 데이터]\n${clusterSummary}\n\n위 데이터를 분석하여 관리 액션 아이템을 생성해주세요.`;

  let aiActions: Array<{
    title: string;
    description: string;
    recommendation: string;
    estimatedImpact: string;
    category: string;
  }> = [];

  try {
    const response = await callClaudeHaiku(MANAGEMENT_ACTION_PROMPT, prompt, 1024);
    const parsed = JSON.parse(response);
    aiActions = Array.isArray(parsed.actions) ? parsed.actions : [];
  } catch {
    console.warn("[ReviewFeedbackLoop] Failed to parse management actions from Claude");
  }

  // Map AI-generated actions back to our ManagementAction type
  const now = new Date().toISOString();
  const actions: ManagementAction[] = clusters.map((cluster, idx) => {
    const aiAction = aiActions[idx];
    const severity: ManagementActionSeverity =
      cluster.reviewCount >= 5
        ? "critical"
        : cluster.reviewCount >= 3
          ? "warning"
          : "suggestion";

    return {
      id: `action-${businessId}-${Date.now()}-${idx}`,
      category: cluster.category,
      severity,
      title: aiAction?.title ?? `${cluster.koreanCategory} 관련 개선 필요`,
      description:
        aiAction?.description ??
        `최근 30일간 ${cluster.koreanCategory} 관련 불만 ${cluster.reviewCount}건이 접수되었습니다.`,
      evidence: {
        reviewCount: cluster.reviewCount,
        keywords: cluster.keywords,
        trend: cluster.trend,
        sampleReviews: cluster.sampleContents.map((s) => s.slice(0, 150)),
      },
      recommendation:
        aiAction?.recommendation ??
        `${cluster.koreanCategory} 관련 프로세스를 점검해주세요.`,
      estimatedImpact:
        aiAction?.estimatedImpact ?? "리뷰 개선 기대",
      createdAt: now,
    };
  });

  // Sort by severity (critical first)
  const severityOrder: Record<ManagementActionSeverity, number> = {
    critical: 0,
    warning: 1,
    suggestion: 2,
  };
  actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Persist management actions to agent_memory
  await saveManagementActionsToMemory(businessId, actions).catch((err) =>
    console.error("[ReviewFeedbackLoop] Failed to save actions to memory:", err)
  );

  return actions;
}

/**
 * Detect the Korean review category for a keyword based on content context.
 */
function detectCategory(keyword: string, content: string | null): string {
  const text = `${keyword} ${content ?? ""}`;
  if (/맛|맛없|맛있|싱겁|짜|달|맵|간/.test(text)) return "맛";
  if (/양|적|많|부족|푸짐/.test(text)) return "양";
  if (/배달|늦|시간|빠|느|배송/.test(text)) return "배달";
  if (/서비스|불친절|친절|응대|태도/.test(text)) return "서비스";
  if (/가격|비싸|싸|비|저렴|가성비/.test(text)) return "가격";
  if (/위생|청결|더럽|깨끗|머리카락|이물/.test(text)) return "위생";
  return "기타";
}

/**
 * Save management actions to agent_memory for tracking and future evaluation.
 */
async function saveManagementActionsToMemory(
  businessId: string,
  actions: ManagementAction[]
): Promise<void> {
  if (actions.length === 0) return;
  const supabase = await createClient();

  const memoryItems = actions.map((action) => ({
    business_id: businessId,
    agent_type: "dapjangi" as const,
    memory_type: "management_action",
    content: JSON.stringify({
      actionId: action.id,
      category: action.category,
      severity: action.severity,
      title: action.title,
      evidence: action.evidence,
      createdAt: action.createdAt,
    }),
    importance: action.severity === "critical" ? 9 : action.severity === "warning" ? 7 : 5,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("agent_memory").insert(memoryItems);
  if (error) {
    console.error("[ReviewFeedbackLoop] agent_memory insert failed:", error);
  }
}

// ─── Action Impact Evaluation ───────────────────────────────────────────────

/**
 * Track whether previous management actions have led to review improvements.
 * Compares review sentiment before/after action was taken.
 *
 * @param businessId - UUID of the business
 * @param actionId - ID of the management action to evaluate
 * @returns Impact assessment with before/after comparison and AI-generated narrative
 */
export async function evaluateActionImpact(
  businessId: string,
  actionId: string
): Promise<ActionImpactResult> {
  const supabase = await createClient();

  // Load the action from agent_memory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memories } = await (supabase as any)
    .from("agent_memory")
    .select("content, created_at")
    .eq("business_id", businessId)
    .eq("agent_type", "dapjangi")
    .eq("memory_type", "management_action")
    .order("created_at", { ascending: false })
    .limit(100);

  // Find the matching action
  let actionData: {
    category: string;
    severity: string;
    title: string;
    createdAt: string;
  } | null = null;
  let actionCreatedAt: string | null = null;

  for (const memory of memories ?? []) {
    try {
      const parsed = typeof memory.content === "string"
        ? JSON.parse(memory.content)
        : memory.content;
      if (parsed.actionId === actionId) {
        actionData = parsed;
        actionCreatedAt = memory.created_at;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!actionData || !actionCreatedAt) {
    return {
      actionId,
      category: "unknown",
      period: { before: "", after: "" },
      sentimentBefore: 0,
      sentimentAfter: 0,
      ratingBefore: 0,
      ratingAfter: 0,
      relatedReviewCount: 0,
      verdict: "no_change",
      narrative: "해당 액션을 찾을 수 없습니다.",
    };
  }

  const actionDate = new Date(actionCreatedAt);
  const beforeStart = new Date(actionDate);
  beforeStart.setDate(beforeStart.getDate() - 14);
  const afterEnd = new Date();

  const beforeStartStr = beforeStart.toISOString().split("T")[0];
  const actionDateStr = actionDate.toISOString().split("T")[0];
  const afterEndStr = afterEnd.toISOString().split("T")[0];

  // Map action category to Korean review categories for filtering
  const categoryKeywords = getCategoryKeywords(actionData.category);

  // Fetch reviews before the action
  const { data: beforeReviews } = await supabase
    .from("delivery_reviews")
    .select("rating, sentiment_score, keywords")
    .eq("business_id", businessId)
    .gte("review_date", beforeStartStr)
    .lt("review_date", actionDateStr)
    .not("sentiment_score", "is", null);

  // Fetch reviews after the action
  const { data: afterReviews } = await supabase
    .from("delivery_reviews")
    .select("rating, sentiment_score, keywords")
    .eq("business_id", businessId)
    .gte("review_date", actionDateStr)
    .lte("review_date", afterEndStr)
    .not("sentiment_score", "is", null);

  // Filter to related reviews (matching category keywords)
  const relatedBefore = filterByCategory(beforeReviews ?? [], categoryKeywords);
  const relatedAfter = filterByCategory(afterReviews ?? [], categoryKeywords);

  const sentimentBefore = calculateAvg(relatedBefore.map((r) => r.sentiment_score ?? 0));
  const sentimentAfter = calculateAvg(relatedAfter.map((r) => r.sentiment_score ?? 0));
  const ratingBefore = calculateAvg(relatedBefore.map((r) => r.rating));
  const ratingAfter = calculateAvg(relatedAfter.map((r) => r.rating));

  const sentimentDiff = sentimentAfter - sentimentBefore;
  const verdict: ActionImpactResult["verdict"] =
    sentimentDiff > 0.1 ? "improved" : sentimentDiff < -0.1 ? "worsened" : "no_change";

  // Generate Korean narrative explanation
  let narrative: string;
  try {
    const narrativePrompt = `다음 관리 액션의 영향을 평가해주세요.

액션: ${actionData.title}
카테고리: ${actionData.category}
액션 날짜: ${actionDateStr}

액션 전 (${beforeStartStr} ~ ${actionDateStr}):
- 관련 리뷰: ${relatedBefore.length}건
- 평균 감성: ${sentimentBefore.toFixed(2)}
- 평균 평점: ${ratingBefore.toFixed(1)}

액션 후 (${actionDateStr} ~ ${afterEndStr}):
- 관련 리뷰: ${relatedAfter.length}건
- 평균 감성: ${sentimentAfter.toFixed(2)}
- 평균 평점: ${ratingAfter.toFixed(1)}

결과: ${verdict === "improved" ? "개선됨" : verdict === "worsened" ? "악화됨" : "변화 없음"}

위 데이터를 바탕으로 사장님께 2~3문장으로 간결한 평가를 한국어로 작성해주세요.`;

    narrative = await callClaudeHaiku("", narrativePrompt, 256);
    narrative = narrative.trim();
  } catch {
    narrative =
      verdict === "improved"
        ? `${actionData.title} 조치 이후 관련 리뷰 감성이 개선되었습니다.`
        : verdict === "worsened"
          ? `${actionData.title} 조치 이후에도 관련 리뷰가 악화되고 있어 추가 조치가 필요합니다.`
          : `${actionData.title} 조치 이후 아직 뚜렷한 변화가 감지되지 않았습니다.`;
  }

  return {
    actionId,
    category: actionData.category,
    period: { before: beforeStartStr, after: afterEndStr },
    sentimentBefore,
    sentimentAfter,
    ratingBefore,
    ratingAfter,
    relatedReviewCount: relatedBefore.length + relatedAfter.length,
    verdict,
    narrative,
  };
}

/**
 * Get Korean keywords associated with a management action category.
 */
function getCategoryKeywords(category: string): string[] {
  const map: Record<string, string[]> = {
    quality: ["맛", "양", "음식", "퀄리티", "재료"],
    delivery: ["배달", "배송", "시간", "늦", "빠"],
    service: ["서비스", "친절", "불친절", "응대", "태도"],
    pricing: ["가격", "비싸", "가성비", "저렴"],
    hygiene: ["위생", "청결", "이물", "머리카락"],
  };
  return map[category] ?? [];
}

/**
 * Filter reviews that match category keywords in their keywords array.
 */
function filterByCategory(
  reviews: Array<{ rating: number; sentiment_score: number | null; keywords: string[] | null }>,
  categoryKeywords: string[]
): Array<{ rating: number; sentiment_score: number | null; keywords: string[] | null }> {
  if (categoryKeywords.length === 0) return reviews;
  return reviews.filter((r) => {
    const reviewKeywords = r.keywords ?? [];
    return reviewKeywords.some((k) =>
      categoryKeywords.some((ck) => k.includes(ck))
    );
  });
}

/**
 * Calculate average of a number array. Returns 0 for empty arrays.
 */
function calculateAvg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

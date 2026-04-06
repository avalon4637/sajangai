// Chat context recommender - proactive topic suggestions and follow-up questions
// Pure rule-based logic for cost efficiency (no Claude API calls)
// Called on session start and after each assistant response

import { createClient } from "@/lib/supabase/server";

// --- Types ---

export interface TopicSuggestion {
  id: string;
  /** Korean display text shown to the user */
  text: string;
  category: "finance" | "review" | "cost" | "cashflow" | "comparison" | "general";
  /** Relevance priority 1-10 (higher = more relevant) */
  priority: number;
  /** Why this is suggested (Korean) */
  reason: string;
  /** Message sent when user taps the suggestion */
  prefilledMessage: string;
}

export interface FollowUpSuggestion {
  /** Korean display text */
  text: string;
  /** Message sent when user taps the suggestion */
  prefilledMessage: string;
}

// --- Topic Suggestion Engine ---

/**
 * Generate proactive topic suggestions based on current business state.
 * Called when a chat session starts to show the user relevant conversation starters.
 *
 * Queries live business data (daily_reports, delivery_reviews, agent_memory)
 * and returns 3-5 prioritized suggestions. No Claude API call is made.
 *
 * @param businessId - UUID of the target business
 * @returns Sorted array of topic suggestions (highest priority first)
 */
export async function generateTopicSuggestions(
  businessId: string
): Promise<TopicSuggestion[]> {
  const supabase = await createClient();
  const suggestions: TopicSuggestion[] = [];

  const today = new Date();
  const thisMonth = today.toISOString().substring(0, 7);
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // --- Parallel data fetching for speed ---
  const [
    latestReportResult,
    pendingReviewResult,
    criticalMemoryResult,
    thisMonthRevenueResult,
  ] = await Promise.all([
    // Latest daily_report for financial health signal
    supabase
      .from("daily_reports")
      .select("report_date, report_type, content")
      .eq("business_id", businessId)
      .eq("report_type", "seri_daily")
      .order("report_date", { ascending: false })
      .limit(1),
    // Pending/draft reviews needing attention
    supabase
      .from("delivery_reviews")
      .select("id")
      .eq("business_id", businessId)
      .in("reply_status", ["pending", "draft"]),
    // Recent critical/warning insights from agent_memory
    supabase
      .from("agent_memory")
      .select("content, importance, memory_type")
      .eq("business_id", businessId)
      .gte("importance", 7)
      .order("created_at", { ascending: false })
      .limit(3),
    // This month revenue for projection
    supabase
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", `${thisMonth}-01`)
      .lte("date", `${thisMonth}-31`),
  ]);

  // --- Evaluate business signals and generate suggestions ---

  // Signal 1: Cash flow risk from latest report
  const latestReport = latestReportResult.data?.[0];
  if (latestReport?.content) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = latestReport.content as any;
    const cashFlowRisk = content?.cashFlow?.overallRisk;
    if (cashFlowRisk === "danger" || cashFlowRisk === "caution") {
      suggestions.push({
        id: "cashflow-risk",
        text: cashFlowRisk === "danger"
          ? "자금 흐름이 위험해요. 점검해볼까요?"
          : "자금 흐름에 주의가 필요해요. 확인해보실래요?",
        category: "cashflow",
        priority: cashFlowRisk === "danger" ? 10 : 8,
        reason: cashFlowRisk === "danger" ? "자금 위험 감지됨" : "자금 주의 상태",
        prefilledMessage: "현금 흐름 상태를 자세히 알려줘",
      });
    }
  }

  // Signal 2: Pending reviews needing reply
  const pendingCount = pendingReviewResult.data?.length ?? 0;
  if (pendingCount > 0) {
    suggestions.push({
      id: "pending-reviews",
      text: `새 리뷰 ${pendingCount}건이 있어요. 확인해보실래요?`,
      category: "review",
      priority: pendingCount >= 5 ? 9 : pendingCount >= 2 ? 7 : 6,
      reason: `미답변 리뷰 ${pendingCount}건`,
      prefilledMessage: "리뷰 현황 알려줘",
    });
  }

  // Signal 3: Critical insights from agent_memory
  const criticalInsights = criticalMemoryResult.data ?? [];
  const hasCostAnomaly = criticalInsights.some(
    (m) => m.content?.includes("비용 이상") || m.content?.includes("원가")
  );
  if (hasCostAnomaly) {
    suggestions.push({
      id: "cost-anomaly",
      text: "비용 이상 징후가 있어요. 분석해볼까요?",
      category: "cost",
      priority: 7,
      reason: "비용 이상 패턴 감지됨",
      prefilledMessage: "비용 이상 징후를 자세히 분석해줘",
    });
  }

  // Signal 4: Month-end approaching (last 5 days)
  if (dayOfMonth >= daysInMonth - 4) {
    const monthRevenue = (thisMonthRevenueResult.data ?? []).reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );
    const formattedRevenue = Math.round(monthRevenue / 10000);
    suggestions.push({
      id: "month-end",
      text: "이번 달 마감이 가까워요. 예상 마감을 확인해볼까요?",
      category: "finance",
      priority: 6,
      reason: `이달 누적 매출 ${formattedRevenue}만원`,
      prefilledMessage: "이번 달 마감 예상을 알려줘",
    });
  }

  // Signal 5: Revenue trend check (if no higher-priority suggestions)
  if (suggestions.length < 2) {
    const monthRevenue = (thisMonthRevenueResult.data ?? []).reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );
    if (monthRevenue > 0) {
      suggestions.push({
        id: "revenue-check",
        text: "이번 달 매출 분석해볼까요?",
        category: "finance",
        priority: 5,
        reason: "정기 매출 점검",
        prefilledMessage: "이번 달 매출 현황 알려줘",
      });
    }
  }

  // Default: always include a general starter if few suggestions
  if (suggestions.length < 3) {
    suggestions.push({
      id: "general-greeting",
      text: "요즘 장사는 어떠세요?",
      category: "general",
      priority: 3,
      reason: "일반 대화 시작",
      prefilledMessage: "요즘 장사 어때?",
    });
  }

  // Sort by priority descending, limit to 5
  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);
}

// --- Follow-Up Suggestion Engine ---

// Topic keyword patterns mapped to follow-up suggestions
const FOLLOW_UP_RULES: Array<{
  patterns: RegExp;
  suggestions: FollowUpSuggestion[];
}> = [
  {
    patterns: /매출|수입|매상|수익|revenue/i,
    suggestions: [
      { text: "채널별로 비교해줘", prefilledMessage: "채널별 매출 비교해줘" },
      { text: "전월이랑 비교해볼까?", prefilledMessage: "지난달이랑 매출 비교해줘" },
      { text: "일별 추이를 보고 싶어", prefilledMessage: "이번 달 일별 매출 추이 보여줘" },
    ],
  },
  {
    patterns: /리뷰|평점|별점|고객.*반응|review/i,
    suggestions: [
      { text: "부정 리뷰 상세히 보기", prefilledMessage: "부정 리뷰 내용을 자세히 알려줘" },
      { text: "답글 상태 확인", prefilledMessage: "리뷰 답글 상태 알려줘" },
      { text: "플랫폼별 비교", prefilledMessage: "플랫폼별 리뷰 비교해줘" },
    ],
  },
  {
    patterns: /비용|지출|경비|원가|인건비|expense|cost/i,
    suggestions: [
      { text: "항목별 비용 분석", prefilledMessage: "비용을 항목별로 분석해줘" },
      { text: "업종 평균이랑 비교", prefilledMessage: "비용이 업종 평균이랑 비교해서 어때?" },
      { text: "절감할 수 있는 곳은?", prefilledMessage: "비용 줄일 수 있는 곳 알려줘" },
    ],
  },
  {
    patterns: /현금|자금|캐시플로|cashflow|통장|잔고/i,
    suggestions: [
      { text: "고정비 시뮬레이션", prefilledMessage: "고정비를 조정하면 자금 흐름이 어떻게 바뀔까?" },
      { text: "향후 2주 예측", prefilledMessage: "향후 2주 자금 흐름 예측해줘" },
    ],
  },
  {
    patterns: /예산|목표|달성률|budget/i,
    suggestions: [
      { text: "항목별 달성률", prefilledMessage: "항목별 예산 달성률 알려줘" },
      { text: "이번 달 목표 점검", prefilledMessage: "이번 달 예산 목표 달성 가능할까?" },
    ],
  },
  {
    patterns: /대출|부채|상환|이자|loan/i,
    suggestions: [
      { text: "대출 상환 일정", prefilledMessage: "대출 상환 일정을 알려줘" },
      { text: "총 부채 현황", prefilledMessage: "현재 총 부채 현황 알려줘" },
    ],
  },
  {
    patterns: /임대료|월세|rent/i,
    suggestions: [
      { text: "임대료 적정성 확인", prefilledMessage: "임대료가 적정한지 비교해줘" },
      { text: "고정비 비중 확인", prefilledMessage: "전체 비용에서 임대료 비중이 어때?" },
    ],
  },
];

/**
 * Generate follow-up question suggestions after an assistant response.
 * Uses rule-based pattern matching on the assistant's last message.
 * No Claude API call is made.
 *
 * @param lastAssistantMessage - The assistant's most recent response text
 * @param currentTopic - Optional detected conversation topic (unused in v1, reserved for future)
 * @returns 2-3 follow-up suggestions relevant to the conversation
 */
export function generateFollowUpSuggestions(
  lastAssistantMessage: string,
  _currentTopic: string | null = null
): FollowUpSuggestion[] {
  const matched: FollowUpSuggestion[] = [];

  for (const rule of FOLLOW_UP_RULES) {
    if (rule.patterns.test(lastAssistantMessage)) {
      // Add up to 2 suggestions per matched rule
      matched.push(...rule.suggestions.slice(0, 2));
    }
  }

  // Deduplicate by prefilledMessage and limit to 3
  const seen = new Set<string>();
  const unique: FollowUpSuggestion[] = [];
  for (const s of matched) {
    if (!seen.has(s.prefilledMessage)) {
      seen.add(s.prefilledMessage);
      unique.push(s);
    }
    if (unique.length >= 3) break;
  }

  // If no matches, provide generic follow-ups
  if (unique.length === 0) {
    return [
      { text: "더 자세히 알려줘", prefilledMessage: "좀 더 자세히 설명해줘" },
      { text: "다른 것도 궁금해", prefilledMessage: "요즘 전체적으로 장사 어때?" },
    ];
  }

  return unique;
}

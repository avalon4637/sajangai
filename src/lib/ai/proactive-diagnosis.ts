// Proactive Diagnosis - J2 feature
// Cross-agent data correlation to detect patterns invisible to individual agents
// Correlates: review complaints + cost data, revenue trends + sentiment, menu changes + reviews

import { createClient } from "@/lib/supabase/server";
import { DIAGNOSIS_PROMPT } from "./jeongjang-prompts";
import { callClaudeObject } from "./claude-client";
import { appendLevel3Guidance } from "./level3-guidance";
import { DiagnosisSchema } from "./schemas";
import {
  generateManagementActions,
  type ManagementAction,
  type ManagementActionSeverity,
} from "./review-feedback-loop";

export type DiagnosisSeverity = "info" | "warning" | "critical";

export interface DiagnosisItem {
  type: string;
  severity: DiagnosisSeverity;
  title: string;
  description: string;
  recommendation: string;
}

export interface DiagnosisResult {
  businessId: string;
  generatedAt: string;
  diagnoses: DiagnosisItem[];
  dataSnapshot: {
    revenueWeeks: number;
    reviewCount: number;
    costRatio: number | null;
    sentimentTrend: "improving" | "declining" | "stable" | "unknown";
  };
}

interface WeeklyRevenueSample {
  weekStart: string;
  revenue: number;
  expenseRatio: number | null;
}

interface ReviewSentimentSample {
  keyword: string;
  count: number;
  category: string;
  avgSentiment: number;
}

/**
 * Fetch last 4 weeks of revenue + expense ratio for pattern detection.
 */
async function fetchWeeklyTrend(
  businessId: string
): Promise<WeeklyRevenueSample[]> {
  const supabase = await createClient();
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const { data: revenues } = await supabase
    .from("revenues")
    .select("date, amount")
    .eq("business_id", businessId)
    .gte("date", fourWeeksAgo.toISOString().split("T")[0])
    .order("date", { ascending: true });

  const { data: expenses } = await supabase
    .from("expenses")
    .select("date, amount, type")
    .eq("business_id", businessId)
    .gte("date", fourWeeksAgo.toISOString().split("T")[0])
    .eq("type", "variable");

  if (!revenues || revenues.length === 0) return [];

  // Aggregate by week (Sunday-based)
  const weekMap = new Map<
    string,
    { revenue: number; expense: number }
  >();

  for (const r of revenues) {
    const weekStart = getWeekStart(r.date);
    const existing = weekMap.get(weekStart) ?? { revenue: 0, expense: 0 };
    weekMap.set(weekStart, {
      ...existing,
      revenue: existing.revenue + r.amount,
    });
  }

  for (const e of expenses ?? []) {
    const weekStart = getWeekStart(e.date);
    const existing = weekMap.get(weekStart) ?? { revenue: 0, expense: 0 };
    weekMap.set(weekStart, {
      ...existing,
      expense: existing.expense + e.amount,
    });
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, { revenue, expense }]) => ({
      weekStart,
      revenue,
      expenseRatio: revenue > 0 ? Math.round((expense / revenue) * 100) : null,
    }));
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return d.toISOString().split("T")[0];
}

/**
 * Fetch recent review sentiment trends from daily_reports.
 * Aggregates keyword frequency and sentiment scores from dapjangi reports.
 */
async function fetchSentimentTrend(
  businessId: string
): Promise<ReviewSentimentSample[]> {
  const supabase = await createClient();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const { data: reports } = await supabase
    .from("daily_reports")
    .select("content")
    .eq("business_id", businessId)
    .eq("report_type", "dapjangi_review")
    .gte("report_date", twoWeeksAgo.toISOString().split("T")[0]);

  if (!reports || reports.length === 0) return [];

  // Aggregate trend patterns across all dapjangi reports
  const patternMap = new Map<
    string,
    { count: number; category: string; sentiment: number }
  >();

  for (const report of reports) {
    const content = report.content as unknown as {
      trends?: Array<{ pattern: string; count: number; category: string }>;
    };

    if (!content.trends) continue;

    for (const trend of content.trends) {
      const key = trend.pattern;
      const existing = patternMap.get(key);
      if (existing) {
        existing.count += trend.count;
      } else {
        patternMap.set(key, {
          count: trend.count,
          category: trend.category,
          sentiment: trend.category === "불만" ? -0.5 : 0.3,
        });
      }
    }
  }

  return Array.from(patternMap.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([keyword, { count, category, sentiment }]) => ({
      keyword,
      count,
      category,
      avgSentiment: sentiment,
    }));
}

/**
 * Detect sentiment trend direction from recent dapjangi reports.
 */
async function detectSentimentDirection(
  businessId: string
): Promise<"improving" | "declining" | "stable" | "unknown"> {
  const supabase = await createClient();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const { data: reviews } = await supabase
    .from("delivery_reviews")
    .select("sentiment_score, review_date")
    .eq("business_id", businessId)
    .not("sentiment_score", "is", null)
    .gte("review_date", twoWeeksAgo.toISOString().split("T")[0])
    .order("review_date", { ascending: true });

  if (!reviews || reviews.length < 4) return "unknown";

  const half = Math.floor(reviews.length / 2);
  const firstHalfAvg =
    reviews.slice(0, half).reduce((s, r) => s + (r.sentiment_score ?? 0), 0) /
    half;
  const secondHalfAvg =
    reviews.slice(half).reduce((s, r) => s + (r.sentiment_score ?? 0), 0) /
    (reviews.length - half);

  const diff = secondHalfAvg - firstHalfAvg;
  if (diff > 0.1) return "improving";
  if (diff < -0.1) return "declining";
  return "stable";
}

/**
 * Build the diagnosis prompt combining weekly revenue and sentiment data.
 */
function buildDiagnosisPrompt(
  weeklyTrend: WeeklyRevenueSample[],
  sentimentTrend: ReviewSentimentSample[],
  sentimentDirection: "improving" | "declining" | "stable" | "unknown"
): string {
  const lines = [
    "[통합 데이터 분석 - 교차 진단 요청]",
    "",
    "[주간 매출/비용 비율 추이]",
  ];

  if (weeklyTrend.length === 0) {
    lines.push("데이터 없음");
  } else {
    for (const w of weeklyTrend) {
      const ratio =
        w.expenseRatio !== null ? `비용비율 ${w.expenseRatio}%` : "비용 데이터 없음";
      lines.push(`${w.weekStart}: 매출 ${w.revenue.toLocaleString()}원, ${ratio}`);
    }
  }

  lines.push("", "[고객 리뷰 주요 키워드/패턴 (최근 2주)]");

  if (sentimentTrend.length === 0) {
    lines.push("리뷰 데이터 없음");
  } else {
    for (const s of sentimentTrend) {
      const sentiment = s.avgSentiment < 0 ? "부정" : "긍정";
      lines.push(
        `"${s.keyword}" - ${s.count}건 (${sentiment}, 카테고리: ${s.category})`
      );
    }
  }

  lines.push(
    "",
    `[리뷰 감성 추세] ${
      sentimentDirection === "improving"
        ? "개선 중"
        : sentimentDirection === "declining"
          ? "악화 중"
          : sentimentDirection === "stable"
            ? "안정"
            : "데이터 부족"
    }`,
    "",
    "위 데이터를 교차 분석하여 진단 결과를 JSON으로 응답해주세요.",
    "데이터가 부족하면 diagnoses 배열을 비워도 됩니다."
  );

  return lines.join("\n");
}

/**
 * Run cross-agent proactive diagnosis for a business.
 * Correlates financial data with review sentiment to detect hidden patterns.
 *
 * @param businessId - UUID of the business
 * @returns Diagnosis result with severity-ranked findings
 */
export async function diagnose(
  businessId: string
): Promise<DiagnosisResult> {
  // Fetch data from multiple sources concurrently
  const [weeklyTrend, sentimentTrend, sentimentDirection, managementActions] =
    await Promise.all([
      fetchWeeklyTrend(businessId),
      fetchSentimentTrend(businessId),
      detectSentimentDirection(businessId),
      generateManagementActions(businessId).catch((err) => {
        console.warn("[Diagnosis] Failed to generate management actions:", err);
        return [] as ManagementAction[];
      }),
    ]);

  const currentCostRatio =
    weeklyTrend.length > 0
      ? weeklyTrend[weeklyTrend.length - 1].expenseRatio
      : null;

  // Skip Claude call if there's no meaningful data
  const hasData = weeklyTrend.length > 0 || sentimentTrend.length > 0;

  let diagnoses: DiagnosisItem[] = [];

  if (hasData) {
    const prompt = buildDiagnosisPrompt(
      weeklyTrend,
      sentimentTrend,
      sentimentDirection
    );

    try {
      // Phase 2.4 — Level 3 prescriptive guidance injection
      const result = await callClaudeObject(
        appendLevel3Guidance(DIAGNOSIS_PROMPT),
        prompt,
        DiagnosisSchema
      );
      diagnoses = result.diagnoses;
    } catch {
      console.warn("[Diagnosis] Failed to get structured response from Claude");
      diagnoses = [];
    }
  }

  // Append management actions as diagnosis items of type "review_management"
  const actionSeverityMap: Record<ManagementActionSeverity, DiagnosisSeverity> = {
    critical: "critical",
    warning: "warning",
    suggestion: "info",
  };

  for (const action of managementActions) {
    diagnoses.push({
      type: "review_management",
      severity: actionSeverityMap[action.severity],
      title: action.title,
      description: `${action.description} (근거: ${action.evidence.reviewCount}건의 리뷰, 키워드: ${action.evidence.keywords.join(", ")})`,
      recommendation: action.recommendation,
    });
  }

  // Sort by severity (critical first)
  const severityOrder: Record<DiagnosisSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  diagnoses.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return {
    businessId,
    generatedAt: new Date().toISOString(),
    diagnoses,
    dataSnapshot: {
      revenueWeeks: weeklyTrend.length,
      reviewCount: sentimentTrend.reduce((s, t) => s + t.count, 0),
      costRatio: currentCostRatio,
      sentimentTrend: sentimentDirection,
    },
  };
}

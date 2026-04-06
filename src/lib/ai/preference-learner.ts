// Preference learner - tracks and learns user conversation patterns
// Stores preferences in agent_memory (type: 'preference', agent_type: 'manager')
// Non-blocking: designed to be called fire-and-forget after chat responses

import { createClient } from "@/lib/supabase/server";

// --- Types ---

export interface UserPreferences {
  /** How verbose the user prefers responses */
  detailLevel: "brief" | "normal" | "detailed";
  /** Most frequently asked topics */
  topInterests: string[];
  /** Preferred comparison types: '전월대비', '전주대비', etc. */
  preferredComparisons: string[];
  /** Whether user prefers numbers-first or narrative-first */
  responseStyle: "numbers_first" | "narrative_first" | "balanced";
  /** Common question patterns detected */
  frequentQuestions: string[];
  /** Last update timestamp */
  updatedAt: string;
}

export interface PreferenceSignals {
  /** User asked for more details ("자세히 알려줘" patterns) */
  askedForDetails: boolean;
  /** User asked for brevity ("간단히" patterns) */
  askedForBrief: boolean;
  /** Topic keywords mentioned in user messages */
  mentionedTopics: string[];
  /** User requested a comparison */
  askedComparison: boolean;
  /** Detected format preference ("표로 보여줘", "그래프로") */
  preferredFormat: string | null;
}

// --- Pattern Definitions ---

const DETAIL_PATTERNS = /자세히|상세하게|자세한|구체적으로|디테일|왜.*그런지|원인.*뭐|설명해/;
const BRIEF_PATTERNS = /간단히|요약|짧게|한줄로|간략|핵심만|결론만/;
const COMPARISON_PATTERNS = /비교|대비|전월|전주|작년|지난달|전년|같은.*달/;
const FORMAT_TABLE_PATTERN = /표로|테이블|목록으로/;
const FORMAT_CHART_PATTERN = /그래프|차트|추이|변화/;
const FORMAT_ONELINER_PATTERN = /한줄로|한마디로|간단히/;

/** Topic keyword to canonical name mapping */
const TOPIC_KEYWORDS: Record<string, string> = {
  "매출": "매출",
  "수입": "매출",
  "매상": "매출",
  "비용": "비용",
  "지출": "비용",
  "경비": "비용",
  "원가": "비용",
  "인건비": "인건비",
  "리뷰": "리뷰",
  "평점": "리뷰",
  "별점": "리뷰",
  "현금": "자금",
  "자금": "자금",
  "통장": "자금",
  "잔고": "자금",
  "임대료": "임대료",
  "월세": "임대료",
  "대출": "대출",
  "부채": "대출",
  "예산": "예산",
  "목표": "예산",
  "배달": "배달",
  "배민": "배달",
  "쿠팡": "배달",
  "요기요": "배달",
};

// --- Core Functions ---

/**
 * Analyze conversation messages to extract preference signals.
 * Pure function - no DB calls, no side effects.
 *
 * @param messages - Array of chat messages from the session
 * @returns Extracted preference signals
 */
export function extractPreferenceSignals(
  messages: Array<{ role: string; content: string }>
): PreferenceSignals {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content);

  const combined = userMessages.join(" ");

  // Detect detail level preferences
  const askedForDetails = DETAIL_PATTERNS.test(combined);
  const askedForBrief = BRIEF_PATTERNS.test(combined);

  // Detect mentioned topics
  const topicSet = new Set<string>();
  for (const msg of userMessages) {
    for (const [keyword, canonical] of Object.entries(TOPIC_KEYWORDS)) {
      if (msg.includes(keyword)) {
        topicSet.add(canonical);
      }
    }
  }

  // Detect comparison requests
  const askedComparison = COMPARISON_PATTERNS.test(combined);

  // Detect format preference
  let preferredFormat: string | null = null;
  if (FORMAT_TABLE_PATTERN.test(combined)) {
    preferredFormat = "table";
  } else if (FORMAT_CHART_PATTERN.test(combined)) {
    preferredFormat = "chart";
  } else if (FORMAT_ONELINER_PATTERN.test(combined)) {
    preferredFormat = "brief";
  }

  return {
    askedForDetails,
    askedForBrief,
    mentionedTopics: Array.from(topicSet),
    askedComparison,
    preferredFormat,
  };
}

/**
 * Track and learn user conversation preferences from chat history.
 * Loads existing preferences from agent_memory, merges new signals,
 * and upserts back. Designed to be called fire-and-forget.
 *
 * @param businessId - UUID of the business
 * @param sessionId - UUID of the current chat session
 */
export async function learnPreferences(
  businessId: string,
  sessionId: string
): Promise<void> {
  const supabase = await createClient();

  // Load session messages
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (!messages || messages.length < 2) return; // Need at least 1 exchange

  // Extract signals from this session
  const signals = extractPreferenceSignals(
    messages.map((m) => ({ role: m.role, content: m.content }))
  );

  // Load existing preferences from agent_memory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("agent_memory")
    .select("id, content")
    .eq("business_id", businessId)
    .eq("agent_type", "manager")
    .eq("memory_type", "preference")
    .order("created_at", { ascending: false })
    .limit(1);

  let prefs: UserPreferences;
  const existingRow = existing?.[0];

  if (existingRow?.content) {
    try {
      prefs = JSON.parse(
        typeof existingRow.content === "string"
          ? existingRow.content
          : JSON.stringify(existingRow.content)
      ) as UserPreferences;
    } catch {
      prefs = createDefaultPreferences();
    }
  } else {
    prefs = createDefaultPreferences();
  }

  // Merge signals into existing preferences
  prefs = mergeSignals(prefs, signals);
  prefs.updatedAt = new Date().toISOString();

  const serialized = JSON.stringify(prefs);

  if (existingRow) {
    // Update existing preference record
    await supabase
      .from("agent_memory")
      .update({ content: serialized })
      .eq("id", existingRow.id);
  } else {
    // Create new preference record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("agent_memory").insert({
      business_id: businessId,
      agent_type: "manager",
      memory_type: "preference",
      content: serialized,
      importance: 5,
    });
  }
}

/**
 * Load learned preferences and build a prompt modifier string.
 * Injected into the chat system prompt for personalization.
 * Returns empty string if no preferences exist yet.
 *
 * @param businessId - UUID of the business
 * @returns Korean prompt modifier string or empty string
 */
export async function buildPreferencePromptModifier(
  businessId: string
): Promise<string> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("agent_memory")
    .select("content")
    .eq("business_id", businessId)
    .eq("agent_type", "manager")
    .eq("memory_type", "preference")
    .order("created_at", { ascending: false })
    .limit(1);

  const row = data?.[0];
  if (!row?.content) return "";

  let prefs: UserPreferences;
  try {
    prefs = JSON.parse(
      typeof row.content === "string"
        ? row.content
        : JSON.stringify(row.content)
    ) as UserPreferences;
  } catch {
    return "";
  }

  const lines: string[] = ["[사용자 선호도]"];

  // Detail level
  switch (prefs.detailLevel) {
    case "brief":
      lines.push("- 이 사장님은 간결한 답변을 선호합니다. 핵심만 전달하세요.");
      break;
    case "detailed":
      lines.push("- 이 사장님은 상세한 설명을 선호합니다. 원인과 배경도 포함하세요.");
      break;
    case "normal":
      // No modifier needed for default
      break;
  }

  // Top interests
  if (prefs.topInterests.length > 0) {
    lines.push(`- 자주 묻는 주제: ${prefs.topInterests.slice(0, 5).join(", ")}`);
  }

  // Comparison preference
  if (prefs.preferredComparisons.length > 0) {
    lines.push("- 비교 분석을 자주 요청합니다. 가능하면 비교 데이터를 포함하세요.");
  }

  // Response style
  switch (prefs.responseStyle) {
    case "numbers_first":
      lines.push("- 숫자와 데이터를 먼저 보여주세요.");
      break;
    case "narrative_first":
      lines.push("- 설명을 먼저 하고 숫자는 뒤에 붙여주세요.");
      break;
    case "balanced":
      break;
  }

  // Only return if there's meaningful content beyond the header
  return lines.length > 1 ? lines.join("\n") : "";
}

// --- Internal Helpers ---

/** Create a default (empty) preferences object */
function createDefaultPreferences(): UserPreferences {
  return {
    detailLevel: "normal",
    topInterests: [],
    preferredComparisons: [],
    responseStyle: "balanced",
    frequentQuestions: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Merge new signals into existing preferences.
 * Uses a simple accumulation strategy: topics and comparisons grow over time,
 * detail level shifts based on most recent signals.
 */
function mergeSignals(
  existing: UserPreferences,
  signals: PreferenceSignals
): UserPreferences {
  const prefs = { ...existing };

  // Detail level: most recent signal wins
  if (signals.askedForDetails && !signals.askedForBrief) {
    prefs.detailLevel = "detailed";
  } else if (signals.askedForBrief && !signals.askedForDetails) {
    prefs.detailLevel = "brief";
  }
  // If both or neither, keep existing

  // Merge topics (deduplicate, keep top 10)
  const topicCounts = new Map<string, number>();
  for (const t of existing.topInterests) {
    topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
  }
  for (const t of signals.mentionedTopics) {
    topicCounts.set(t, (topicCounts.get(t) ?? 0) + 2); // Weight new signals higher
  }
  prefs.topInterests = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic);

  // Comparison preference accumulation
  if (signals.askedComparison) {
    if (!prefs.preferredComparisons.includes("비교분석")) {
      prefs.preferredComparisons = [...prefs.preferredComparisons, "비교분석"].slice(0, 5);
    }
  }

  // Response style: infer from format preference
  if (signals.preferredFormat === "table" || signals.preferredFormat === "chart") {
    prefs.responseStyle = "numbers_first";
  } else if (signals.preferredFormat === "brief") {
    prefs.responseStyle = "balanced";
  }

  return prefs;
}

// Viral (Marketing) Agent Engine
// Detects customer churn and generates re-engagement messages

import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import {
  REENGAGEMENT_SYSTEM_PROMPT,
  buildReengagementPrompt,
} from "./viral-prompts";

export interface ChurnRisk {
  platform: string;
  lastOrderDate: string;
  daysSinceOrder: number;
  orderCount: number;
  riskLevel: "warning" | "critical";
}

export interface ViralAnalysis {
  churnRisks: ChurnRisk[];
  totalAtRisk: number;
  messages: { target: ChurnRisk; message: string }[];
}

/**
 * Run viral agent analysis for a business.
 * Detects churn risks from order patterns in revenue data.
 */
export async function runViralAnalysis(
  businessId: string
): Promise<ViralAnalysis> {
  const supabase = await createClient();

  // Get revenue data grouped by date to identify ordering patterns
  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

  const { data: revenues } = await supabase
    .from("revenues")
    .select("date, amount, channel, category")
    .eq("business_id", businessId)
    .gte("date", sixWeeksAgo.toISOString().split("T")[0])
    .order("date");

  if (!revenues || revenues.length === 0) {
    return { churnRisks: [], totalAtRisk: 0, messages: [] };
  }

  // Analyze by channel — detect channels with recent inactivity
  const channelActivity = analyzeChannelActivity(revenues);
  const churnRisks = detectChurnRisks(channelActivity);

  // Generate re-engagement messages for top risks
  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single();

  const messages: ViralAnalysis["messages"] = [];

  // Generate messages for up to 3 churn risks
  for (const risk of churnRisks.slice(0, 3)) {
    try {
      const message = await generateReengagementMessage({
        businessName: business?.name ?? "매장",
        lastOrderDate: risk.lastOrderDate,
        daysSinceOrder: risk.daysSinceOrder,
      });
      messages.push({ target: risk, message });
    } catch {
      // Skip failed message generation
    }
  }

  return {
    churnRisks,
    totalAtRisk: churnRisks.length,
    messages,
  };
}

interface ChannelActivity {
  channel: string;
  dates: string[];
  lastDate: string;
  totalOrders: number;
}

function analyzeChannelActivity(
  revenues: { date: string; channel: string | null; category: string | null }[]
): ChannelActivity[] {
  const channelMap: Record<string, Set<string>> = {};

  for (const r of revenues) {
    const ch = r.channel ?? r.category ?? "unknown";
    if (!channelMap[ch]) channelMap[ch] = new Set();
    channelMap[ch].add(r.date);
  }

  return Object.entries(channelMap).map(([channel, dateSet]) => {
    const dates = [...dateSet].sort();
    return {
      channel,
      dates,
      lastDate: dates[dates.length - 1],
      totalOrders: dates.length,
    };
  });
}

function detectChurnRisks(activities: ChannelActivity[]): ChurnRisk[] {
  const now = new Date();
  const risks: ChurnRisk[] = [];

  for (const activity of activities) {
    // Only consider channels with at least 4 active days (regular activity)
    if (activity.totalOrders < 4) continue;

    const lastDate = new Date(activity.lastDate);
    const daysSince = Math.floor(
      (now.getTime() - lastDate.getTime()) / 86_400_000
    );

    // Warning: 14+ days without activity, Critical: 21+ days
    if (daysSince >= 14) {
      risks.push({
        platform: activity.channel,
        lastOrderDate: activity.lastDate,
        daysSinceOrder: daysSince,
        orderCount: activity.totalOrders,
        riskLevel: daysSince >= 21 ? "critical" : "warning",
      });
    }
  }

  return risks.sort((a, b) => b.daysSinceOrder - a.daysSinceOrder);
}

async function generateReengagementMessage(params: {
  businessName: string;
  lastOrderDate: string;
  daysSinceOrder: number;
}): Promise<string> {
  const anthropic = createAnthropic();

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-5-20250514"),
    system: REENGAGEMENT_SYSTEM_PROMPT,
    prompt: buildReengagementPrompt(params),
    maxOutputTokens: 100,
    temperature: 0.7,
  });

  return text.trim();
}

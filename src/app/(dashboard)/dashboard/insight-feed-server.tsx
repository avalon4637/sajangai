import { getActiveInsights } from "@/lib/insights/queries";
import { InsightFeedClient } from "./insight-feed-client";
import type { ScoredInsightEvent } from "@/lib/insights/types";

interface InsightFeedServerProps {
  businessId: string;
}

export async function InsightFeedServer({ businessId }: InsightFeedServerProps) {
  let scoredInsights: ScoredInsightEvent[];
  try {
    scoredInsights = await getActiveInsights(businessId);
  } catch (error) {
    // Table may not exist yet — gracefully return nothing
    console.error("[InsightFeed] Failed to load active insights:", error);
    scoredInsights = [];
  }

  if (scoredInsights.length === 0) return null;

  // Extract InsightEvent[] for the client component (already ranked by score)
  const insights = scoredInsights.map((s) => s.event);

  return <InsightFeedClient insights={insights} />;
}

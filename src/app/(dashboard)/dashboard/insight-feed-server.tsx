import { getActiveInsights } from "@/lib/insights/queries";
import { InsightFeedClient } from "./insight-feed-client";
import type { InsightEvent } from "@/lib/insights/types";

interface InsightFeedServerProps {
  businessId: string;
}

export async function InsightFeedServer({ businessId }: InsightFeedServerProps) {
  let insights: InsightEvent[];
  try {
    insights = await getActiveInsights(businessId);
  } catch (error) {
    // Table may not exist yet — gracefully return nothing
    console.error("[InsightFeed] Failed to load active insights:", error);
    insights = [];
  }

  if (insights.length === 0) return null;

  return <InsightFeedClient insights={insights} />;
}

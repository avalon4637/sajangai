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
  } catch {
    // Table may not exist yet — gracefully return nothing
    insights = [];
  }

  if (insights.length === 0) return null;

  return <InsightFeedClient insights={insights} />;
}

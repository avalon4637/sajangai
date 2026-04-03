"use client";

import { useRouter } from "next/navigation";
import { InsightFeed } from "@/components/insights/insight-feed";
import type { InsightEvent } from "@/lib/insights/types";

interface InsightFeedClientProps {
  insights: InsightEvent[];
}

export function InsightFeedClient({ insights }: InsightFeedClientProps) {
  const router = useRouter();

  const handleAction = (insight: InsightEvent) => {
    if (!insight.action) return;

    // Update status to "acted" via API
    fetch("/api/insights/act", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insightId: insight.id, actionType: insight.action.type }),
    }).catch(() => {});

    // Navigate based on action type
    switch (insight.action.type) {
      case "reply_reviews":
        router.push("/review");
        break;
      case "send_message":
        router.push("/marketing");
        break;
      case "view_detail":
        router.push("/analysis");
        break;
      case "run_simulation":
        router.push("/analysis");
        break;
    }
  };

  const handleDismiss = (insightId: string) => {
    fetch("/api/insights/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insightId }),
    }).catch(() => {});
  };

  return (
    <InsightFeed
      insights={insights}
      onAction={handleAction}
      onDismiss={handleDismiss}
    />
  );
}

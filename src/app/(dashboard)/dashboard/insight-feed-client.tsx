"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { InsightFeed } from "@/components/insights/insight-feed";
import type { InsightEvent } from "@/lib/insights/types";

interface InsightFeedClientProps {
  insights: InsightEvent[];
}

// Fire-and-forget tracking helper
function trackInsight(insightId: string, action: "viewed" | "acted" | "dismissed"): void {
  fetch("/api/insights/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ insightId, action }),
  }).catch(() => {});
}

export function InsightFeedClient({ insights }: InsightFeedClientProps) {
  const router = useRouter();
  const trackedRef = useRef(false);

  // Track "viewed" for all displayed insights once on mount
  useEffect(() => {
    if (trackedRef.current || insights.length === 0) return;
    trackedRef.current = true;

    for (const insight of insights) {
      trackInsight(insight.id, "viewed");
    }
  }, [insights]);

  const handleAction = (insight: InsightEvent) => {
    if (!insight.action) return;

    // Track action via unified tracking API
    trackInsight(insight.id, "acted");

    // Also update via existing act API for backward compatibility
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
    trackInsight(insightId, "dismissed");

    // Also call existing dismiss API for backward compatibility
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

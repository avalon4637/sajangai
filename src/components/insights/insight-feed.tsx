"use client";

import { useState } from "react";
import { InsightCard } from "./insight-card";
import type { InsightEvent } from "@/lib/insights/types";

interface InsightFeedProps {
  insights: InsightEvent[];
  onAction?: (insight: InsightEvent) => void;
  onDismiss?: (insightId: string) => void;
}

const INITIAL_SHOW = 3;

export function InsightFeed({ insights, onAction, onDismiss }: InsightFeedProps) {
  const [showAll, setShowAll] = useState(false);

  if (insights.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        새로운 인사이트가 없습니다
      </div>
    );
  }

  // Insights arrive pre-sorted by score from the scoring pipeline (SPEC-AI-002).
  // No additional sorting needed — order reflects priority scoring.
  const sorted = insights;

  const visible = showAll ? sorted : sorted.slice(0, INITIAL_SHOW);
  const hasMore = sorted.length > INITIAL_SHOW;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          AI 인사이트
          {insights.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5">
              {insights.length}
            </span>
          )}
        </h3>
      </div>

      <div className="space-y-2">
        {visible.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onAction={onAction}
            onDismiss={onDismiss}
          />
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 cursor-pointer"
        >
          +{sorted.length - INITIAL_SHOW}개 더 보기
        </button>
      )}
    </div>
  );
}

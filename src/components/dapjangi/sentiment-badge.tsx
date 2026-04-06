// Sentiment badge component for review items
// Displays colored badge based on sentiment score range

import { Badge } from "@/components/ui/badge";

interface SentimentBadgeProps {
  score: number | null;
  /** Compact mode: smaller text, no padding adjustment */
  compact?: boolean;
}

/**
 * Classify sentiment score into category.
 * >= 0.6 = positive, <= 0.3 = negative, between = neutral, null = unanalyzed
 */
export function getSentimentCategory(
  score: number | null
): "positive" | "neutral" | "negative" | "unknown" {
  if (score === null) return "unknown";
  if (score >= 0.6) return "positive";
  if (score <= 0.3) return "negative";
  return "neutral";
}

const SENTIMENT_CONFIG = {
  positive: {
    label: "긍정",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  neutral: {
    label: "중립",
    className: "bg-muted text-muted-foreground border-muted",
  },
  negative: {
    label: "부정",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  unknown: {
    label: "미분석",
    className: "bg-muted text-muted-foreground border-muted",
  },
} as const;

export function SentimentBadge({ score, compact }: SentimentBadgeProps): React.JSX.Element {
  const category = getSentimentCategory(score);
  const config = SENTIMENT_CONFIG[category];

  return (
    <Badge
      variant="outline"
      className={`rounded-full font-medium ${config.className} ${compact ? "text-[10px] px-1.5 py-0" : "text-[11px] px-2 py-0.5"}`}
    >
      {config.label}
    </Badge>
  );
}

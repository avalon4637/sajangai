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
    className: "bg-green-100 text-green-700 border-green-200",
  },
  neutral: {
    label: "중립",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  negative: {
    label: "부정",
    className: "bg-red-100 text-red-700 border-red-200",
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
      className={`${config.className} ${compact ? "text-[10px] h-4 px-1.5" : "text-[11px] h-5 px-2"}`}
    >
      {config.label}
    </Badge>
  );
}

"use client";

// Scrollable review queue list for Dapjangi review management
// Shows review items with platform badge, stars, content preview, status

import { Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DeliveryReview } from "@/lib/queries/review";
import { SentimentBadge } from "@/components/dapjangi/sentiment-badge";
import { formatRelativeTime } from "@/lib/utils/format-time";

interface ReviewQueueProps {
  reviews: DeliveryReview[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  baemin: "배민",
  coupangeats: "쿠팡이츠",
  yogiyo: "요기요",
};

const PLATFORM_COLORS: Record<string, string> = {
  baemin: "bg-sky-100 text-sky-700",
  coupangeats: "bg-green-100 text-green-700",
  yogiyo: "bg-rose-100 text-rose-700",
};

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: BadgeVariant; className?: string }
> = {
  pending: {
    label: "미답변",
    variant: "destructive",
  },
  draft: {
    label: "AI완성",
    variant: "outline",
    className: "border-amber-300 text-amber-700 bg-amber-50",
  },
  auto_published: {
    label: "자동 발행",
    variant: "secondary",
  },
  published: {
    label: "발행완료",
    variant: "default",
    className: "bg-green-600 text-white",
  },
  skipped: {
    label: "건너뜀",
    variant: "secondary",
  },
};

// formatRelativeTime is now imported from @/lib/utils/format-time

export function ReviewQueue({
  reviews,
  selectedId,
  onSelect,
}: ReviewQueueProps) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">리뷰가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {reviews.map((review) => {
        const isSelected = review.id === selectedId;
        const statusInfo = STATUS_CONFIG[review.replyStatus] ?? {
          label: review.replyStatus,
          variant: "outline" as BadgeVariant,
        };

        return (
          <button
            key={review.id}
            type="button"
            onClick={() => onSelect(review.id)}
            className={`flex flex-col gap-1.5 p-3 text-left transition-colors hover:bg-muted/50 cursor-pointer ${
              isSelected
                ? "bg-indigo-50 border-l-[3px] border-l-indigo-500"
                : "border-l-[3px] border-l-transparent"
            }`}
          >
            {/* Top row: platform + stars + time */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    PLATFORM_COLORS[review.platform] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {PLATFORM_LABELS[review.platform] ?? review.platform}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-2.5 w-2.5 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatRelativeTime(review.reviewDate)}
              </span>
            </div>

            {/* Reviewer name */}
            {review.customerName && (
              <span className="text-xs font-medium text-foreground truncate">
                {review.customerName}
              </span>
            )}

            {/* Content preview */}
            {review.content && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {review.content}
              </p>
            )}

            {/* Status tag + sentiment badge */}
            <div className="flex items-center justify-between">
              <Badge
                variant={statusInfo.variant}
                className={`text-[10px] h-5 ${statusInfo.className ?? ""}`}
              >
                {statusInfo.label}
              </Badge>
              <SentimentBadge score={review.sentimentScore} compact />
            </div>
          </button>
        );
      })}
    </div>
  );
}

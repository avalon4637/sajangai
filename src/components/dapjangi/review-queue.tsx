"use client";

// Scrollable review queue list for Dapjangi review management
// Shows review items with platform badge, stars, content preview, status

import { useState } from "react";
import { Star, Clock, Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DeliveryReview } from "@/lib/queries/review";
import { SentimentBadge } from "@/components/dapjangi/sentiment-badge";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { getReviewDeeplink } from "@/lib/utils/review-deeplinks";

interface ReviewQueueProps {
  reviews: DeliveryReview[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  mobileInlineActions?: boolean;
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
    variant: "outline",
    className: "rounded-full px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-700 border-red-200",
  },
  draft: {
    label: "AI완성",
    variant: "outline",
    className: "rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 border-amber-200",
  },
  auto_published: {
    label: "자동 발행",
    variant: "outline",
    className: "rounded-full px-2 py-0.5 text-[11px] font-medium bg-primary/10 text-primary border-primary/20",
  },
  published: {
    label: "발행완료",
    variant: "outline",
    className: "rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  skipped: {
    label: "건너뜀",
    variant: "outline",
    className: "rounded-full px-2 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground",
  },
};

// formatRelativeTime is now imported from @/lib/utils/format-time

export function ReviewQueue({
  reviews,
  selectedId,
  onSelect,
  mobileInlineActions = false,
}: ReviewQueueProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const handleMarkComplete = async (reviewId: string) => {
    // Optimistic update
    setCompletedIds((prev) => new Set(prev).add(reviewId));

    try {
      const res = await fetch("/api/dapjangi/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });

      if (!res.ok) {
        setCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(reviewId);
          return next;
        });
        toast.error("상태 변경에 실패했습니다");
      } else {
        toast.success("답글 완료 처리되었습니다");
      }
    } catch {
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
      toast.error("네트워크 오류가 발생했습니다");
    }
  };
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-muted-foreground" />
        </div>
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

            {/* Mobile: AI reply preview */}
            {mobileInlineActions && review.aiReply && (
              <div className="sm:hidden rounded-md bg-amber-50 px-2.5 py-1.5 mt-0.5">
                <p className="text-[10px] font-medium text-amber-700 mb-0.5">AI 답글</p>
                <p className="text-xs text-amber-900 line-clamp-2 leading-relaxed">
                  {review.aiReply}
                </p>
              </div>
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

            {/* Mobile inline actions */}
            {mobileInlineActions && !completedIds.has(review.id) && (
              <div
                className="flex sm:hidden gap-2 mt-1.5 pt-2 border-t"
                onClick={(e) => e.stopPropagation()}
              >
                {review.aiReply && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => {
                      navigator.clipboard.writeText(review.aiReply!);
                      toast.success("답글이 복사되었습니다");
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1" /> 복사
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={() => {
                    const url = getReviewDeeplink(review.platform, review.externalId);
                    window.open(url, "_blank");
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" /> 답글 쓰러가기
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs h-8 px-3"
                  onClick={() => handleMarkComplete(review.id)}
                >
                  <Check className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Completed indicator */}
            {mobileInlineActions && completedIds.has(review.id) && (
              <div className="flex sm:hidden items-center gap-1.5 mt-1.5 pt-2 border-t text-xs text-emerald-600">
                <Check className="w-3.5 h-3.5" />
                답글 완료 처리됨
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

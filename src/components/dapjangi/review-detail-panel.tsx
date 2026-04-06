"use client";

// Review detail panel for Dapjangi review management
// Shows full review text + AI recommended reply (editable) + action buttons

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Send,
  Pencil,
  RefreshCw,
  Clock,
  Loader2,
  Sparkles,
  X,
  CheckCircle,
  CircleCheck,
  Circle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryReview } from "@/lib/queries/review";
import { ReviewActions } from "@/components/reviews/review-actions";
import { markAsReplied } from "@/lib/actions/review-actions";
import { formatKoreanDate } from "@/lib/utils/format-time";

interface ReviewDetailPanelProps {
  review: DeliveryReview | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  baemin: "배민",
  coupangeats: "쿠팡이츠",
  yogiyo: "요기요",
};

export function ReviewDetailPanel({ review }: ReviewDetailPanelProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isMarkingReplied, setIsMarkingReplied] = useState(false);

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <Sparkles className="h-10 w-10 text-amber-300 mb-3" />
        <p className="text-sm text-muted-foreground">
          왼쪽에서 리뷰를 선택하세요
        </p>
      </div>
    );
  }

  const handleEditStart = () => {
    setIsEditing(true);
    setEditText(review.aiReply ?? "");
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText("");
  };

  const handleEditSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiReply: editText }),
      });
      if (!res.ok) throw new Error("Save failed");
      setIsEditing(false);
      router.refresh();
    } catch {
      // Error handling - user sees button re-enabled
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("이 답글을 발행하시겠습니까?")) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Publish failed");
      router.refresh();
    } catch {
      // Error handling
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/dapjangi/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id }),
      });
      if (!res.ok) throw new Error("Regeneration failed");
      router.refresh();
    } catch {
      // Error handling
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleToggleReplied = async () => {
    setIsMarkingReplied(true);
    try {
      await markAsReplied(review.id, !review.repliedAt);
      router.refresh();
    } catch {
      // Error handling - user sees button re-enabled
    } finally {
      setIsMarkingReplied(false);
    }
  };

  const canPublish =
    review.replyStatus === "draft" || review.replyStatus === "pending";
  const hasReply = !!review.aiReply;
  const isPublished =
    review.replyStatus === "published" ||
    review.replyStatus === "auto_published";
  const isReplied = !!review.repliedAt;

  return (
    <div className="flex flex-col h-full">
      {/* Review header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {PLATFORM_LABELS[review.platform] ?? review.platform}
            </Badge>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatKoreanDate(review.reviewDate)}
          </span>
        </div>
        {review.customerName && (
          <p className="text-sm font-medium mt-1.5">{review.customerName}</p>
        )}
        {review.orderSummary && (
          <p className="text-xs text-muted-foreground mt-0.5">
            주문: {review.orderSummary}
          </p>
        )}
      </div>

      {/* Full review content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Review text */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              리뷰 내용
            </h4>
            <p className="text-sm leading-relaxed">
              {review.content ?? "내용 없음"}
            </p>
          </div>

          {/* Keywords */}
          {review.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {review.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5"
                >
                  #{kw}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t" />

          {/* AI Reply Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <h4 className="text-xs font-medium text-muted-foreground">
                AI 추천 답글
              </h4>
              {isPublished && (
                <Badge
                  variant="default"
                  className="text-[10px] bg-green-600 text-white"
                >
                  <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                  {review.replyStatus === "auto_published"
                    ? "자동 발행"
                    : "발행 완료"}
                </Badge>
              )}
            </div>

            {hasReply && !isEditing && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {review.aiReply}
                </p>
              </div>
            )}

            {hasReply && isEditing && (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[120px] text-sm"
                  placeholder="답글을 수정하세요..."
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditCancel}
                    className="gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEditSave}
                    disabled={isSaving}
                    className="gap-1.5"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    저장
                  </Button>
                </div>
              </div>
            )}

            {!hasReply && review.replyStatus === "pending" && (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>답장이가 답글을 작성하고 있습니다...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons footer */}
      {hasReply && !isEditing && (
        <div className="border-t px-4 py-3 space-y-2">
          {/* Row 1: Copy + Deep link */}
          <ReviewActions
            aiReply={review.aiReply}
            platform={review.platform}
          />

          {/* Row 2: Publish / Edit / Regenerate / Replied toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {canPublish && (
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="gap-1.5"
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                발행하기
              </Button>
            )}
            {canPublish && (
              <Button
                variant="outline"
                onClick={handleEditStart}
                className="gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                수정하기
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="gap-1.5 text-muted-foreground"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              재생성
            </Button>

            {/* Replied toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleReplied}
              disabled={isMarkingReplied}
              className={`gap-1.5 ml-auto ${
                isReplied
                  ? "text-green-700"
                  : "text-muted-foreground"
              }`}
            >
              {isMarkingReplied ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isReplied ? (
                <CircleCheck className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              {isReplied ? "답변 완료" : "답변 완료 표시"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

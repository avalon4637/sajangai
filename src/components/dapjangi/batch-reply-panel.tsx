"use client";

// Batch review/approve panel for AI-generated replies
// Shows as a Sheet (drawer) with checkbox selection, inline edit, and bulk publish

import { useState, useCallback } from "react";
import { Star, Loader2, Pencil, Check, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { SentimentBadge } from "@/components/dapjangi/sentiment-badge";
import type { DeliveryReview } from "@/lib/queries/review";

interface BatchReplyPanelProps {
  open: boolean;
  reviews: DeliveryReview[];
  onPublish: (reviewIds: string[]) => Promise<void>;
  onUpdateReply: (reviewId: string, aiReply: string) => Promise<void>;
  onClose: () => void;
}

export function BatchReplyPanel({
  open,
  reviews,
  onPublish,
  onUpdateReply,
  onClose,
}: BatchReplyPanelProps): React.JSX.Element {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(reviews.map((r) => r.id))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const allSelected = selectedIds.size === reviews.length && reviews.length > 0;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviews.map((r) => r.id)));
    }
  }, [allSelected, reviews]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleEditStart = useCallback(
    (review: DeliveryReview) => {
      setEditingId(review.id);
      setEditText(review.aiReply ?? "");
    },
    []
  );

  const handleEditSave = useCallback(async () => {
    if (!editingId) return;
    setIsSavingEdit(true);
    try {
      await onUpdateReply(editingId, editText);
      setEditingId(null);
      setEditText("");
    } finally {
      setIsSavingEdit(false);
    }
  }, [editingId, editText, onUpdateReply]);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  const handlePublish = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setIsPublishing(true);
    try {
      await onPublish(ids);
      onClose();
    } finally {
      setIsPublishing(false);
    }
  }, [selectedIds, onPublish, onClose]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>AI 답글 일괄 검토</SheetTitle>
        </SheetHeader>

        {/* Select all toggle */}
        <div className="flex items-center justify-between px-1 py-2 border-b">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              aria-label="전체 선택"
            />
            <span className="text-muted-foreground">
              전체 선택 ({selectedIds.size}/{reviews.length})
            </span>
          </label>
        </div>

        {/* Review list */}
        <div className="flex-1 overflow-y-auto space-y-3 py-3">
          {reviews.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              검토할 AI 답글이 없습니다
            </p>
          )}

          {reviews.map((review) => {
            const isSelected = selectedIds.has(review.id);
            const isEditingThis = editingId === review.id;

            return (
              <div
                key={review.id}
                className={`rounded-lg border p-3 transition-colors ${
                  isSelected ? "border-amber-300 bg-amber-50/30" : "border-border"
                }`}
              >
                {/* Header row: checkbox + customer + rating + sentiment */}
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleOne(review.id)}
                    className="mt-0.5"
                    aria-label={`${review.customerName ?? "고객"} 리뷰 선택`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {review.customerName ?? "고객"}
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
                      <SentimentBadge score={review.sentimentScore} compact />
                    </div>

                    {/* Review content excerpt */}
                    {review.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {review.content}
                      </p>
                    )}

                    {/* AI Reply */}
                    <div className="mt-2 bg-background border rounded-md p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-amber-600">
                          AI 답글
                        </span>
                        {!isEditingThis && (
                          <button
                            type="button"
                            onClick={() => handleEditStart(review)}
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                            수정
                          </button>
                        )}
                      </div>

                      {isEditingThis ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="text-xs min-h-[80px]"
                          />
                          <div className="flex gap-1.5 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleEditCancel}
                              className="h-7 text-xs gap-1"
                            >
                              <X className="h-3 w-3" />
                              취소
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleEditSave}
                              disabled={isSavingEdit}
                              className="h-7 text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              {isSavingEdit ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              저장
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">
                          {review.aiReply}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: publish action */}
        <SheetFooter className="border-t pt-3 flex-row items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            선택된 답글 {selectedIds.size}건
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || selectedIds.size === 0}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              일괄 게시
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

"use client";

// Review page client component
// Displays real review data from delivery_reviews table with interactive controls

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageSquare, Clock, CheckCircle, Link, Sparkles, Loader2, Pencil, Send, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryReview, ReviewStats } from "@/lib/queries/review";

interface ReviewPageClientProps {
  reviews: DeliveryReview[];
  stats: ReviewStats;
  yearMonth: string;
  selectedPlatform: string;
  selectedStatus: string;
}

// Map platform codes to Korean display names
const PLATFORM_LABELS: Record<string, string> = {
  baemin: "배민",
  coupangeats: "쿠팡이츠",
  yogiyo: "요기요",
};

// Map reply status codes to Korean labels and badge variants
type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const STATUS_LABELS: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: "미답변", variant: "destructive" },
  draft: { label: "초안", variant: "outline" },
  auto_published: { label: "자동 발행", variant: "secondary" },
  published: { label: "발행 완료", variant: "default" },
  skipped: { label: "건너뜀", variant: "secondary" },
};

// Render star rating as visual stars
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// Determine sentiment badge color based on score
function SentimentBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  if (score >= 0.6)
    return (
      <Badge variant="outline" className="text-xs text-green-600 border-green-200">
        긍정
      </Badge>
    );
  if (score <= 0.3)
    return (
      <Badge variant="outline" className="text-xs text-red-500 border-red-200">
        부정
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
      중립
    </Badge>
  );
}

export function ReviewPageClient({
  reviews,
  stats,
  yearMonth,
  selectedPlatform,
  selectedStatus,
}: ReviewPageClientProps) {
  const router = useRouter();
  const [year, month] = yearMonth.split("-");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const handleGenerateReplies = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/dapjangi/process", { method: "POST" });
      if (!res.ok) throw new Error("AI reply generation failed");
      router.refresh();
    } catch {
      // Error handling - user sees button re-enabled
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditStart = (reviewId: string, currentReply: string) => {
    setEditingId(reviewId);
    setEditText(currentReply);
  };

  const handleEditSave = async (reviewId: string) => {
    setSavingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiReply: editText }),
      });
      if (!res.ok) throw new Error("Save failed");
      setEditingId(null);
      router.refresh();
    } catch {
      // Error handling
    } finally {
      setSavingId(null);
    }
  };

  const handlePublish = async (reviewId: string) => {
    if (!confirm("이 답글을 발행하시겠습니까?")) return;
    setPublishingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Publish failed");
      router.refresh();
    } catch {
      // Error handling
    } finally {
      setPublishingId(null);
    }
  };

  const pendingCount =
    stats.replyStatusBreakdown["pending"] ?? 0;
  const publishedCount =
    (stats.replyStatusBreakdown["auto_published"] ?? 0) +
    (stats.replyStatusBreakdown["published"] ?? 0);
  const replyRate =
    stats.totalCount > 0
      ? Math.round((publishedCount / stats.totalCount) * 100)
      : 0;

  const handlePlatformFilter = (platform: string) => {
    const params = new URLSearchParams();
    params.set("month", yearMonth);
    if (platform !== "all") params.set("platform", platform);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    router.push(`/review?${params.toString()}`);
  };

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams();
    params.set("month", yearMonth);
    if (selectedPlatform !== "all") params.set("platform", selectedPlatform);
    if (status !== "all") params.set("status", status);
    router.push(`/review?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <span>⭐</span>
          <span>답장이 · 리뷰 분석</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {year}년 {month}월 · 리뷰를 수집하고 분석하여 최적의 답글을 작성해드려요
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              총 리뷰
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCount}건</div>
            {stats.totalCount === 0 && (
              <p className="text-xs text-muted-foreground mt-1">이달 리뷰 없음</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              평균 평점
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCount > 0 ? stats.avgRating.toFixed(1) : "-"}
              {stats.totalCount > 0 && (
                <span className="text-base font-normal text-muted-foreground">점</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              미답변 리뷰
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingCount > 0 ? "text-red-600" : ""}`}>
              {pendingCount}건
            </div>
            {pendingCount > 0 && (
              <p className="text-xs text-red-500 mt-1">답변이 필요합니다</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              답변율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCount > 0 ? `${replyRate}%` : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Generate + Filter buttons */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleGenerateReplies}
            disabled={isGenerating}
            size="sm"
            className="gap-1.5"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isGenerating ? "생성 중..." : "AI 답글 생성"}
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex gap-1">
            {["all", "baemin", "coupangeats", "yogiyo"].map((platform) => (
              <Button
                key={platform}
                variant={selectedPlatform === platform ? "default" : "outline"}
                size="sm"
                onClick={() => handlePlatformFilter(platform)}
                className="text-xs"
              >
                {platform === "all" ? "전체" : PLATFORM_LABELS[platform] ?? platform}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            {["all", "pending", "draft", "published"].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter(status)}
                className="text-xs"
              >
                {status === "all" ? "전체 상태" : (STATUS_LABELS[status]?.label ?? status)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {reviews.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold mb-2">리뷰 데이터가 없습니다</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              설정에서 배달앱을 연결하면 답장이가 자동으로 리뷰를 수집하고 분석을 시작합니다.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/settings")}
              className="gap-2"
            >
              <Link className="h-4 w-4" />
              설정에서 데이터 연결하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review List */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review) => {
            const statusInfo = STATUS_LABELS[review.replyStatus] ?? {
              label: review.replyStatus,
              variant: "outline" as BadgeVariant,
            };
            return (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Review header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {PLATFORM_LABELS[review.platform] ?? review.platform}
                      </Badge>
                      <StarRating rating={review.rating} />
                      <SentimentBadge score={review.sentimentScore} />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={statusInfo.variant} className="text-xs">
                        {statusInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {review.reviewDate}
                      </span>
                    </div>
                  </div>

                  {/* Review content */}
                  {review.content && (
                    <p className="text-sm text-foreground mb-2 leading-relaxed">
                      {review.content}
                    </p>
                  )}

                  {/* Order summary */}
                  {review.orderSummary && (
                    <p className="text-xs text-muted-foreground mb-2">
                      주문: {review.orderSummary}
                    </p>
                  )}

                  {/* Keywords */}
                  {review.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {review.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI Reply */}
                  {review.aiReply && (
                    <div className="mt-3 bg-muted/50 border rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          답장이 AI 답글
                        </span>
                        <div className="flex gap-1">
                          {review.replyStatus === "draft" && editingId !== review.id && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2 gap-1"
                                onClick={() => handleEditStart(review.id, review.aiReply!)}
                              >
                                <Pencil className="h-3 w-3" />
                                수정하기
                              </Button>
                              <Button
                                size="sm"
                                className="text-xs h-6 px-2 gap-1"
                                disabled={publishingId === review.id}
                                onClick={() => handlePublish(review.id)}
                              >
                                {publishingId === review.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                                발행하기
                              </Button>
                            </>
                          )}
                          {review.replyStatus === "auto_published" && (
                            <Badge variant="secondary" className="text-xs">
                              자동 발행됨
                            </Badge>
                          )}
                          {review.replyStatus === "published" && (
                            <Badge variant="default" className="text-xs">
                              발행 완료
                            </Badge>
                          )}
                        </div>
                      </div>
                      {editingId === review.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="text-sm min-h-[80px]"
                          />
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-3 gap-1"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-3 w-3" />
                              취소
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs h-7 px-3 gap-1"
                              disabled={savingId === review.id}
                              onClick={() => handleEditSave(review.id)}
                            >
                              {savingId === review.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              저장
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground leading-relaxed">
                          {review.aiReply}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pending reply CTA */}
                  {!review.aiReply && review.replyStatus === "pending" && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>답장이가 답글을 작성하고 있습니다...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

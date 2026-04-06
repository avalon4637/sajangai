"use client";

// Review page client component - Dapjangi review management
// 2-column layout: review queue (left) + review detail (right)
// Redesigned with amber theme for the Dapjangi agent

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Link, CheckSquare, CircleCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DeliveryReview, ReviewStats } from "@/lib/queries/review";
import { ReviewStatsCards } from "@/components/dapjangi/review-stats-cards";
import { ReviewQueue } from "@/components/dapjangi/review-queue";
import { ReviewDetailPanel } from "@/components/dapjangi/review-detail-panel";
import { SentimentChart } from "@/components/dapjangi/sentiment-chart";
import { BatchReplyPanel } from "@/components/dapjangi/batch-reply-panel";
import { getSentimentCategory } from "@/components/dapjangi/sentiment-badge";
import {
  batchPublishReplies,
  updateReviewReplyText,
} from "@/lib/actions/review-actions";

interface ReviewPageClientProps {
  reviews: DeliveryReview[];
  stats: ReviewStats;
  yearMonth: string;
  selectedPlatform: string;
  selectedStatus: string;
}

type FilterStatus = "all" | "pending" | "draft" | "ai_waiting" | "published";
type SentimentFilter = "all" | "positive" | "neutral" | "negative";

const FILTER_CHIPS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "미답변" },
  { key: "ai_waiting", label: "AI대기" },
  { key: "published", label: "발행완료" },
];

const SENTIMENT_CHIPS: { key: SentimentFilter; label: string }[] = [
  { key: "all", label: "전체 감성" },
  { key: "positive", label: "긍정" },
  { key: "neutral", label: "중립" },
  { key: "negative", label: "부정" },
];

function getFilterCount(
  reviews: DeliveryReview[],
  filter: FilterStatus
): number {
  switch (filter) {
    case "all":
      return reviews.length;
    case "pending":
      return reviews.filter((r) => r.replyStatus === "pending").length;
    case "ai_waiting":
      return reviews.filter((r) => r.replyStatus === "draft").length;
    case "published":
      return reviews.filter(
        (r) =>
          r.replyStatus === "published" || r.replyStatus === "auto_published"
      ).length;
    default:
      return reviews.length;
  }
}

function filterReviews(
  reviews: DeliveryReview[],
  filter: FilterStatus,
  sentiment: SentimentFilter = "all"
): DeliveryReview[] {
  let result = reviews;

  // Status filter
  switch (filter) {
    case "pending":
      result = result.filter((r) => r.replyStatus === "pending");
      break;
    case "ai_waiting":
      result = result.filter((r) => r.replyStatus === "draft");
      break;
    case "published":
      result = result.filter(
        (r) =>
          r.replyStatus === "published" || r.replyStatus === "auto_published"
      );
      break;
  }

  // Sentiment filter
  if (sentiment !== "all") {
    result = result.filter((r) => getSentimentCategory(r.sentimentScore) === sentiment);
  }

  return result;
}

export function ReviewPageClient({
  reviews,
  stats,
  yearMonth,
  selectedPlatform,
  selectedStatus,
}: ReviewPageClientProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(
    reviews.length > 0 ? reviews[0].id : null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [batchPanelOpen, setBatchPanelOpen] = useState(false);
  const [showUnrepliedOnly, setShowUnrepliedOnly] = useState(false);

  // Reply completion stats
  const replyStats = useMemo(() => {
    const total = reviews.length;
    const replied = reviews.filter((r) => r.repliedAt).length;
    return { total, replied };
  }, [reviews]);

  // Compute filtered reviews
  const filteredReviews = useMemo(() => {
    let result = filterReviews(reviews, activeFilter, sentimentFilter);
    if (showUnrepliedOnly) {
      result = result.filter((r) => !r.repliedAt);
    }
    return result;
  }, [reviews, activeFilter, sentimentFilter, showUnrepliedOnly]);

  // Reviews eligible for batch review (have AI reply in draft status)
  const draftReviews = useMemo(
    () => reviews.filter((r) => r.aiReply && r.replyStatus === "draft"),
    [reviews]
  );

  // Find selected review
  const selectedReview = useMemo(
    () => reviews.find((r) => r.id === selectedReviewId) ?? null,
    [reviews, selectedReviewId]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedReviewId(id);
  }, []);

  const handleBatchPublish = useCallback(
    async (reviewIds: string[]) => {
      await batchPublishReplies(reviewIds);
      router.refresh();
    },
    [router]
  );

  const handleUpdateReply = useCallback(
    async (reviewId: string, aiReply: string) => {
      await updateReviewReplyText(reviewId, aiReply);
      router.refresh();
    },
    [router]
  );

  const handleGenerateReplies = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/dapjangi/process", { method: "POST" });
      if (!res.ok) throw new Error("AI reply generation failed");
      router.refresh();
    } catch {
      setGenerateError("AI 답글 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate days in period for daily average
  const [year, month] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const totalDays =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : daysInMonth;

  // Handle URL-based filter sync
  const handlePlatformFilter = (platform: string) => {
    const params = new URLSearchParams();
    params.set("month", yearMonth);
    if (platform !== "all") params.set("platform", platform);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    router.push(`/review?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Title + Badge */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">답장이 · 리뷰 분석</h1>
          <Badge className="bg-amber-500 text-white text-[10px] h-5">
            활동중
          </Badge>
        </div>

        {/* Center: Filter chips */}
        <div className="flex items-center gap-1.5">
          {FILTER_CHIPS.map((chip) => {
            const count = getFilterCount(reviews, chip.key);
            const isActive = activeFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setActiveFilter(chip.key);
                  // Reset selection to first filtered review
                  const filtered = filterReviews(reviews, chip.key, sentimentFilter);
                  if (filtered.length > 0) {
                    setSelectedReviewId(filtered[0].id);
                  } else {
                    setSelectedReviewId(null);
                  }
                }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {chip.label}
                <span
                  className={`text-[10px] ${
                    isActive ? "text-amber-100" : "text-muted-foreground"
                  }`}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Batch + AI generate buttons */}
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            {draftReviews.length > 0 && (
              <Button
                onClick={() => setBatchPanelOpen(true)}
                size="sm"
                variant="outline"
                className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                일괄 답글 검토
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-0.5">
                  {draftReviews.length}
                </Badge>
              </Button>
            )}
            <Button
              onClick={handleGenerateReplies}
              disabled={isGenerating}
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {isGenerating ? "생성 중..." : "AI 답글 생성"}
            </Button>
          </div>
        )}
      </div>

      {/* AI generation error message */}
      {generateError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {generateError}
        </div>
      )}

      {/* SENTIMENT FILTER ROW + REPLY STATS */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {SENTIMENT_CHIPS.map((chip) => {
            const isActive = sentimentFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setSentimentFilter(chip.key);
                  const filtered = filterReviews(reviews, activeFilter, chip.key);
                  if (filtered.length > 0) {
                    setSelectedReviewId(filtered[0].id);
                  } else {
                    setSelectedReviewId(null);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  isActive
                    ? chip.key === "positive"
                      ? "bg-green-500 text-white"
                      : chip.key === "negative"
                        ? "bg-red-500 text-white"
                        : chip.key === "neutral"
                          ? "bg-gray-500 text-white"
                          : "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {chip.label}
              </button>
            );
          })}

          {/* Separator */}
          <div className="w-px h-4 bg-border mx-1" />

          {/* Unreplied only toggle */}
          <button
            type="button"
            aria-pressed={showUnrepliedOnly}
            onClick={() => {
              setShowUnrepliedOnly(!showUnrepliedOnly);
              // Reset selection when toggling
              const nextFiltered = filterReviews(reviews, activeFilter, sentimentFilter)
                .filter((r) => (!showUnrepliedOnly ? !r.repliedAt : true));
              if (nextFiltered.length > 0) {
                setSelectedReviewId(nextFiltered[0].id);
              } else {
                setSelectedReviewId(null);
              }
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              showUnrepliedOnly
                ? "bg-orange-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            미답변만
          </button>

          {/* Reply completion stats */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleCheck className="h-3.5 w-3.5 text-green-500" />
            <span>
              {replyStats.replied}/{replyStats.total} 답변 완료
            </span>
          </div>
        </div>
      )}

      {/* STATS ROW */}
      <ReviewStatsCards stats={stats} totalDays={totalDays} reviews={reviews} />

      {/* Empty State */}
      {reviews.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="h-10 w-10 text-amber-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              리뷰 데이터가 없습니다
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              설정에서 배달앱을 연결하면 답장이가 자동으로 리뷰를 수집하고 분석을
              시작합니다.
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

      {/* MAIN CONTENT: 2-column layout */}
      {reviews.length > 0 && (
        <>
          {/* Desktop: side by side */}
          <div className="hidden md:grid md:grid-cols-[45%_55%] gap-0 border rounded-lg overflow-hidden bg-background min-h-[420px] transition-opacity duration-150">
            {/* LEFT: Review Queue */}
            <div className="border-r overflow-y-auto max-h-[500px]">
              <ReviewQueue
                reviews={filteredReviews}
                selectedId={selectedReviewId}
                onSelect={handleSelect}
              />
            </div>

            {/* RIGHT: Review Detail + AI Reply */}
            <div className="overflow-y-auto max-h-[500px]">
              <ReviewDetailPanel review={selectedReview} />
            </div>
          </div>

          {/* Mobile: stacked layout */}
          <div className="md:hidden space-y-3 transition-opacity duration-150">
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto">
                  <ReviewQueue
                    reviews={filteredReviews}
                    selectedId={selectedReviewId}
                    onSelect={handleSelect}
                  />
                </div>
              </CardContent>
            </Card>
            {selectedReview && (
              <Card>
                <CardContent className="p-0">
                  <ReviewDetailPanel review={selectedReview} />
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* BOTTOM ROW: Sentiment + Keywords */}
      {reviews.length > 0 && (
        <SentimentChart reviews={reviews} avgSentiment={stats.avgSentiment} />
      )}

      {/* Batch Reply Panel (Sheet) */}
      <BatchReplyPanel
        open={batchPanelOpen}
        reviews={draftReviews}
        onPublish={handleBatchPublish}
        onUpdateReply={handleUpdateReply}
        onClose={() => setBatchPanelOpen(false)}
      />
    </div>
  );
}

"use client";

// Review page client component - Dapjangi review management
// 2-column layout: review queue (left) + review detail (right)
// Redesigned with amber theme for the Dapjangi agent

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Link } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DeliveryReview, ReviewStats } from "@/lib/queries/review";
import { ReviewStatsCards } from "@/components/dapjangi/review-stats-cards";
import { ReviewQueue } from "@/components/dapjangi/review-queue";
import { ReviewDetailPanel } from "@/components/dapjangi/review-detail-panel";
import { SentimentChart } from "@/components/dapjangi/sentiment-chart";

interface ReviewPageClientProps {
  reviews: DeliveryReview[];
  stats: ReviewStats;
  yearMonth: string;
  selectedPlatform: string;
  selectedStatus: string;
}

type FilterStatus = "all" | "pending" | "draft" | "ai_waiting" | "published";

const FILTER_CHIPS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "미답변" },
  { key: "ai_waiting", label: "AI대기" },
  { key: "published", label: "발행완료" },
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
  filter: FilterStatus
): DeliveryReview[] {
  switch (filter) {
    case "pending":
      return reviews.filter((r) => r.replyStatus === "pending");
    case "ai_waiting":
      return reviews.filter((r) => r.replyStatus === "draft");
    case "published":
      return reviews.filter(
        (r) =>
          r.replyStatus === "published" || r.replyStatus === "auto_published"
      );
    default:
      return reviews;
  }
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
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(
    reviews.length > 0 ? reviews[0].id : null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Compute filtered reviews
  const filteredReviews = useMemo(
    () => filterReviews(reviews, activeFilter),
    [reviews, activeFilter]
  );

  // Find selected review
  const selectedReview = useMemo(
    () => reviews.find((r) => r.id === selectedReviewId) ?? null,
    [reviews, selectedReviewId]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedReviewId(id);
  }, []);

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
                onClick={() => {
                  setActiveFilter(chip.key);
                  // Reset selection to first filtered review
                  const filtered = filterReviews(reviews, chip.key);
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

        {/* Right: AI generate button */}
        {reviews.length > 0 && (
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
        )}
      </div>

      {/* STATS ROW */}
      <ReviewStatsCards stats={stats} totalDays={totalDays} />

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
          <div className="hidden md:grid md:grid-cols-[45%_55%] gap-0 border rounded-lg overflow-hidden bg-background min-h-[420px]">
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
          <div className="md:hidden space-y-3">
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
    </div>
  );
}

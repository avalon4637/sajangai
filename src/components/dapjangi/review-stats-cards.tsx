"use client";

// Review stats cards for Dapjangi review management page
// Displays 4 KPI cards: total reviews, avg rating, sentiment score, AI reply rate

import { Star, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DeliveryReview, ReviewStats } from "@/lib/queries/review";

interface ReviewStatsCardsProps {
  stats: ReviewStats;
  totalDays: number;
  reviews?: DeliveryReview[];
}

export function ReviewStatsCards({ stats, totalDays, reviews }: ReviewStatsCardsProps) {
  const publishedCount =
    (stats.replyStatusBreakdown["auto_published"] ?? 0) +
    (stats.replyStatusBreakdown["published"] ?? 0);

  // AI reply rate: reviews that have ai_reply (draft + published + auto_published)
  const aiReplyCount = reviews
    ? reviews.filter((r) => r.aiReply !== null).length
    : publishedCount + (stats.replyStatusBreakdown["draft"] ?? 0);
  const replyRate =
    stats.totalCount > 0
      ? Math.round((aiReplyCount / stats.totalCount) * 100)
      : 0;

  // Sentiment: calculate positive ratio from reviews if available
  const positiveCount = reviews
    ? reviews.filter((r) => r.sentimentScore !== null && r.sentimentScore >= 0.6).length
    : 0;
  const analyzedCount = reviews
    ? reviews.filter((r) => r.sentimentScore !== null).length
    : 0;
  const positiveRate =
    analyzedCount > 0 ? Math.round((positiveCount / analyzedCount) * 100) : null;

  // Fallback to avgSentiment from stats
  const sentimentScore =
    positiveRate !== null
      ? positiveRate
      : stats.avgSentiment !== null
        ? Math.round(stats.avgSentiment * 100)
        : null;

  const dailyAvg =
    totalDays > 0 ? (stats.totalCount / totalDays).toFixed(1) : "0";

  // Estimate saved hours: ~3 min per reply * published count / 60
  const savedHours = ((publishedCount * 3) / 60).toFixed(1);

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {/* Total Reviews */}
      <Card className="border-amber-100 bg-amber-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <MessageSquare className="h-4 w-4 text-amber-700" />
            </div>
            <span className="text-sm text-muted-foreground">
              총 리뷰
            </span>
          </div>
          <div className="text-2xl font-bold">{stats.totalCount}건</div>
          <p className="text-xs text-muted-foreground mt-1">
            일평균 {dailyAvg}건
          </p>
        </CardContent>
      </Card>

      {/* Average Rating */}
      <Card className="border-amber-100 bg-amber-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Star className="h-4 w-4 text-amber-700" />
            </div>
            <span className="text-sm text-muted-foreground">
              평균 별점
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-bold">
              {stats.totalCount > 0 ? stats.avgRating.toFixed(1) : "-"}
            </span>
            {stats.totalCount > 0 && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(stats.avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Score */}
      <Card className="border-amber-100 bg-amber-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <TrendingUp className="h-4 w-4 text-amber-700" />
            </div>
            <span className="text-sm text-muted-foreground">
              감성 점수
            </span>
          </div>
          <div className="text-2xl font-bold">
            {sentimentScore !== null ? `${sentimentScore}%` : "-"}
          </div>
          {sentimentScore !== null && (
            <>
              <p className="text-xs text-muted-foreground mt-0.5">
                긍정 비율 ({positiveCount}/{analyzedCount}건)
              </p>
              <SentimentBar score={sentimentScore} />
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Auto Reply Rate */}
      <Card className="border-amber-100 bg-amber-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Sparkles className="h-4 w-4 text-amber-700" />
            </div>
            <span className="text-sm text-muted-foreground">
              AI 자동답글률
            </span>
          </div>
          <div className="text-2xl font-bold">
            {stats.totalCount > 0 ? `${replyRate}%` : "-"}
          </div>
          {aiReplyCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {publishedCount > 0 ? `발행 ${publishedCount}건 · 절약 ${savedHours}시간` : `AI 답글 ${aiReplyCount}건`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 3-segment bar showing positive/neutral/negative distribution
function SentimentBar({ score }: { score: number }) {
  // Approximate distribution based on overall score
  const positive = Math.min(score, 100);
  const neutral = Math.max(0, Math.min(100 - score, 30));
  const negative = Math.max(0, 100 - positive - neutral);

  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden mt-2 gap-0.5">
      <div
        className="bg-green-500 rounded-full"
        style={{ width: `${positive}%` }}
      />
      <div
        className="bg-gray-300 rounded-full"
        style={{ width: `${neutral}%` }}
      />
      <div
        className="bg-red-400 rounded-full"
        style={{ width: `${negative}%` }}
      />
    </div>
  );
}

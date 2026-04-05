"use client";

// Sentiment distribution donut chart and keyword alert section
// Bottom row of Dapjangi review management page

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DeliveryReview } from "@/lib/queries/review";

interface SentimentChartProps {
  reviews: DeliveryReview[];
  avgSentiment: number | null;
}

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  neutral: "#9ca3af",
  negative: "#ef4444",
};

export function SentimentChart({ reviews, avgSentiment }: SentimentChartProps) {
  // Classify reviews by sentiment
  let positive = 0;
  let neutral = 0;
  let negative = 0;

  reviews.forEach((r) => {
    if (r.sentimentScore == null) return;
    if (r.sentimentScore >= 0.6) positive++;
    else if (r.sentimentScore <= 0.3) negative++;
    else neutral++;
  });

  const total = positive + neutral + negative;
  const chartData = [
    { name: "긍정", value: positive, color: SENTIMENT_COLORS.positive },
    { name: "중립", value: neutral, color: SENTIMENT_COLORS.neutral },
    { name: "부정", value: negative, color: SENTIMENT_COLORS.negative },
  ].filter((d) => d.value > 0);

  // Collect keyword frequency
  const keywordCounts: Record<string, number> = {};
  reviews.forEach((r) => {
    r.keywords.forEach((kw) => {
      keywordCounts[kw] = (keywordCounts[kw] ?? 0) + 1;
    });
  });
  const sortedKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const sentimentScore =
    avgSentiment !== null ? Math.round(avgSentiment * 100) : null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* Sentiment Distribution Donut */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-3">감성 분포</h4>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              감성 분석 데이터가 없습니다
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold">
                    {sentimentScore ?? "-"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">점</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">긍정</span>
                  <span className="font-medium ml-auto">{positive}건</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                  <span className="text-muted-foreground">중립</span>
                  <span className="font-medium ml-auto">{neutral}건</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">부정</span>
                  <span className="font-medium ml-auto">{negative}건</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Pattern Alert */}
      <Card className="border-l-4 border-l-amber-400">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-3">반복 패턴 알림</h4>
          {sortedKeywords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              키워드 패턴이 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                고객 리뷰에서 자주 언급되는 키워드입니다.
              </p>
              <div className="flex flex-wrap gap-2">
                {sortedKeywords.map(([keyword, count]) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="text-xs gap-1 border-amber-200 bg-amber-50/50"
                  >
                    #{keyword}
                    <span className="text-amber-600 font-semibold">
                      {count}
                    </span>
                  </Badge>
                ))}
              </div>
              {sortedKeywords.length >= 3 && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2">
                  상위 키워드:{" "}
                  <span className="font-medium">
                    {sortedKeywords
                      .slice(0, 3)
                      .map(([kw]) => `#${kw}`)
                      .join(", ")}
                  </span>
                  이 자주 언급되고 있습니다.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

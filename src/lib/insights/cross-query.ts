// Phase 1.4 — Revenue × Review cross-query helper
// Fetches recent revenue deltas alongside negative review texts in a single
// roundtrip. Used by cross-analyzer.ts to compute Level 3 (prescriptive) output.

import { createClient } from "@/lib/supabase/server";

export interface RevenueReviewCrossSnapshot {
  businessId: string;
  weekRange: { start: string; end: string };
  revenueThisWeek: number;
  revenuePrevWeek: number;
  revenueDeltaPct: number;
  negativeReviews: Array<{
    id: string;
    platform: string;
    rating: number;
    content: string;
    reviewDate: string;
  }>;
  unrepliedCount: number;
}

function iso(date: Date): string {
  return date.toISOString();
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns a 7d-vs-prior-7d snapshot joining `revenues` and `delivery_reviews`
 * (+ `naver_reviews` when available) for a single business.
 *
 * Designed to feed analyzeRevenueReviewCross() in cross-analyzer.ts.
 */
export async function fetchRevenueReviewSnapshot(
  businessId: string
): Promise<RevenueReviewCrossSnapshot> {
  const supabase = await createClient();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000);

  // Revenues — last 14 days
  const { data: revenues } = await supabase
    .from("revenues")
    .select("date, amount")
    .eq("business_id", businessId)
    .gte("date", dateOnly(twoWeeksAgo))
    .lt("date", dateOnly(now));

  let revenueThisWeek = 0;
  let revenuePrevWeek = 0;
  for (const row of revenues ?? []) {
    const d = new Date(row.date as string);
    const amount = Number(row.amount ?? 0);
    if (d >= oneWeekAgo) revenueThisWeek += amount;
    else if (d >= twoWeeksAgo) revenuePrevWeek += amount;
  }

  const revenueDeltaPct =
    revenuePrevWeek === 0
      ? revenueThisWeek > 0
        ? 100
        : 0
      : ((revenueThisWeek - revenuePrevWeek) / revenuePrevWeek) * 100;

  // Negative reviews — last 7 days, delivery_reviews
  const { data: negativeDelivery } = await supabase
    .from("delivery_reviews")
    .select("id, platform, rating, content, review_date, reply_status")
    .eq("business_id", businessId)
    .lte("rating", 3)
    .gte("review_date", iso(oneWeekAgo))
    .order("review_date", { ascending: false })
    .limit(20);

  const negativeReviews = (negativeDelivery ?? [])
    .filter((r) => typeof r.content === "string" && r.content.trim().length > 0)
    .map((r) => ({
      id: r.id as string,
      platform: (r.platform as string) ?? "delivery",
      rating: (r.rating as number) ?? 0,
      content: (r.content as string) ?? "",
      reviewDate: (r.review_date as string) ?? "",
    }));

  const unrepliedCount = (negativeDelivery ?? []).filter(
    (r) => r.reply_status === "pending" || r.reply_status === "draft"
  ).length;

  return {
    businessId,
    weekRange: { start: iso(oneWeekAgo), end: iso(now) },
    revenueThisWeek: Math.round(revenueThisWeek),
    revenuePrevWeek: Math.round(revenuePrevWeek),
    revenueDeltaPct: Math.round(revenueDeltaPct * 10) / 10,
    negativeReviews,
    unrepliedCount,
  };
}

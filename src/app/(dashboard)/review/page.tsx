// Review page - 답장이 AI agent review management
// Server component: fetches real review data from delivery_reviews table

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getReviews, getReviewStats } from "@/lib/queries/review";
import { ReviewPageClient } from "./page-client";

interface ReviewPageProps {
  searchParams: Promise<{ month?: string; platform?: string; status?: string }>;
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let businessId: string;
  try {
    businessId = await getCurrentBusinessId();
  } catch (error) {
    console.error("[Review] Failed to get business ID:", error);
    redirect("/auth/onboarding");
  }

  const params = await searchParams;
  const now = new Date();
  const yearMonth =
    params.month ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch reviews and stats in parallel
  const [reviews, stats] = await Promise.all([
    getReviews(businessId, {
      platform: params.platform as "baemin" | "coupangeats" | "yogiyo" | undefined,
      replyStatus: params.status,
      limit: 50,
    }),
    getReviewStats(businessId, yearMonth),
  ]);

  return (
    <ReviewPageClient
      reviews={reviews}
      stats={stats}
      yearMonth={yearMonth}
      selectedPlatform={params.platform ?? "all"}
      selectedStatus={params.status ?? "all"}
    />
  );
}

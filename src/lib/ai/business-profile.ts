// Business Profile Engine
// Generates a ~500 token text summary of a business for AI context injection.
// Injected into ALL AI calls to provide consistent business awareness.

import { createClient } from "@/lib/supabase/server";

export interface BusinessProfile {
  businessName: string;
  industry: string;
  location: string;
  monthlyAvgRevenue: number;
  revenueGrowthRate: number;
  deliveryRatio: number;
  profitMargin: number;
  laborRatio: number;
  avgRating: number;
  ratingTrend: string;
  topComplaints: string[];
  responseRate: number;
  // From agent_memory
  ownerConcerns: string[];
  pastInsights: string[];
}

// @MX:ANCHOR: Central business profile builder - injected into all AI chat calls
// @MX:REASON: Fan-in from chat route (POST), future dashboard widgets, proactive diagnosis

/**
 * Build a ~500 token Korean text summary of a business.
 * Queries multiple tables concurrently and formats into a structured profile block.
 *
 * @param businessId - UUID of the business
 * @returns Formatted Korean text block for AI system prompt injection
 */
export async function buildBusinessProfile(businessId: string): Promise<string> {
  const supabase = await createClient();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Calculate date ranges
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const currentYearMonth = todayStr.substring(0, 7);
  const prevMonthDate = new Date(today);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevYearMonth = prevMonthDate.toISOString().substring(0, 7);

  // Run all queries concurrently for performance
  const [
    businessResult,
    revenueResult,
    prevMonthRevenueResult,
    latestSummaryResult,
    fixedCostsResult,
    reviewResult,
    agentMemoryResult,
  ] = await Promise.all([
    // 1. Business info
    supabase
      .from("businesses")
      .select("name, business_type, address, created_at")
      .eq("id", businessId)
      .single(),

    // 2. Last 6 months revenue (for avg and growth calc)
    supabase
      .from("revenues")
      .select("amount, date, channel")
      .eq("business_id", businessId)
      .gte("date", sixMonthsAgoStr)
      .lte("date", todayStr),

    // 3. Previous month revenue for comparison
    supabase
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", `${prevYearMonth}-01`)
      .lte("date", `${prevYearMonth}-31`),

    // 4. Latest monthly summary (profit margin)
    supabase
      .from("monthly_summaries")
      .select("net_profit, total_revenue, total_expense")
      .eq("business_id", businessId)
      .order("year_month", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // 5. Fixed costs (labor ratio)
    supabase
      .from("fixed_costs")
      .select("amount, is_labor")
      .eq("business_id", businessId),

    // 6. Reviews last 30 days
    supabase
      .from("delivery_reviews")
      .select("rating, reply_status, keywords")
      .eq("business_id", businessId)
      .gte("review_date", thirtyDaysAgoStr),

    // 7. Agent memory (high importance insights)
    supabase
      .from("agent_memory")
      .select("content, memory_type, agent_type")
      .eq("business_id", businessId)
      .gte("importance", 7)
      .eq("agent_type", "manager")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Extract business info
  const business = businessResult.data;
  const businessName = business?.name ?? "매장";
  const industry = business?.business_type ?? "외식업";
  const location = business?.address ?? "위치 미설정";
  const createdAt = business?.created_at
    ? new Date(business.created_at)
    : new Date();
  const operatingMonths = Math.max(
    1,
    Math.floor(
      (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
  );

  // Calculate revenue metrics
  const revenues = revenueResult.data ?? [];
  const prevMonthRevenues = prevMonthRevenueResult.data ?? [];

  // Group by month to calculate average
  const monthlyTotals: Record<string, number> = {};
  for (const r of revenues) {
    const month = r.date.substring(0, 7);
    monthlyTotals[month] = (monthlyTotals[month] ?? 0) + Number(r.amount);
  }
  const monthValues = Object.values(monthlyTotals);
  const monthlyAvgRevenue =
    monthValues.length > 0
      ? Math.round(
          monthValues.reduce((s, v) => s + v, 0) / monthValues.length
        )
      : 0;

  // Growth rate: compare current month vs previous month
  const currentMonthTotal = monthlyTotals[currentYearMonth] ?? 0;
  const prevMonthRevenueSum = prevMonthRevenues.reduce(
    (s, r) => s + Number(r.amount),
    0
  );
  const prevMonthTotal =
    prevMonthRevenueSum > 0
      ? prevMonthRevenueSum
      : (monthlyTotals[prevYearMonth] ?? 0);
  let revenueGrowthRate = 0;
  if (prevMonthTotal > 0) {
    revenueGrowthRate = Math.round(
      ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
    );
  }

  // Delivery ratio (baemin, coupangeats, yogiyo vs total)
  const deliveryChannels = new Set(["baemin", "coupangeats", "yogiyo"]);
  let deliveryTotal = 0;
  let allTotal = 0;
  const channelTotals: Record<string, number> = {};
  for (const r of revenues) {
    allTotal += Number(r.amount);
    const ch = (r.channel ?? "기타").toLowerCase();
    channelTotals[ch] = (channelTotals[ch] ?? 0) + Number(r.amount);
    if (deliveryChannels.has(ch)) {
      deliveryTotal += Number(r.amount);
    }
  }
  const deliveryRatio =
    allTotal > 0 ? Math.round((deliveryTotal / allTotal) * 100) : 0;

  // Top delivery channel
  let topChannel = "홀";
  let topChannelAmount = 0;
  for (const [ch, amt] of Object.entries(channelTotals)) {
    if (deliveryChannels.has(ch) && amt > topChannelAmount) {
      topChannelAmount = amt;
      topChannel =
        ch === "baemin"
          ? "배민"
          : ch === "coupangeats"
            ? "쿠팡이츠"
            : ch === "yogiyo"
              ? "요기요"
              : ch;
    }
  }

  // Profit margin from latest monthly summary
  const summary = latestSummaryResult.data;
  let profitMargin = 0;
  if (summary && Number(summary.total_revenue) > 0) {
    profitMargin = Math.round(
      (Number(summary.net_profit) / Number(summary.total_revenue)) * 100
    );
  }

  // Labor ratio from fixed costs
  const fixedCosts = fixedCostsResult.data ?? [];
  const totalFixedCosts = fixedCosts.reduce(
    (s, c) => s + Number(c.amount),
    0
  );
  const laborCosts = fixedCosts
    .filter((c) => c.is_labor)
    .reduce((s, c) => s + Number(c.amount), 0);
  const laborRatio =
    monthlyAvgRevenue > 0
      ? Math.round((laborCosts / monthlyAvgRevenue) * 100)
      : totalFixedCosts > 0
        ? Math.round((laborCosts / totalFixedCosts) * 100)
        : 0;

  // Review stats
  const reviews = reviewResult.data ?? [];
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviewCount) *
            10
        ) / 10
      : 0;

  // Rating trend (simple: compare first half vs second half of last 30 days)
  const midPoint = Math.floor(reviewCount / 2);
  const recentHalf = reviews.slice(0, midPoint);
  const olderHalf = reviews.slice(midPoint);
  const recentAvg =
    recentHalf.length > 0
      ? recentHalf.reduce((s, r) => s + Number(r.rating), 0) /
        recentHalf.length
      : avgRating;
  const olderAvg =
    olderHalf.length > 0
      ? olderHalf.reduce((s, r) => s + Number(r.rating), 0) / olderHalf.length
      : avgRating;
  const ratingTrend =
    recentAvg > olderAvg + 0.2
      ? "상승"
      : recentAvg < olderAvg - 0.2
        ? "하락"
        : "유지";

  // Top complaints from keywords
  const keywordCounts: Record<string, number> = {};
  for (const r of reviews) {
    const kws = Array.isArray(r.keywords) ? (r.keywords as string[]) : [];
    for (const kw of kws) {
      if (kw && Number(r.rating) <= 3) {
        keywordCounts[kw] = (keywordCounts[kw] ?? 0) + 1;
      }
    }
  }
  const topComplaints = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([kw]) => kw);

  // Response rate
  const repliedCount = reviews.filter(
    (r) =>
      r.reply_status === "auto_published" || r.reply_status === "published"
  ).length;
  const responseRate =
    reviewCount > 0 ? Math.round((repliedCount / reviewCount) * 100) : 0;

  // Agent memory
  const memories = agentMemoryResult.data ?? [];
  const ownerConcerns = memories
    .filter((m) => m.memory_type === "preference" || m.memory_type === "fact")
    .map((m) => m.content)
    .slice(0, 3);
  const pastInsights = memories
    .filter((m) => m.memory_type === "insight")
    .map((m) => m.content)
    .slice(0, 3);

  // Format the profile text (~500 tokens)
  const growthStr =
    revenueGrowthRate > 0
      ? `+${revenueGrowthRate}%`
      : `${revenueGrowthRate}%`;
  const amountInManwon = Math.round(monthlyAvgRevenue / 10000);

  const lines: string[] = [
    `[가게 프로필 - ${todayStr}]`,
    `${location} ${industry} | 운영 ${operatingMonths}개월 | 월평균 매출 ${amountInManwon}만원 (${growthStr}/월)`,
    `배달 ${deliveryRatio}%(${topChannel} 주력) | 순이익률 ${profitMargin}% | 인건비 ${laborRatio}%`,
    `리뷰 ${avgRating}점(${ratingTrend}) | 주 불만: ${topComplaints.length > 0 ? topComplaints.join(", ") : "특이사항 없음"} | 응답률 ${responseRate}%`,
  ];

  if (ownerConcerns.length > 0) {
    lines.push(`사장님 관심: ${ownerConcerns.join(" / ")}`);
  }
  if (pastInsights.length > 0) {
    lines.push(`최근 인사이트: ${pastInsights.join(" / ")}`);
  }

  return lines.join("\n");
}

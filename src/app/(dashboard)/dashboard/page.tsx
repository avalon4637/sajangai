import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getMonthlyKpi } from "@/lib/queries/monthly-summary";
import { getActiveInsights } from "@/lib/insights/queries";
import { getDailyBriefingData } from "@/lib/queries/briefing";
import { JeongjangChatHub } from "@/components/jeongjang/jeongjang-chat-hub";
import { DailyBriefing } from "@/components/dashboard/daily-briefing";
import { OnboardingBriefing } from "@/components/dashboard/onboarding-briefing";
import { BriefingRichCard } from "@/components/dashboard/briefing-rich-card";
import { InsightCard } from "@/components/dashboard/insight-card";
import { ReviewAlertCard } from "@/components/dashboard/review-alert-card";
import { MobileChatInput } from "@/components/dashboard/mobile-chat-input";
import type { ChatMessageData } from "@/components/jeongjang/chat-message";

export default async function DashboardPage() {
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
    console.error("[Dashboard] Failed to get business ID:", error);
    redirect("/auth/onboarding");
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch all data in parallel
  const [
    briefingData,
    kpi,
    business,
    latestBriefing,
    recentInsights,
    pendingNegativeReviews,
  ] = await Promise.all([
    getDailyBriefingData(businessId),
    getMonthlyKpi(businessId, currentMonth),
    supabase
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .single()
      .then((res) => res.data),
    supabase
      .from("daily_reports")
      .select("id, report_date, summary, content")
      .eq("business_id", businessId)
      .eq("report_type", "jeongjang_briefing")
      .order("report_date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((res) => res.data),
    getActiveInsights(businessId)
      .then((scored) => scored.slice(0, 3).map((s) => s.event))
      .catch(() => []),
    // Pending negative reviews for alert cards
    supabase
      .from("delivery_reviews")
      .select("id, platform, rating, content")
      .eq("business_id", businessId)
      .eq("reply_status", "pending")
      .lte("rating", 2)
      .order("created_at", { ascending: false })
      .limit(3)
      .then((res) => res.data ?? []),
  ]);

  const businessName = business?.name ?? "매장";

  // Build initial chat messages from real data
  const initialMessages: ChatMessageData[] = [];

  // Briefing message
  if (latestBriefing) {
    const content =
      (latestBriefing.content as Record<string, string>)?.narrative ??
      latestBriefing.summary ??
      "오늘의 브리핑을 준비 중입니다.";

    initialMessages.push({
      id: `briefing-${latestBriefing.id}`,
      agent: "jeongjang",
      type: "briefing",
      time: "오전 7:30",
      content,
      kpis: [
        {
          label: "이번달 매출",
          value: `${Math.round((kpi?.total_revenue ?? 0) / 10000)}만`,
        },
        {
          label: "순이익",
          value: `${Math.round((kpi?.net_profit ?? 0) / 10000)}만`,
        },
        {
          label: "수익률",
          value: `${((kpi?.gross_margin ?? 0) * 100).toFixed(1)}%`,
        },
      ],
    });
  }

  // Insight messages
  for (const insight of recentInsights) {
    const severity: "critical" | "warning" | "info" =
      insight.severity === "critical"
        ? "critical"
        : insight.severity === "warning"
          ? "warning"
          : "info";

    const agent =
      insight.scenarioId?.startsWith("A") || insight.scenarioId?.startsWith("B")
        ? "seri"
        : insight.scenarioId?.startsWith("C")
          ? "dapjangi"
          : "viral";

    initialMessages.push({
      id: `insight-${insight.id}`,
      agent: agent as "seri" | "dapjangi" | "viral",
      type: "alert",
      severity,
      time: new Date(insight.createdAt).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      content:
        insight.detection?.title ?? "인사이트가 감지되었습니다.",
      actions: [
        { label: "내용 확인", variant: "primary", icon: "eye" },
        { label: "나중에", variant: "ghost" },
      ],
    });
  }

  // Fallback if no messages
  if (initialMessages.length === 0) {
    initialMessages.push({
      id: "welcome",
      agent: "jeongjang",
      type: "text",
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      content: `안녕하세요, ${businessName} 사장님! 저는 AI 점장입니다. 매장 운영에 필요한 것들을 물어보세요.`,
    });
  }

  // Calculate values for briefing rich card
  const dayDelta =
    briefingData.revenue.dayBeforeYesterday === 0
      ? briefingData.revenue.yesterday > 0
        ? 100
        : 0
      : ((briefingData.revenue.yesterday -
          briefingData.revenue.dayBeforeYesterday) /
          briefingData.revenue.dayBeforeYesterday) *
        100;

  const weeklyChange = briefingData.periodComparison?.weekChange ?? 0;
  const monthProjection =
    briefingData.periodComparison?.monthProjection ??
    briefingData.revenue.monthTotal;
  const profitMargin = (kpi?.gross_margin ?? 0) * 100;

  const briefingText =
    (latestBriefing?.content as Record<string, string>)?.narrative ??
    latestBriefing?.summary ??
    undefined;

  return (
    <div className="-m-4 md:-m-6 flex h-[calc(100dvh-3.5rem)] md:h-[100dvh] flex-col">
      {/* Compact Briefing Strip */}
      <div className="shrink-0 px-2 pt-2 md:px-3 md:pt-3">
        {briefingData.hasAnyData ? (
          <DailyBriefing data={briefingData} businessName={businessName} />
        ) : (
          <OnboardingBriefing businessName={businessName} />
        )}
      </div>

      {/* Mobile: Content Feed | Desktop: Chat Hub */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Mobile feed - visible only on mobile */}
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:hidden">
          {/* Briefing Rich Card */}
          <BriefingRichCard
            revenue={briefingData.revenue.yesterday}
            revenueChange={dayDelta}
            netProfit={kpi?.net_profit ?? 0}
            profitMargin={profitMargin}
            weeklyChange={weeklyChange}
            monthProjection={monthProjection}
            monthTarget={briefingData.revenue.monthTarget ?? undefined}
            reviewCount={briefingData.reviews.totalThisMonth}
            unansweredReviews={briefingData.reviews.unansweredCount}
            briefingText={briefingText}
            time="오전 7:30"
          />

          {/* Insight Feed */}
          {recentInsights.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold text-muted-foreground">
                인사이트
              </p>
              {recentInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  severity={
                    (insight.severity as "critical" | "warning" | "info") ??
                    "info"
                  }
                  title={insight.detection?.title ?? ""}
                  description={
                    insight.detection
                      ? `${insight.detection.metric} (${insight.detection.comparedTo})`
                      : ""
                  }
                  actionHref="/analysis"
                  actionLabel="상세 보기"
                />
              ))}
            </div>
          )}

          {/* Unanswered negative reviews */}
          {pendingNegativeReviews.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold text-muted-foreground">
                미답변 리뷰
              </p>
              {pendingNegativeReviews.map((review) => (
                <ReviewAlertCard
                  key={review.id}
                  platform={review.platform}
                  rating={review.rating}
                  preview={
                    review.content
                      ? review.content.length > 80
                        ? review.content.substring(0, 80) + "..."
                        : review.content
                      : "내용 없음"
                  }
                />
              ))}
            </div>
          )}

          {/* Quick action suggestions */}
          <div className="space-y-2">
            <p className="px-1 text-xs font-semibold text-muted-foreground">
              점장에게 물어보기
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "요즘 장사 어때?",
                "이번 달 매출 분석",
                "리뷰 상황 알려줘",
                "비용 줄일 곳 있어?",
              ].map((q) => (
                <button
                  key={q}
                  className="rounded-xl border p-2.5 text-left text-xs transition-colors hover:border-blue-300 hover:bg-blue-50/50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: Chat Hub - hidden on mobile, visible on sm+ */}
        <div className="hidden min-h-0 flex-1 flex-col sm:flex">
          <JeongjangChatHub
            businessId={businessId}
            businessName={businessName}
            initialMessages={initialMessages}
          />
        </div>

        {/* Mobile: Chat input at bottom (always visible) */}
        <div className="shrink-0 sm:hidden">
          <MobileChatInput businessId={businessId} />
        </div>
      </div>
    </div>
  );
}

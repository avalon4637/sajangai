import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getMonthlyKpi } from "@/lib/queries/monthly-summary";
import { getActiveInsights } from "@/lib/insights/queries";
import { getDailyBriefingData } from "@/lib/queries/briefing";
import { JeongjangChatHub } from "@/components/jeongjang/jeongjang-chat-hub";
import { DailyBriefing } from "@/components/dashboard/daily-briefing";
import { OnboardingBriefing } from "@/components/dashboard/onboarding-briefing";
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
  } catch {
    redirect("/auth/onboarding");
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch all data in parallel
  const [briefingData, kpi, business, latestBriefing, recentInsights] = await Promise.all([
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
      .then((insights) => insights.slice(0, 3))
      .catch(() => []),
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

  // ROI data (placeholder - will be calculated from real data later)
  const roiData = {
    savedMoney: 847000,
    savedHours: 23,
    processedTasks: 142,
  };

  return (
    <div className="-m-4 md:-m-6 flex h-[calc(100vh-0px)] md:h-screen flex-col">
      {/* Compact Briefing Strip */}
      <div className="shrink-0 px-2 pt-2 md:px-3 md:pt-3">
        {briefingData.hasAnyData ? (
          <DailyBriefing data={briefingData} businessName={businessName} />
        ) : (
          <OnboardingBriefing businessName={businessName} />
        )}
      </div>

      {/* Chat Hub - takes remaining space */}
      <div className="flex-1 min-h-0">
        <JeongjangChatHub
          businessId={businessId}
          businessName={businessName}
          initialMessages={initialMessages}
          roiData={roiData}
        />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import {
  getDailyRevenues,
  getPreviousMonthRevenues,
  calculateMonthlyAnalysis,
} from "@/lib/queries/daily-revenue";
import { AnalysisPageClient } from "./page-client";

interface SeriReportData {
  id: string;
  report_date: string;
  summary: string | null;
  content: Record<string, unknown> | null;
}

interface AnalysisPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function AnalysisPage({ searchParams }: AnalysisPageProps) {
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

  const params = await searchParams;
  const now = new Date();
  const yearMonth =
    params.month ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Load current and previous month data + seri report in parallel
  const [currentData, previousData, seriReportResult] = await Promise.all([
    getDailyRevenues(businessId, yearMonth),
    getPreviousMonthRevenues(businessId, yearMonth),
    supabase
      .from("daily_reports")
      .select("id, report_date, summary, content")
      .eq("business_id", businessId)
      .eq("report_type", "seri_profit")
      .gte("report_date", `${yearMonth}-01`)
      .lte("report_date", `${yearMonth}-31`)
      .order("report_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const seriReport: SeriReportData | null = seriReportResult.data as SeriReportData | null;

  const currentSummary = calculateMonthlyAnalysis(currentData, yearMonth);

  // Calculate previous month's yearMonth for summary
  const [y, m] = yearMonth.split("-").map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const prevYearMonth = `${prevY}-${String(prevM).padStart(2, "0")}`;
  const previousSummary = calculateMonthlyAnalysis(previousData, prevYearMonth);

  return (
    <AnalysisPageClient
      businessId={businessId}
      yearMonth={yearMonth}
      currentData={currentData}
      previousData={previousData}
      currentSummary={currentSummary}
      previousSummary={previousSummary}
      seriReport={seriReport}
    />
  );
}

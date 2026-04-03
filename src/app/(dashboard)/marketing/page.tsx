import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChurnRisk {
  platform: string;
  lastOrderDate: string;
  daysSinceOrder: number;
  orderCount: number;
  riskLevel: "warning" | "critical";
}

interface ViralContext {
  churnRisks: ChurnRisk[];
  totalAtRisk: number;
  messagesGenerated: number;
  updatedAt: string;
}

export default async function MarketingPage() {
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

  // Load viral agent context from store_context
  const { data: viralStore } = await supabase
    .from("store_context")
    .select("context_data, summary, updated_at")
    .eq("business_id", businessId)
    .eq("agent_type", "viral")
    .maybeSingle();

  const viralData = viralStore?.context_data as unknown as ViralContext | null;
  const churnRisks = viralData?.churnRisks ?? [];
  const criticalCount = churnRisks.filter((r) => r.riskLevel === "critical").length;
  const warningCount = churnRisks.filter((r) => r.riskLevel === "warning").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <span>📢</span>
          <span>바이럴 · 마케팅</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          이탈 위험 고객 감지 및 재방문 유도 메시지를 관리하세요
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이탈 위험
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churnRisks.length}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalCount > 0
                ? `긴급 ${criticalCount}건 포함`
                : "감지된 위험 없음"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              긴급 (21일+)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}건</div>
            <p className="text-xs text-muted-foreground mt-1">재방문 문자 필요</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              주의 (14일+)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{warningCount}건</div>
            <p className="text-xs text-muted-foreground mt-1">모니터링 중</p>
          </CardContent>
        </Card>
      </div>

      {/* Churn Risk List */}
      {churnRisks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">이탈 위험 채널</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {churnRisks.map((risk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{risk.platform}</span>
                      <Badge
                        variant="outline"
                        className={
                          risk.riskLevel === "critical"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }
                      >
                        {risk.riskLevel === "critical" ? "긴급" : "주의"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      마지막 활동: {risk.lastOrderDate} ({risk.daysSinceOrder}일 전)
                      · 총 {risk.orderCount}일 활동
                    </p>
                  </div>
                  <form action={`/api/marketing/send`} method="POST">
                    <input type="hidden" name="businessId" value={businessId} />
                    <input type="hidden" name="platform" value={risk.platform} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      문자 보내기
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold mb-2">
              이탈 위험이 감지되지 않았어요
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {viralStore
                ? "모든 채널에서 정상적으로 활동이 이루어지고 있어요."
                : "아침 분석이 완료되면 이탈 위험 고객이 여기에 표시됩니다."}
            </p>
            {viralStore?.updated_at && (
              <p className="text-xs text-muted-foreground mt-3">
                마지막 분석: {new Date(viralStore.updated_at).toLocaleString("ko-KR")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

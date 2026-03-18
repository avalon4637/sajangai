import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MarketingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    await getCurrentBusinessId();
  } catch {
    redirect("/auth/onboarding");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <span>📢</span>
          <span>바이럴 · 마케팅</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          재방문 유도, 프로모션, SNS 마케팅을 제안해드려요
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              재방문율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34.2%</div>
            <p className="text-xs text-green-600 mt-1">+2.3% 전월 대비</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              문자 발송
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128건</div>
            <p className="text-xs text-blue-600 mt-1">이번 달 카카오 알림톡</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              SNS 제안
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5건</div>
            <p className="text-xs text-amber-600 mt-1">2건 승인 대기</p>
          </CardContent>
        </Card>
      </div>

      {/* Phase 2 Coming Soon State */}
      <Card>
        <CardContent className="py-16 text-center">
          <div className="text-4xl mb-4">📢</div>
          <h3 className="text-lg font-semibold mb-2">
            바이럴 에이전트 준비 중
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
            바이럴 에이전트는 준비 중입니다. 데이터가 연동되면 맞춤 마케팅을 제안해드릴게요.
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            카카오 알림톡, 재방문 유도 문자, SNS 게시물 제안 등 다양한 마케팅 기능을 Phase 2에서 제공할 예정입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

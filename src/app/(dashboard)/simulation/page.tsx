import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getMonthlyKpi } from "@/lib/queries/monthly-summary";
import { SimulationForm } from "@/components/simulation/simulation-form";
import { EmptyState } from "@/components/ui/empty-state";
import type { KpiInput } from "@/lib/kpi/calculator";
import { FlaskConical } from "lucide-react";

export default async function SimulationPage() {
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
    redirect("/onboarding");
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const kpiData = await getMonthlyKpi(businessId, currentMonth);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">What-if 시뮬레이션</h1>
        <p className="text-muted-foreground mt-1">
          경영 의사결정 전 &lsquo;만약 ~하면?&rsquo; 시나리오를 시뮬레이션합니다.
        </p>
      </div>

      {!kpiData ? (
        <EmptyState
          icon={FlaskConical}
          title="데이터가 필요합니다"
          description="시뮬레이션을 실행하려면 먼저 경영 데이터를 입력해주세요."
          actionLabel="대시보드로 이동"
          actionHref="/dashboard"
        />
      ) : (
        <SimulationForm
          currentInput={
            {
              totalRevenue: kpiData.total_revenue,
              totalExpense: kpiData.total_expense,
              totalFixedCost: kpiData.total_fixed_cost,
              totalLaborCost: kpiData.total_labor_cost,
            } satisfies KpiInput
          }
        />
      )}
    </div>
  );
}

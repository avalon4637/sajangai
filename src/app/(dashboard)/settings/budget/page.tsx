import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getBudgetComparison, type BudgetVsActual } from "@/lib/queries/budget";
import { BudgetManager } from "./budget-manager";

export default async function BudgetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let businessId: string;
  try {
    businessId = await getCurrentBusinessId();
  } catch {
    redirect("/auth/onboarding");
  }

  const now = new Date();
  let comparison: BudgetVsActual[];
  try {
    comparison = await getBudgetComparison(businessId, now.getFullYear(), now.getMonth() + 1);
  } catch {
    comparison = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">예산 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">
          카테고리별 월 예산을 설정하고 달성률을 확인하세요
        </p>
      </div>
      <BudgetManager
        businessId={businessId}
        comparison={comparison}
        year={now.getFullYear()}
        month={now.getMonth() + 1}
      />
    </div>
  );
}

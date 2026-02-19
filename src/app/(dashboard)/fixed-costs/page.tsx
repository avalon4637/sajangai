import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getFixedCosts } from "@/lib/queries/fixed-cost";
import { FixedCostPageClient } from "./page-client";

export default async function FixedCostsPage() {
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

  const fixedCosts = await getFixedCosts(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">고정비 관리</h1>
        <p className="text-muted-foreground mt-1">
          매월 반복되는 고정비와 인건비를 관리할 수 있습니다.
        </p>
      </div>
      <Suspense fallback={<div>로딩 중...</div>}>
        <FixedCostPageClient fixedCosts={fixedCosts} />
      </Suspense>
    </div>
  );
}

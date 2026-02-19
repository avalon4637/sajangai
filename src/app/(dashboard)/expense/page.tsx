import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getExpenses } from "@/lib/queries/expense";
import { ExpensePageClient } from "./page-client";

interface ExpensePageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function ExpensePage({ searchParams }: ExpensePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const now = new Date();
  const currentMonth =
    params.month ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let businessId: string;
  try {
    businessId = await getCurrentBusinessId();
  } catch {
    redirect("/onboarding");
  }

  const expenses = await getExpenses(businessId, currentMonth);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">비용 관리</h1>
        <p className="text-muted-foreground mt-1">
          비용 데이터를 등록하고 관리할 수 있습니다.
        </p>
      </div>
      <Suspense fallback={<div>로딩 중...</div>}>
        <ExpensePageClient expenses={expenses} />
      </Suspense>
    </div>
  );
}

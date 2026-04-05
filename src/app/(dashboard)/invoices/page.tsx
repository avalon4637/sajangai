import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getInvoices, getOutstandingBalance } from "@/lib/queries/invoice";
import { InvoicesPageClient } from "./page-client";

interface InvoicesPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
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
  const activeType = params.type === "payable" ? "payable" : "receivable";

  const [invoices, balance] = await Promise.all([
    getInvoices(businessId, { type: activeType as "receivable" | "payable" }),
    getOutstandingBalance(businessId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">계산서 관리</h1>
        <p className="text-muted-foreground mt-1">
          매출/매입 세금계산서를 관리할 수 있습니다.
        </p>
      </div>
      <Suspense fallback={<div>로딩 중...</div>}>
        <InvoicesPageClient
          invoices={invoices}
          balance={balance}
          activeType={activeType}
        />
      </Suspense>
    </div>
  );
}

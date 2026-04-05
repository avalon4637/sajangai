import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getVendors } from "@/lib/queries/vendor";
import { VendorsPageClient } from "./page-client";

export default async function VendorsPage() {
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

  // Fetch vendors and this month's expenses per vendor
  const vendors = await getVendors(businessId);

  // Get current month expense totals per vendor (counterparty match)
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = now.getMonth() === 11
    ? `${now.getFullYear() + 1}-01-01`
    : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}-01`;

  const { data: expenses } = await supabase
    .from("expenses")
    .select("category, amount")
    .eq("business_id", businessId)
    .gte("date", monthStart)
    .lt("date", nextMonth);

  // Also get invoice payables for this month to calculate vendor totals
  const { data: invoices } = await supabase
    .from("invoices")
    .select("counterparty, amount")
    .eq("business_id", businessId)
    .eq("type", "payable")
    .gte("issue_date", monthStart)
    .lt("issue_date", nextMonth);

  // Build vendor monthly totals from invoices (counterparty = vendor name)
  const vendorTotals: Record<string, number> = {};
  for (const inv of invoices ?? []) {
    vendorTotals[inv.counterparty] =
      (vendorTotals[inv.counterparty] ?? 0) + inv.amount;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">거래처 관리</h1>
        <p className="text-muted-foreground mt-1">
          거래처 정보를 등록하고 관리할 수 있습니다.
        </p>
      </div>
      <Suspense fallback={<div>로딩 중...</div>}>
        <VendorsPageClient
          vendors={vendors}
          vendorTotals={vendorTotals}
        />
      </Suspense>
    </div>
  );
}

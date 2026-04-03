import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getLoanBalances, type LoanBalance } from "@/lib/queries/loan";
import { LoanList } from "./loan-list";

export default async function LoansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let businessId: string;
  try {
    businessId = await getCurrentBusinessId();
  } catch {
    redirect("/auth/onboarding");
  }

  let loans: LoanBalance[];
  try {
    loans = await getLoanBalances(businessId);
  } catch {
    loans = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">대출 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">
          대출 현황과 상환 내역을 관리하세요
        </p>
      </div>
      <LoanList loans={loans} businessId={businessId} />
    </div>
  );
}

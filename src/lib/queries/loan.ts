import { createClient } from "@/lib/supabase/server";

export interface LoanBalance {
  id: string;
  loanName: string;
  institution: string | null;
  principal: number;
  remainingPrincipal: number;
  interestRate: number | null;
  monthlyPayment: number | null;
  totalInterestPaid: number;
  isActive: boolean;
}

export async function getLoanBalances(businessId: string): Promise<LoanBalance[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  const { data, error } = await supabase
    .from("v_loan_balance")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true);

  if (error) throw error;

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    loanName: r.loan_name as string,
    institution: r.institution as string | null,
    principal: Number(r.principal),
    remainingPrincipal: Number(r.remaining_principal),
    interestRate: r.interest_rate != null ? Number(r.interest_rate) : null,
    monthlyPayment: r.monthly_payment != null ? Number(r.monthly_payment) : null,
    totalInterestPaid: Number(r.total_interest_paid),
    isActive: r.is_active as boolean,
  }));
}

export async function getLoanSummary(businessId: string) {
  const loans = await getLoanBalances(businessId);
  return {
    totalDebt: loans.reduce((s, l) => s + l.remainingPrincipal, 0),
    totalMonthlyPayment: loans.reduce((s, l) => s + (l.monthlyPayment ?? 0), 0),
    loanCount: loans.length,
    loans,
  };
}

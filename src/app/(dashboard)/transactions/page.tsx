// Unified transaction list page for SPEC-FINANCE-002 M2
// Auth check + fetch transactions + pass to client

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getUnifiedTransactions } from "@/lib/queries/transaction-unified";
import { TransactionsPageClient } from "./page-client";

interface PageProps {
  searchParams: Promise<{
    ym?: string;
    type?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const now = new Date();
  const yearMonth =
    params.ym ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const businessId = await getCurrentBusinessId();
  const { transactions, totals } = await getUnifiedTransactions(
    businessId,
    yearMonth,
    { type: params.type }
  );

  return (
    <TransactionsPageClient
      transactions={transactions}
      totals={totals}
      yearMonth={yearMonth}
      initialFilter={params.type ?? "all"}
    />
  );
}

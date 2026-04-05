import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getBudgetPageData, type BudgetPageData } from "@/lib/queries/budget";
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
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let pageData: BudgetPageData;
  try {
    pageData = await getBudgetPageData(businessId, year, month);
  } catch {
    pageData = {
      comparison: [],
      categoryAverages: [],
      prevMonthTotalRevenue: 0,
      prevMonthTotalExpense: 0,
      currentMonthTotalRevenue: 0,
      currentMonthTotalExpense: 0,
    };
  }

  return (
    <BudgetManager
      businessId={businessId}
      pageData={pageData}
      year={year}
      month={month}
    />
  );
}

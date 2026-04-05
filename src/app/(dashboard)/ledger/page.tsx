import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getRevenues } from "@/lib/queries/revenue";
import { getExpenses } from "@/lib/queries/expense";
import { getFixedCosts } from "@/lib/queries/fixed-cost";
import { getLastDayOfMonth, filterActiveFixedCosts } from "@/lib/utils";
import { LedgerPageClient } from "./page-client";

interface LedgerPageProps {
  searchParams: Promise<{ month?: string }>;
}

/**
 * Map a fixed cost's payment_day to an actual YYYY-MM-DD string for a given month.
 * payment_day=0 means last day of month.
 */
function resolvePaymentDate(
  paymentDay: number,
  yearMonth: string
): string {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(year, month, 0).getDate();

  const day = paymentDay === 0 ? lastDay : Math.min(paymentDay, lastDay);
  return `${yearMonth}-${String(day).padStart(2, "0")}`;
}

export default async function LedgerPage({ searchParams }: LedgerPageProps) {
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
  } catch (error) {
    console.error("[Ledger] Failed to get business ID:", error);
    redirect("/auth/onboarding");
  }

  const params = await searchParams;
  const now = new Date();
  const currentMonth =
    params.month ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch all data in parallel
  const [revenues, expenses, allFixedCosts] = await Promise.all([
    getRevenues(businessId, currentMonth),
    getExpenses(businessId, currentMonth),
    getFixedCosts(businessId),
  ]);

  // Filter active fixed costs for this month
  const monthStart = `${currentMonth}-01`;
  const monthEnd = getLastDayOfMonth(currentMonth);
  const activeFixedCosts = filterActiveFixedCosts(allFixedCosts, monthStart, monthEnd);

  // Map fixed costs to their payment dates
  const fixedCostDays = activeFixedCosts.map((fc) => ({
    date: resolvePaymentDate((fc as Record<string, unknown>).payment_day as number ?? 0, currentMonth),
    category: fc.category,
    amount: fc.amount,
  }));

  // Build daily revenue/expense arrays from DB records
  const dailyRevenues = revenues.map((r) => ({
    date: r.date,
    amount: r.amount,
  }));

  const dailyExpenses = expenses.map((e) => ({
    date: e.date,
    amount: e.amount,
  }));

  // Total fixed costs as daily expense entries (for calendar display)
  const fixedCostExpenses = fixedCostDays.map((fc) => ({
    date: fc.date,
    amount: fc.amount,
  }));

  // Merge real expenses + fixed cost virtual expenses for calendar
  const allDailyExpenses = [...dailyExpenses, ...fixedCostExpenses];

  return (
    <LedgerPageClient
      initialMonth={currentMonth}
      revenues={revenues}
      expenses={expenses}
      dailyRevenues={dailyRevenues}
      dailyExpenses={allDailyExpenses}
      fixedCostDays={fixedCostDays}
    />
  );
}

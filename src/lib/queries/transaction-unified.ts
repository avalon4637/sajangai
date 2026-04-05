import { createClient } from "@/lib/supabase/server";
import { getLastDayOfMonth } from "@/lib/utils";

/**
 * Unified transaction type combining revenues and expenses.
 */
export interface UnifiedTransaction {
  id: string;
  date: string;
  type: "revenue" | "expense";
  amount: number;
  category: string;
  vendor: string | null;
  content: string | null;
  channel?: string;
}

/**
 * Monthly totals for the unified transaction list.
 */
export interface MonthlyTotals {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
}

export interface TransactionFilters {
  type?: string;
  category?: string;
  search?: string;
}

/**
 * Fetch revenues and expenses for a business month, unified into a single list.
 * Sorted by date DESC. No pagination for MVP (<100 tx/month typical).
 */
export async function getUnifiedTransactions(
  businessId: string,
  yearMonth: string,
  filters?: TransactionFilters
): Promise<{ transactions: UnifiedTransaction[]; totals: MonthlyTotals }> {
  const supabase = await createClient();
  const startDate = `${yearMonth}-01`;
  const endDate = getLastDayOfMonth(yearMonth);

  // Fetch revenues and expenses in parallel
  const [revenueResult, expenseResult] = await Promise.all([
    supabase
      .from("revenues")
      .select("id, date, category, amount, memo, channel")
      .eq("business_id", businessId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false }),
    supabase
      .from("expenses")
      .select("id, date, category, amount, memo, type")
      .eq("business_id", businessId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false }),
  ]);

  if (revenueResult.error) {
    throw new Error(`매출 조회 실패: ${revenueResult.error.message}`);
  }
  if (expenseResult.error) {
    throw new Error(`매입 조회 실패: ${expenseResult.error.message}`);
  }

  // Map revenues to unified format
  const revenues: UnifiedTransaction[] = (revenueResult.data ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    type: "revenue" as const,
    amount: r.amount,
    category: r.category ?? "매출",
    vendor: null,
    content: r.memo,
    channel: r.channel ?? undefined,
  }));

  // Map expenses to unified format
  const expenses: UnifiedTransaction[] = (expenseResult.data ?? []).map((e) => ({
    id: e.id,
    date: e.date,
    type: "expense" as const,
    amount: e.amount,
    category: e.category ?? "기타",
    vendor: null,
    content: e.memo,
  }));

  let merged = [...revenues, ...expenses];

  // Apply filters
  if (filters?.type && filters.type !== "all") {
    if (filters.type === "revenue") {
      merged = merged.filter((t) => t.type === "revenue");
    } else if (filters.type === "expense") {
      merged = merged.filter((t) => t.type === "expense");
    } else {
      // Filter by category name
      merged = merged.filter((t) => t.category === filters.type);
    }
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    merged = merged.filter(
      (t) =>
        (t.content?.toLowerCase().includes(q)) ||
        (t.vendor?.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
    );
  }

  // Sort by date DESC, then by type (expense first for same date)
  merged.sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    return a.type === "expense" ? -1 : 1;
  });

  // Calculate totals from unfiltered data
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    transactions: merged,
    totals: {
      totalRevenue,
      totalExpense,
      netProfit: totalRevenue - totalExpense,
    },
  };
}

import { createClient } from "@/lib/supabase/server";
import type { Expense } from "@/types/data-entry";

/**
 * Fetch expenses for a business, optionally filtered by year-month (YYYY-MM).
 */
export async function getExpenses(
  businessId: string,
  yearMonth?: string
): Promise<Expense[]> {
  const supabase = await createClient();

  let query = supabase
    .from("expenses")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });

  if (yearMonth) {
    query = query
      .gte("date", `${yearMonth}-01`)
      .lte("date", `${yearMonth}-31`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`비용 데이터 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

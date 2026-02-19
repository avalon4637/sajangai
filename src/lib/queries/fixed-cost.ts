import { createClient } from "@/lib/supabase/server";
import type { FixedCost } from "@/types/data-entry";

/**
 * Fetch all fixed costs for a business.
 * Fixed costs are not month-specific; they represent recurring costs.
 */
export async function getFixedCosts(
  businessId: string
): Promise<FixedCost[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fixed_costs")
    .select("*")
    .eq("business_id", businessId)
    .order("is_labor", { ascending: true })
    .order("category", { ascending: true });

  if (error) {
    throw new Error(`고정비 데이터 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

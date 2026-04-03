import { createClient } from "@/lib/supabase/server";

export interface BudgetVsActual {
  category: string;
  targetAmount: number;
  actualAmount: number;
  variance: number;
  achievementRate: number;
}

export async function getBudgetComparison(
  businessId: string,
  year: number,
  month: number
): Promise<BudgetVsActual[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  const { data, error } = await supabase
    .from("v_budget_vs_actual")
    .select("*")
    .eq("business_id", businessId)
    .eq("year", year)
    .eq("month", month);

  if (error) throw error;

  return (data ?? []).map((r: Record<string, unknown>) => ({
    category: r.category as string,
    targetAmount: Number(r.target_amount),
    actualAmount: Number(r.actual_amount),
    variance: Number(r.variance),
    achievementRate: Number(r.achievement_rate),
  }));
}

export async function upsertBudget(
  businessId: string,
  year: number,
  month: number,
  category: string,
  targetAmount: number
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  const { error } = await supabase.from("budgets").upsert(
    {
      business_id: businessId,
      year,
      month,
      category,
      target_amount: targetAmount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id,year,month,category" }
  );

  if (error) throw error;
}

// Data Farm: Compare business costs against industry benchmarks
// Uses expense_benchmarks table populated by monthly batch jobs
// Note: New columns (industry_code, region_code) and new tables (expense_benchmarks)
// are not yet in the generated Supabase types - cast to any where needed.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

import { createClient } from "@/lib/supabase/server";

export interface CostDiagnosis {
  category: string;
  subCategory: string | null;
  myAmount: number;
  benchmarkAvg: number;
  benchmarkMedian: number;
  deviationPct: number;
  sampleCount: number;
  severity: "ok" | "warning" | "critical";
  suggestion: string;
}

/**
 * Diagnoses the business's costs by comparing against industry benchmarks.
 * Returns top 5 categories sorted by absolute deviation from average.
 *
 * Returns empty array if:
 * - Business has no industry_code set
 * - No benchmark data available for the current month
 */
export async function diagnoseCosts(businessId: string): Promise<CostDiagnosis[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // 1. Get business industry and region
  const { data: business } = await supabase
    .from("businesses")
    .select("industry_code, region_code")
    .eq("id", businessId)
    .single();

  const biz = business as AnyRecord | null;
  if (!biz?.industry_code) return [];

  // 2. Get this month's expenses by category
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

  const [expensesResult, fixedCostsResult] = await Promise.all([
    supabase
      .from("expenses")
      .select("category, amount")
      .eq("business_id", businessId)
      .gte("date", monthStart)
      .lte("date", monthEnd),
    supabase
      .from("fixed_costs")
      .select("category, amount")
      .eq("business_id", businessId),
  ]);

  // 3. Group by category
  const myExpenses: Record<string, number> = {};
  for (const e of ((expensesResult.data ?? []) as AnyRecord[])) {
    myExpenses[e.category] = (myExpenses[e.category] ?? 0) + Number(e.amount);
  }
  for (const f of ((fixedCostsResult.data ?? []) as AnyRecord[])) {
    myExpenses[f.category] = (myExpenses[f.category] ?? 0) + Number(f.amount);
  }

  // 4. Get benchmarks for industry + current month
  const calculatedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { data: benchmarksRaw } = await supabase
    .from("expense_benchmarks")
    .select("*")
    .eq("industry_code", biz.industry_code)
    .eq("calculated_month", calculatedMonth);

  const benchmarks = (benchmarksRaw ?? []) as AnyRecord[];
  if (benchmarks.length === 0) return [];

  // 5. Compare and generate diagnoses
  const diagnoses: CostDiagnosis[] = [];
  const benchmarkMap = new Map(benchmarks.map((b) => [b.category as string, b]));

  for (const [category, amount] of Object.entries(myExpenses)) {
    const bm = benchmarkMap.get(category);
    // Skip if benchmark has insufficient samples for statistical significance
    if (!bm || bm.sample_count < 5) continue;

    const avgAmount = Number(bm.avg_amount);
    const deviation = ((amount - avgAmount) / avgAmount) * 100;
    const severity: CostDiagnosis["severity"] =
      Math.abs(deviation) > 30 ? "critical" : Math.abs(deviation) > 15 ? "warning" : "ok";

    let suggestion = "";
    if (deviation > 30) {
      suggestion = `업종 평균 대비 ${Math.round(deviation)}% 높습니다. 절감 방안을 검토해보세요.`;
    } else if (deviation > 15) {
      suggestion = `업종 평균보다 다소 높은 편입니다.`;
    } else if (deviation < -15) {
      suggestion = `업종 평균보다 낮아 효율적으로 관리하고 계십니다.`;
    } else {
      suggestion = `업종 평균 범위 내입니다.`;
    }

    diagnoses.push({
      category,
      subCategory: (bm.sub_category as string | null) ?? null,
      myAmount: amount,
      benchmarkAvg: avgAmount,
      benchmarkMedian: Number(bm.median_amount),
      deviationPct: Math.round(deviation),
      sampleCount: Number(bm.sample_count),
      severity,
      suggestion,
    });
  }

  // Sort by absolute deviation (highest first) and return top 5
  diagnoses.sort((a, b) => Math.abs(b.deviationPct) - Math.abs(a.deviationPct));
  return diagnoses.slice(0, 5);
}

// Industry benchmark loader for 점장 briefing
// Loads business category from businesses table, matches to hardcoded defaults
// Note: expense_benchmarks table may exist but benchmarks here are
// aggregate industry-level data for briefing context (approximate / reference only)

import { createClient } from "@/lib/supabase/server";

export interface IndustryBenchmark {
  category: string; // Business category display name
  avgMonthlyRevenue: number;
  avgCostRatio: number; // Cost of goods ratio
  avgLaborRatio: number; // Labor cost ratio
  avgRentRatio: number; // Rent cost ratio
  avgProfitMargin: number; // Net profit margin
}

/**
 * Hardcoded industry benchmark defaults for common F&B and service categories.
 * These are approximate averages from Korean SMB statistics (참고용).
 * Keys match common industry_code values stored in businesses table.
 */
const DEFAULT_BENCHMARKS: Record<string, IndustryBenchmark> = {
  "스크린골프장": {
    category: "스크린골프장",
    avgMonthlyRevenue: 15_000_000,
    avgCostRatio: 0.15,
    avgLaborRatio: 0.25,
    avgRentRatio: 0.20,
    avgProfitMargin: 0.20,
  },
  "카페": {
    category: "카페",
    avgMonthlyRevenue: 8_000_000,
    avgCostRatio: 0.30,
    avgLaborRatio: 0.25,
    avgRentRatio: 0.15,
    avgProfitMargin: 0.15,
  },
  "치킨집": {
    category: "치킨집",
    avgMonthlyRevenue: 12_000_000,
    avgCostRatio: 0.35,
    avgLaborRatio: 0.20,
    avgRentRatio: 0.12,
    avgProfitMargin: 0.18,
  },
  "일반음식점": {
    category: "일반음식점",
    avgMonthlyRevenue: 10_000_000,
    avgCostRatio: 0.35,
    avgLaborRatio: 0.25,
    avgRentRatio: 0.15,
    avgProfitMargin: 0.12,
  },
  "분식집": {
    category: "분식집",
    avgMonthlyRevenue: 7_000_000,
    avgCostRatio: 0.30,
    avgLaborRatio: 0.20,
    avgRentRatio: 0.15,
    avgProfitMargin: 0.15,
  },
  "피자집": {
    category: "피자집",
    avgMonthlyRevenue: 11_000_000,
    avgCostRatio: 0.30,
    avgLaborRatio: 0.20,
    avgRentRatio: 0.12,
    avgProfitMargin: 0.18,
  },
  "편의점": {
    category: "편의점",
    avgMonthlyRevenue: 20_000_000,
    avgCostRatio: 0.70,
    avgLaborRatio: 0.10,
    avgRentRatio: 0.08,
    avgProfitMargin: 0.05,
  },
  "미용실": {
    category: "미용실",
    avgMonthlyRevenue: 6_000_000,
    avgCostRatio: 0.15,
    avgLaborRatio: 0.35,
    avgRentRatio: 0.15,
    avgProfitMargin: 0.15,
  },
  default: {
    category: "일반",
    avgMonthlyRevenue: 10_000_000,
    avgCostRatio: 0.30,
    avgLaborRatio: 0.25,
    avgRentRatio: 0.15,
    avgProfitMargin: 0.15,
  },
};

/**
 * Load the industry benchmark for a given business.
 * Reads industry_code from the businesses table and matches to defaults.
 * Falls back to "default" benchmark if category is unknown.
 */
export async function getBusinessBenchmark(
  businessId: string
): Promise<IndustryBenchmark> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data } = await sb
    .from("businesses")
    .select("industry_code")
    .eq("id", businessId)
    .single();

  const industryCode = (data as { industry_code?: string } | null)
    ?.industry_code;

  if (industryCode && DEFAULT_BENCHMARKS[industryCode]) {
    return DEFAULT_BENCHMARKS[industryCode];
  }

  return DEFAULT_BENCHMARKS["default"];
}

/**
 * Calculate actual cost ratios for a business based on current month data.
 * Used to compare against industry benchmarks.
 */
export interface ActualRatios {
  costRatio: number | null; // Cannot calculate without COGS data; uses total expense
  laborRatio: number | null;
  rentRatio: number | null;
  profitMargin: number | null;
}

export async function getActualRatios(
  businessId: string,
  monthRevenue: number,
  monthExpense: number
): Promise<ActualRatios> {
  if (monthRevenue === 0) {
    return {
      costRatio: null,
      laborRatio: null,
      rentRatio: null,
      profitMargin: null,
    };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

  // Get expense breakdown by category for this month
  const [expensesByCat, fixedCosts] = await Promise.all([
    sb
      .from("expenses")
      .select("category, amount")
      .eq("business_id", businessId)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .then((r: { data: { category: string; amount: number }[] | null }) => r.data ?? []),
    sb
      .from("fixed_costs")
      .select("category, amount")
      .eq("business_id", businessId)
      .then((r: { data: { category: string; amount: number }[] | null }) => r.data ?? []),
  ]);

  // Aggregate by category
  const catTotals: Record<string, number> = {};
  for (const e of expensesByCat) {
    const cat = (e.category ?? "").toLowerCase();
    catTotals[cat] = (catTotals[cat] ?? 0) + Number(e.amount);
  }
  for (const f of fixedCosts) {
    const cat = (f.category ?? "").toLowerCase();
    catTotals[cat] = (catTotals[cat] ?? 0) + Number(f.amount);
  }

  // Match categories to labor/rent (Korean category names)
  const laborKeywords = ["인건비", "급여", "직원", "알바", "노무"];
  const rentKeywords = ["임대료", "월세", "임차", "관리비"];

  let laborTotal = 0;
  let rentTotal = 0;
  for (const [cat, amount] of Object.entries(catTotals)) {
    if (laborKeywords.some((kw) => cat.includes(kw))) laborTotal += amount;
    if (rentKeywords.some((kw) => cat.includes(kw))) rentTotal += amount;
  }

  return {
    costRatio: monthRevenue > 0 ? monthExpense / monthRevenue : null,
    laborRatio: monthRevenue > 0 ? laborTotal / monthRevenue : null,
    rentRatio: monthRevenue > 0 ? rentTotal / monthRevenue : null,
    profitMargin:
      monthRevenue > 0
        ? (monthRevenue - monthExpense) / monthRevenue
        : null,
  };
}

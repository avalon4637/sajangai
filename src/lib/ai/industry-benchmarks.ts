// Industry benchmark data for Korean small businesses
// Based on Korean National Tax Service standard expense rates
// and Small Enterprise & Market Service statistics

export interface IndustryBenchmark {
  name: string;
  avgMonthlyRevenue: number; // KRW
  foodCostRatio: { min: number; max: number; avg: number };
  laborRatio: { min: number; max: number; avg: number };
  rentRatio: { min: number; max: number; avg: number };
  deliveryRatio: { min: number; max: number; avg: number };
  avgRating: number;
  profitMargin: { min: number; max: number; avg: number };
}

export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  한식당: {
    name: "한식당",
    avgMonthlyRevenue: 25_000_000,
    foodCostRatio: { min: 30, max: 35, avg: 32 },
    laborRatio: { min: 25, max: 30, avg: 28 },
    rentRatio: { min: 8, max: 15, avg: 10 },
    deliveryRatio: { min: 30, max: 50, avg: 40 },
    avgRating: 4.2,
    profitMargin: { min: 12, max: 20, avg: 15 },
  },
  카페: {
    name: "카페",
    avgMonthlyRevenue: 18_000_000,
    foodCostRatio: { min: 20, max: 25, avg: 22 },
    laborRatio: { min: 28, max: 35, avg: 30 },
    rentRatio: { min: 10, max: 18, avg: 13 },
    deliveryRatio: { min: 5, max: 15, avg: 10 },
    avgRating: 4.3,
    profitMargin: { min: 15, max: 25, avg: 18 },
  },
  치킨점: {
    name: "치킨점",
    avgMonthlyRevenue: 22_000_000,
    foodCostRatio: { min: 35, max: 42, avg: 38 },
    laborRatio: { min: 20, max: 28, avg: 24 },
    rentRatio: { min: 8, max: 12, avg: 10 },
    deliveryRatio: { min: 60, max: 80, avg: 70 },
    avgRating: 4.1,
    profitMargin: { min: 10, max: 18, avg: 13 },
  },
  분식점: {
    name: "분식점",
    avgMonthlyRevenue: 15_000_000,
    foodCostRatio: { min: 25, max: 32, avg: 28 },
    laborRatio: { min: 22, max: 28, avg: 25 },
    rentRatio: { min: 8, max: 14, avg: 10 },
    deliveryRatio: { min: 20, max: 40, avg: 30 },
    avgRating: 4.0,
    profitMargin: { min: 12, max: 20, avg: 15 },
  },
  소매점: {
    name: "소매점",
    avgMonthlyRevenue: 20_000_000,
    // foodCostRatio is "매입원가" for retail
    foodCostRatio: { min: 60, max: 70, avg: 65 },
    laborRatio: { min: 12, max: 20, avg: 15 },
    rentRatio: { min: 8, max: 15, avg: 10 },
    deliveryRatio: { min: 0, max: 5, avg: 2 },
    avgRating: 4.0,
    profitMargin: { min: 8, max: 15, avg: 10 },
  },
  중식당: {
    name: "중식당",
    avgMonthlyRevenue: 23_000_000,
    foodCostRatio: { min: 28, max: 35, avg: 30 },
    laborRatio: { min: 25, max: 32, avg: 28 },
    rentRatio: { min: 8, max: 14, avg: 10 },
    deliveryRatio: { min: 40, max: 60, avg: 50 },
    avgRating: 4.1,
    profitMargin: { min: 12, max: 18, avg: 14 },
  },
  일식당: {
    name: "일식당",
    avgMonthlyRevenue: 28_000_000,
    foodCostRatio: { min: 32, max: 40, avg: 35 },
    laborRatio: { min: 25, max: 32, avg: 28 },
    rentRatio: { min: 10, max: 16, avg: 12 },
    deliveryRatio: { min: 15, max: 35, avg: 25 },
    avgRating: 4.3,
    profitMargin: { min: 12, max: 20, avg: 15 },
  },
  피자점: {
    name: "피자점",
    avgMonthlyRevenue: 20_000_000,
    foodCostRatio: { min: 30, max: 38, avg: 33 },
    laborRatio: { min: 22, max: 28, avg: 25 },
    rentRatio: { min: 8, max: 12, avg: 10 },
    deliveryRatio: { min: 50, max: 75, avg: 65 },
    avgRating: 4.1,
    profitMargin: { min: 12, max: 20, avg: 15 },
  },
};

/**
 * Find benchmark data for a given business type using fuzzy matching.
 * Returns null when no match is found.
 */
export function findBenchmark(
  businessType: string | null
): IndustryBenchmark | null {
  if (!businessType) return null;
  const normalized = businessType.trim();

  // Exact match
  if (INDUSTRY_BENCHMARKS[normalized]) return INDUSTRY_BENCHMARKS[normalized];

  // Fuzzy match
  for (const [key, value] of Object.entries(INDUSTRY_BENCHMARKS)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }

  // Default to 한식당 for generic food businesses
  if (normalized.includes("음식") || normalized.includes("식당")) {
    return INDUSTRY_BENCHMARKS["한식당"];
  }

  return null;
}

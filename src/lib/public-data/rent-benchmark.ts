// Public data stub: Commercial rent benchmarks from MOLIT (국토교통부)
// Connects to the Real Estate Transaction Management System (RTMS) API when configured.
// Returns null if MOLIT_API_KEY is not set.

export interface RentBenchmark {
  avgRent: number;
  medianRent: number;
  p25Rent: number;
  p75Rent: number;
  sampleCount: number;
  region: string;
  areaSqm: number;
}

/**
 * Fetches commercial rent benchmarks for a given address and area.
 * Requires MOLIT_API_KEY environment variable.
 *
 * @param address - Full address string (used to determine region)
 * @param areaSqm - Store area in square meters
 * @returns Rent benchmark data or null if API key not configured
 */
export async function getRentBenchmark(
  address: string,
  areaSqm: number
): Promise<RentBenchmark | null> {
  const apiKey = process.env.MOLIT_API_KEY;
  if (!apiKey) {
    console.warn("[RentBenchmark] MOLIT_API_KEY not configured - skipping");
    return null;
  }

  // TODO: Implement actual MOLIT API call
  // GET http://openapi.molit.go.kr:8081/.../getRTMSDataSvcSHRent
  // Parameters: serviceKey, LAWD_CD (region code), DEAL_YMD (year-month)
  // Reference: https://www.data.go.kr/data/15058017/openapi.do
  console.log(`[RentBenchmark] address=${address} area=${areaSqm}sqm - API not yet implemented`);
  return null;
}

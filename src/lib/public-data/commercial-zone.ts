// Public data stub: Commercial zone analysis
// Aggregates competitor density, average sales, and rent levels in a given radius.
// Connects to SBIZ (소상공인진흥공단) API or similar source when configured.
// Returns null if required API keys are not set.

export interface CommercialZone {
  competitorCount: number;
  avgSales: number; // monthly average sales in KRW
  avgRent: number; // monthly average rent in KRW
  dominantIndustry: string;
  sampleCount: number;
  radiusMeters: number;
}

/**
 * Fetches commercial zone information around a specific location.
 * Requires SBIZ_API_KEY environment variable.
 *
 * @param lat - Latitude of the store location
 * @param lng - Longitude of the store location
 * @param radius - Search radius in meters (default 500m)
 * @returns Commercial zone data or null if API key not configured
 */
export async function getCommercialZone(
  lat: number,
  lng: number,
  radius: number = 500
): Promise<CommercialZone | null> {
  const apiKey = process.env.SBIZ_API_KEY;
  if (!apiKey) {
    console.warn("[CommercialZone] SBIZ_API_KEY not configured - skipping");
    return null;
  }

  // TODO: Implement actual SBIZ API call
  // Reference: https://www.sbiz.or.kr/com/openapi/openApi.do
  // Endpoint for commercial district analysis data
  console.log(`[CommercialZone] lat=${lat} lng=${lng} radius=${radius}m - API not yet implemented`);
  return null;
}

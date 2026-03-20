// Review sync module
// Standalone review sync using delivery platform credentials
// Deduplicates using external_id + platform unique constraint

import { syncDeliveryReviews, type ReviewSyncResult } from "./sync-delivery";
import type { DeliveryPlatform } from "./types";

/** Platforms supported for review sync */
export const REVIEW_PLATFORMS: DeliveryPlatform[] = [
  "baemin",
  "coupangeats",
  "yogiyo",
];

/**
 * Sync reviews for a specific platform.
 * Thin wrapper around syncDeliveryReviews for standalone review-only syncs.
 *
 * @param businessId - Business to sync for
 * @param platform - Delivery platform
 * @param credentials - Platform credentials
 * @param lastSyncAt - ISO timestamp of last successful sync
 */
export async function syncReviews(
  businessId: string,
  platform: DeliveryPlatform,
  credentials: Record<string, string> | undefined,
  lastSyncAt: string | null
): Promise<ReviewSyncResult> {
  return syncDeliveryReviews(businessId, platform, credentials, lastSyncAt);
}

/**
 * Sync reviews for all active delivery platforms.
 * Returns results per platform for independent error handling.
 *
 * @param businessId - Business to sync for
 * @param credentialsByPlatform - Credentials map indexed by platform
 * @param lastSyncAt - ISO timestamp of last successful sync
 */
export async function syncAllReviews(
  businessId: string,
  credentialsByPlatform: Partial<Record<DeliveryPlatform, Record<string, string>>>,
  lastSyncAt: string | null
): Promise<ReviewSyncResult[]> {
  const results: ReviewSyncResult[] = [];

  // Run sequentially to avoid rate limiting
  for (const platform of REVIEW_PLATFORMS) {
    const credentials = credentialsByPlatform[platform];
    const result = await syncReviews(
      businessId,
      platform,
      credentials,
      lastSyncAt
    );
    results.push(result);
  }

  return results;
}

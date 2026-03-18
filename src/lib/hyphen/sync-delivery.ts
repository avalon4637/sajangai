// Delivery app sales sync module
// Fetches and stores delivery sales and reviews from Hyphen API

import { createClient } from "@/lib/supabase/server";
import { createHyphenClient } from "./client";
import {
  normalizeDeliverySale,
  normalizeReview,
  type DeliveryPlatform,
  type HyphenDeliverySale,
  type HyphenReview,
} from "./normalizer";

/** Platform code mappings for Hyphen API */
const PLATFORM_CODES: Record<DeliveryPlatform, string> = {
  baemin: "BAEMIN",
  coupangeats: "COUPANGEATS",
  yogiyo: "YOGIYO",
};

/** Mock delivery sales data for development without real API credentials */
function getMockDeliverySales(
  platform: DeliveryPlatform,
  count: number = 5
): HyphenDeliverySale[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return {
      orderId: `MOCK-${platform.toUpperCase()}-${Date.now()}-${i}`,
      orderDate: date.toISOString().slice(0, 10),
      orderDatetime: date.toISOString(),
      orderAmount: 15000 + Math.floor(Math.random() * 30000),
      commissionRate: platform === "baemin" ? 0.063 : 0.09,
      netAmount: 14000 + Math.floor(Math.random() * 25000),
      menuName: "대표메뉴",
      status: "completed",
    };
  });
}

/** Mock review data for development */
function getMockReviews(
  platform: DeliveryPlatform,
  count: number = 3
): HyphenReview[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return {
      reviewId: `MOCK-REVIEW-${platform}-${Date.now()}-${i}`,
      reviewDatetime: date.toISOString(),
      rating: 4 + (i % 2),
      content: i % 3 === 0 ? "맛있어요! 또 시켜먹을게요." : "배달이 빠르고 음식이 신선해요.",
      customerName: `고객${i + 1}`,
      orderSummary: "대표메뉴 1개",
    };
  });
}

/** Result of a delivery sales sync operation */
export interface DeliverySyncResult {
  platform: DeliveryPlatform;
  salesCount: number;
  skippedCount: number;
  error?: string;
}

/** Result of a review sync operation */
export interface ReviewSyncResult {
  platform: DeliveryPlatform;
  reviewCount: number;
  skippedCount: number;
  error?: string;
}

/**
 * Sync delivery sales for a given platform.
 * Performs incremental sync from lastSyncAt, or last 30 days if null.
 *
 * @param businessId - Business to sync for
 * @param platform - Delivery platform to fetch from
 * @param credentials - Platform credentials (may be undefined for mock mode)
 * @param lastSyncAt - ISO timestamp of last successful sync
 */
export async function syncDeliverySales(
  businessId: string,
  platform: DeliveryPlatform,
  credentials: Record<string, string> | undefined,
  lastSyncAt: string | null
): Promise<DeliverySyncResult> {
  const startDate = lastSyncAt
    ? lastSyncAt.slice(0, 10)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
      })();
  const endDate = new Date().toISOString().slice(0, 10);

  let rawSales: HyphenDeliverySale[];

  // Use mock data if no real credentials available
  const useMock =
    !credentials?.apiKey && !process.env.HYPHEN_API_KEY;

  if (useMock) {
    rawSales = getMockDeliverySales(platform);
  } else {
    try {
      const client = createHyphenClient(
        credentials?.apiKey ? { apiKey: credentials.apiKey } : undefined
      );
      const response = await client.get<{ orders: HyphenDeliverySale[] }>(
        `/v1/delivery/orders`,
        {
          platform: PLATFORM_CODES[platform],
          startDate,
          endDate,
          status: "completed",
        }
      );
      rawSales = response.orders ?? [];
    } catch (error) {
      return {
        platform,
        salesCount: 0,
        skippedCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Normalize and upsert sales
  const supabase = await createClient();
  let insertedCount = 0;
  let skippedCount = 0;

  for (const sale of rawSales) {
    // Skip cancelled orders
    if (sale.status === "cancelled" || sale.cancelledAt) {
      skippedCount++;
      continue;
    }

    const normalized = normalizeDeliverySale(sale, businessId, platform);

    const { error } = await supabase.from("revenues").insert(normalized);

    if (error) {
      // Ignore duplicate key errors (already synced)
      if (error.code === "23505") {
        skippedCount++;
      } else {
        console.error(`[SyncDelivery] Insert error for ${platform}:`, error.message);
        skippedCount++;
      }
    } else {
      insertedCount++;
    }
  }

  return {
    platform,
    salesCount: insertedCount,
    skippedCount,
  };
}

/**
 * Sync delivery reviews for a given platform.
 * Uses upsert to handle duplicates via (business_id, platform, external_id) unique constraint.
 *
 * @param businessId - Business to sync for
 * @param platform - Delivery platform to fetch from
 * @param credentials - Platform credentials (may be undefined for mock mode)
 * @param lastSyncAt - ISO timestamp of last successful sync
 */
export async function syncDeliveryReviews(
  businessId: string,
  platform: DeliveryPlatform,
  credentials: Record<string, string> | undefined,
  lastSyncAt: string | null
): Promise<ReviewSyncResult> {
  const startDate = lastSyncAt
    ? lastSyncAt.slice(0, 10)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
      })();
  const endDate = new Date().toISOString().slice(0, 10);

  let rawReviews: HyphenReview[];

  const useMock =
    !credentials?.apiKey && !process.env.HYPHEN_API_KEY;

  if (useMock) {
    rawReviews = getMockReviews(platform);
  } else {
    try {
      const client = createHyphenClient(
        credentials?.apiKey ? { apiKey: credentials.apiKey } : undefined
      );
      const response = await client.get<{ reviews: HyphenReview[] }>(
        `/v1/delivery/reviews`,
        {
          platform: PLATFORM_CODES[platform],
          startDate,
          endDate,
        }
      );
      rawReviews = response.reviews ?? [];
    } catch (error) {
      return {
        platform,
        reviewCount: 0,
        skippedCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Upsert reviews using external_id dedup
  const supabase = await createClient();
  let upsertedCount = 0;
  let skippedCount = 0;

  for (const review of rawReviews) {
    const normalized = normalizeReview(review, businessId, platform);

    const { error } = await supabase
      .from("delivery_reviews")
      .upsert(normalized, {
        onConflict: "business_id,platform,external_id",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`[SyncReviews] Upsert error for ${platform}:`, error.message);
      skippedCount++;
    } else {
      upsertedCount++;
    }
  }

  return {
    platform,
    reviewCount: upsertedCount,
    skippedCount,
  };
}

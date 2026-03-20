// Delivery app sync module
// Uses actual Hyphen API endpoints per platform:
// - Coupang: POST /in0024000086 (orders), /in0024000800 (reviews)
// - Yogiyo: POST /in0023000077 (orders), /in0023000085 (reviews)
// - Baemin: POST /in0022000066 (orders), /in0022000083 (reviews)

import { createClient } from "@/lib/supabase/server";
import { createHyphenClient, isHyphenConfigured } from "./client";
import {
  normalizeDeliveryOrder,
  normalizeDeliveryReview,
} from "./normalizer";
import {
  DELIVERY_ENDPOINTS,
  type DeliveryPlatform,
  type DeliveryRequestBody,
  type HyphenDeliveryOrderData,
  type HyphenDeliveryReviewData,
} from "./types";

export type { DeliveryPlatform };

export interface DeliverySyncResult {
  platform: DeliveryPlatform;
  salesCount: number;
  skippedCount: number;
  error?: string;
}

export interface ReviewSyncResult {
  platform: DeliveryPlatform;
  reviewCount: number;
  skippedCount: number;
  error?: string;
}

function toYmd(isoDate: string): string {
  return isoDate.replace(/-/g, "").slice(0, 8);
}

/**
 * Sync delivery orders for a platform.
 * Uses platform-specific credentials (userId/userPw for that delivery app account).
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

  if (!credentials?.userId || !isHyphenConfigured()) {
    return { platform, salesCount: 0, skippedCount: 0 };
  }

  const client = createHyphenClient();
  const endpoints = DELIVERY_ENDPOINTS[platform];

  try {
    const body: DeliveryRequestBody = {
      userId: credentials.userId,
      userPw: credentials.userPw,
      dateFrom: toYmd(startDate),
      dateTo: toYmd(endDate),
    };

    const response = await client.post<HyphenDeliveryOrderData>(
      endpoints.order,
      body as unknown as Record<string, unknown>
    );

    const orders = response.data?.touchOrderList ?? [];

    const supabase = await createClient();
    let insertedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      const normalized = normalizeDeliveryOrder(order, businessId, platform);

      const { error } = await supabase.from("revenues").insert(normalized);

      if (error) {
        if (error.code === "23505") {
          skippedCount++;
        } else {
          console.error(
            `[SyncDelivery] Insert error for ${platform}:`,
            error.message
          );
          skippedCount++;
        }
      } else {
        insertedCount++;
      }
    }

    return { platform, salesCount: insertedCount, skippedCount };
  } catch (error) {
    return {
      platform,
      salesCount: 0,
      skippedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync delivery reviews for a platform.
 * Uses upsert with (business_id, platform, external_id) dedup.
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

  if (!credentials?.userId || !isHyphenConfigured()) {
    return { platform, reviewCount: 0, skippedCount: 0 };
  }

  const client = createHyphenClient();
  const endpoints = DELIVERY_ENDPOINTS[platform];

  try {
    const body: DeliveryRequestBody = {
      userId: credentials.userId,
      userPw: credentials.userPw,
      dateFrom: toYmd(startDate),
      dateTo: toYmd(endDate),
    };

    const response = await client.post<HyphenDeliveryReviewData>(
      endpoints.review,
      body as unknown as Record<string, unknown>
    );

    const stores = response.data?.storeList ?? [];
    const allReviews = stores.flatMap((store) => store.reviewList ?? []);

    const supabase = await createClient();
    let upsertedCount = 0;
    let skippedCount = 0;

    for (const review of allReviews) {
      const normalized = normalizeDeliveryReview(review, businessId, platform);

      const { error } = await supabase
        .from("delivery_reviews")
        .upsert(normalized, {
          onConflict: "business_id,platform,external_id",
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(
          `[SyncReviews] Upsert error for ${platform}:`,
          error.message
        );
        skippedCount++;
      } else {
        upsertedCount++;
      }
    }

    return { platform, reviewCount: upsertedCount, skippedCount };
  } catch (error) {
    return {
      platform,
      reviewCount: 0,
      skippedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

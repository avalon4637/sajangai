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

    if (allReviews.length === 0) {
      return { platform, reviewCount: 0, skippedCount: 0 };
    }

    // Phase 3.6 — Batched upsert (was N+1).
    // Chunk at 500 rows to stay well under Supabase request limits, and let
    // the DB handle dedup via the onConflict key.
    const supabase = await createClient();
    const normalizedAll = allReviews.map((review) =>
      normalizeDeliveryReview(review, businessId, platform)
    );

    const CHUNK = 500;
    let upsertedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < normalizedAll.length; i += CHUNK) {
      const chunk = normalizedAll.slice(i, i + CHUNK);
      const { error, count } = await supabase
        .from("delivery_reviews")
        .upsert(chunk, {
          onConflict: "business_id,platform,external_id",
          ignoreDuplicates: false,
          count: "exact",
        });

      if (error) {
        console.error(
          `[SyncReviews] Batch upsert error for ${platform}:`,
          error.message
        );
        skippedCount += chunk.length;
      } else {
        upsertedCount += count ?? chunk.length;
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

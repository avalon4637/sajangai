// Naver Place review sync module
// Calls Supabase Edge Function (naver-crawl) which runs on Deno Deploy
// Direct server-side crawling is blocked by Naver's bot detection

import { createClient } from "@/lib/supabase/server";
import type { SyncResult } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Sync Naver Place reviews via Supabase Edge Function.
 * The Edge Function crawls Naver's GraphQL API from Deno Deploy infrastructure
 * (different IP range, not blocked by Naver).
 *
 * @param businessId - UUID of the business
 * @param placeId - Naver Place restaurant ID (numeric string)
 * @returns SyncResult with counts and status
 */
export async function syncNaverReviews(
  businessId: string,
  placeId: string
): Promise<SyncResult> {
  try {
    // Call Edge Function with saveToDb=true
    const res = await fetch(`${SUPABASE_URL}/functions/v1/naver-crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        placeId,
        businessId,
        saveToDb: true,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[NaverSync] Edge Function error:", errorText);
      return {
        success: false,
        newReviews: 0,
        totalReviews: 0,
        error: `Edge Function returned ${res.status}`,
      };
    }

    const data = await res.json();

    if (data.error) {
      return {
        success: false,
        newReviews: 0,
        totalReviews: data.totalCount ?? 0,
        error: data.error,
      };
    }

    // Update last synced timestamp
    const supabase = await createClient();
    await supabase
      .from("businesses")
      .update({ naver_last_synced_at: new Date().toISOString() })
      .eq("id", businessId);

    return {
      success: true,
      newReviews: data.newReviews ?? data.reviews?.length ?? 0,
      totalReviews: data.totalCount ?? 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[NaverSync] Sync failed:", message);

    return {
      success: false,
      newReviews: 0,
      totalReviews: 0,
      error: message,
    };
  }
}

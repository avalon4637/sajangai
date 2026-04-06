// POST /api/naver/sync - Trigger Naver Place review sync for current user's business
// Auth required, rate limited to 3 requests per hour per business

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/api/rate-limit";
import { syncNaverReviews } from "@/lib/naver/sync";

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's business with naver_place_id
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, naver_place_id, naver_last_synced_at")
      .eq("user_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (!business.naver_place_id) {
      return NextResponse.json(
        { error: "Naver Place ID not configured. Set it in Settings > Connections." },
        { status: 400 }
      );
    }

    // Rate limit: 3 requests per hour (3600000ms)
    const rateLimitKey = getRateLimitKey(request, "naver-sync", user.id);
    const rateLimit = checkRateLimit(rateLimitKey, 3, 3600000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Maximum 3 syncs per hour.",
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
        { status: 429 }
      );
    }

    // Run sync
    const result = await syncNaverReviews(business.id, business.naver_place_id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? "Sync failed",
          newReviews: 0,
          totalReviews: result.totalReviews,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newReviews: result.newReviews,
      totalReviews: result.totalReviews,
    });
  } catch (error) {
    console.error("[API /naver/sync] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

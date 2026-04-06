// PUT /api/naver/place-id - Save or remove Naver Place ID for a business
// Auth required, validates that the business belongs to the current user

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
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

    const body = await request.json();
    const { businessId, placeId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    // Validate placeId format if provided (must be numeric string or null)
    if (placeId !== null && placeId !== undefined) {
      if (typeof placeId !== "string" || !/^\d+$/.test(placeId)) {
        return NextResponse.json(
          { error: "Invalid placeId format" },
          { status: 400 }
        );
      }
    }

    // Verify business belongs to current user (IDOR prevention)
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, user_id")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (business.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update naver_place_id
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        naver_place_id: placeId ?? null,
        ...(placeId ? {} : { naver_last_synced_at: null }),
      })
      .eq("id", businessId);

    if (updateError) {
      console.error("[API /naver/place-id] Update error:", updateError.message);
      return NextResponse.json(
        { error: "Failed to update" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /naver/place-id] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

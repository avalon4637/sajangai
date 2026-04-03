// Manual sync API route
// POST /api/sync - Triggers a sync for the authenticated user's business

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { runSync } from "@/lib/hyphen/sync-orchestrator";

export async function POST(): Promise<NextResponse> {
  // Authenticate the request
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Authentication required" },
      { status: 401 }
    );
  }

  // Get business ID for this user
  let businessId: string;
  try {
    businessId = await getCurrentBusinessId();
  } catch (err) {
    console.error("[sync]", err);
    return NextResponse.json(
      { error: "BusinessNotFound", message: "No business registered for this account" },
      { status: 404 }
    );
  }

  // Run the sync
  try {
    const result = await runSync(businessId);

    return NextResponse.json({
      success: !result.hasErrors,
      data: {
        businessId: result.businessId,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        totalRecords: result.totalRecords,
        operations: result.operations,
        hasErrors: result.hasErrors,
      },
    });
  } catch (error) {
    console.error("[API/sync] Sync failed:", error);
    return NextResponse.json(
      {
        error: "SyncFailed",
        message: error instanceof Error ? error.message : "Sync operation failed",
      },
      { status: 500 }
    );
  }
}

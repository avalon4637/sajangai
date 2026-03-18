import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runSync } from "@/lib/hyphen/sync-orchestrator";

/**
 * Vercel Cron: Hyphen data sync
 * Schedule: 0 *​/5 * * * (UTC) = every 5 hours
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get businesses with active connections that need sync
    const { data: connections } = await supabase
      .from("api_connections")
      .select("business_id")
      .eq("status", "active")
      .not("encrypted_credentials", "is", null);

    if (!connections || connections.length === 0) {
      return NextResponse.json({ message: "No connections to sync" });
    }

    // Deduplicate business IDs
    const businessIds = [...new Set(connections.map((c) => c.business_id))];

    const results = [];
    for (const bizId of businessIds) {
      try {
        const result = await runSync(bizId);
        results.push({ businessId: bizId, status: "success", syncResult: result });
      } catch (error) {
        results.push({
          businessId: bizId,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync cron failed" },
      { status: 500 }
    );
  }
}

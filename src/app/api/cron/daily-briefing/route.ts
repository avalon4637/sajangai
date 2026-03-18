import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMorningRoutine } from "@/lib/ai/jeongjang-engine";

/**
 * Vercel Cron: Daily briefing generation
 * Schedule: 0 23 * * * (UTC) = 08:00 KST
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get all active businesses with subscriptions
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id");

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ message: "No businesses to process" });
    }

    const results = [];
    for (const biz of businesses) {
      try {
        await runMorningRoutine(biz.id);
        results.push({ businessId: biz.id, status: "success" });
      } catch (error) {
        results.push({
          businessId: biz.id,
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
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}

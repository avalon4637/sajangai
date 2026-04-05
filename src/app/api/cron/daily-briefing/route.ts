import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMorningRoutine } from "@/lib/ai/jeongjang-engine";

/**
 * Vercel Cron: Daily briefing generation
 * Schedule: 0 23 * * * (UTC) = 08:00 KST
 */
export async function GET(request: Request) {
  // Verify cron secret (guard against undefined CRON_SECRET)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Only process businesses with active or trial subscriptions
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, subscriptions!inner(status)")
      .in("subscriptions.status", ["trial", "active"]);

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

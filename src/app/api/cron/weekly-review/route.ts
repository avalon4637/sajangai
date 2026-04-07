// Vercel Cron: Weekly review analysis for all active businesses
// Schedule: 0 15 * * 0 (UTC) = Every Sunday 00:00 KST
// Processes max 5 businesses per invocation to respect rate limits

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeWeeklyReviews } from "@/lib/ai/review-analyzer";

const MAX_BUSINESSES_PER_RUN = 5;

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
      .select("id, name, subscriptions!inner(status)")
      .in("subscriptions.status", ["trial", "active"])
      .eq("is_active", true)
      .limit(MAX_BUSINESSES_PER_RUN);

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ message: "No businesses to process" });
    }

    const results = [];
    for (const biz of businesses) {
      try {
        const result = await analyzeWeeklyReviews(biz.id);
        results.push({
          businessId: biz.id,
          name: biz.name,
          success: result.success,
          reviewCount: result.reviewCount,
        });
      } catch (error) {
        results.push({
          businessId: biz.id,
          name: biz.name,
          success: false,
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

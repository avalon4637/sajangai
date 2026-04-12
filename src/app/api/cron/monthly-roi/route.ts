// Phase 2.3 — Monthly ROI report cron
//
// Runs on the 1st of every month at 09:00 KST. For every business with an
// active (or recently trial) subscription, computes the previous month's ROI
// and upserts it into monthly_roi_reports so the dashboard card shows up.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveMonthlyRoiReport } from "@/lib/roi/calculator";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Previous month
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yearMonth = `${lastMonth.getFullYear()}-${String(
      lastMonth.getMonth() + 1
    ).padStart(2, "0")}`;

    // Eligible businesses: any non-cancelled subscription
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, subscriptions!inner(status)")
      .in("subscriptions.status", ["trial", "active", "past_due", "expired"]);

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({
        yearMonth,
        processed: 0,
        message: "No eligible businesses",
      });
    }

    const results: Array<{
      businessId: string;
      status: "ok" | "error";
      totalValue?: number;
      error?: string;
    }> = [];

    for (const biz of businesses) {
      try {
        const breakdown = await saveMonthlyRoiReport(biz.id, yearMonth);
        results.push({
          businessId: biz.id,
          status: "ok",
          totalValue: breakdown.totalValue,
        });
      } catch (err) {
        results.push({
          businessId: biz.id,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown",
        });
      }
    }

    const ok = results.filter((r) => r.status === "ok").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      yearMonth,
      processed: results.length,
      ok,
      errors,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}

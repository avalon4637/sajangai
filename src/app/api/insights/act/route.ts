import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateInsightStatus, createActionResult } from "@/lib/insights/queries";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { insightId, actionType } = await request.json();

  if (!insightId || !actionType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify ownership: insight must belong to user's business
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: insight } = await db
    .from("insight_events")
    .select("id, business_id")
    .eq("id", insightId)
    .single();

  if (!insight) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify business belongs to user
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", insight.business_id)
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await updateInsightStatus(insightId, "acted");
    await createActionResult({
      insightEventId: insightId,
      businessId: insight.business_id,
      actionType,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[insights/act] Failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

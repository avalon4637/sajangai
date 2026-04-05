import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateInsightStatus } from "@/lib/insights/queries";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { insightId } = await request.json();

  if (!insightId) {
    return NextResponse.json({ error: "Missing insightId" }, { status: 400 });
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
    await updateInsightStatus(insightId, "dismissed");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[insights/dismiss] Failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/insights/track — Track user actions on insights (SPEC-AI-002)
// Body: { insightId: string, action: 'viewed' | 'acted' | 'dismissed' }

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackInsightAction } from "@/lib/insights/history";

const VALID_ACTIONS = ["viewed", "acted", "dismissed"] as const;
type TrackAction = (typeof VALID_ACTIONS)[number];

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { insightId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { insightId, action } = body;

  if (!insightId || !action) {
    return NextResponse.json(
      { error: "Missing insightId or action" },
      { status: 400 }
    );
  }

  if (!VALID_ACTIONS.includes(action as TrackAction)) {
    return NextResponse.json(
      { error: "Invalid action. Must be: viewed, acted, or dismissed" },
      { status: 400 }
    );
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
    await trackInsightAction(
      insight.business_id,
      insightId,
      action as TrackAction
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[insights/track] Failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

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

  try {
    await updateInsightStatus(insightId, "acted");
    await createActionResult({
      insightEventId: insightId,
      businessId: "", // filled by trigger or looked up
      actionType,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

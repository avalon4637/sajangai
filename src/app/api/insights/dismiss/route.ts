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

  try {
    await updateInsightStatus(insightId, "dismissed");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

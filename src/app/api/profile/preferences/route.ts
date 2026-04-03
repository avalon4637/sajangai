import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { businessId, communicationStyle, focusArea, notificationTime } =
    await request.json();

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  // Verify business ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Upsert user profile (untyped — table not yet in generated types)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("user_profiles").upsert(
    {
      business_id: businessId,
      communication_style: communicationStyle ?? "concise",
      focus_area: focusArea ?? "all",
      notification_time: notificationTime ?? "morning",
      active_hours_start: notificationTime === "evening" ? 20 : 7,
      active_hours_end: 22,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

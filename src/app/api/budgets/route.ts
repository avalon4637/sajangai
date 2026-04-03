import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertBudget } from "@/lib/queries/budget";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, year, month, category, targetAmount } = await request.json();

  if (!businessId || !year || !month || !category) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify ownership
  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (!biz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await upsertBudget(businessId, year, month, category, targetAmount ?? 0);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[budgets] Upsert failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

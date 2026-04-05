import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertBudget } from "@/lib/queries/budget";
import { z } from "zod";

const BudgetSchema = z.object({
  businessId: z.string().uuid(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  category: z.string().min(1).max(50),
  targetAmount: z.number().min(0).max(100_000_000_000).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BudgetSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { businessId, year, month, category, targetAmount } = parsed.data;

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

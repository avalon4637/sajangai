import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const LoanSchema = z.object({
  businessId: z.string().uuid(),
  loanName: z.string().min(1).max(100),
  institution: z.string().max(100).optional(),
  principal: z.number().positive().max(100_000_000_000),
  interestRate: z.number().min(0).max(100).optional(),
  monthlyPayment: z.number().min(0).max(10_000_000_000).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = LoanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { businessId, loanName, institution, principal, interestRate, monthlyPayment } = parsed.data;

  // Verify ownership
  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (!biz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("loans").insert({
    business_id: businessId,
    loan_name: loanName,
    institution: institution || null,
    principal,
    interest_rate: interestRate || null,
    monthly_payment: monthlyPayment || null,
  });

  if (error) {
    console.error("[loans] Insert failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

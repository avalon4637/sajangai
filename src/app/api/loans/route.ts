import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { businessId, loanName, institution, principal, interestRate, monthlyPayment } = body;

  if (!businessId || !loanName || !principal) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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

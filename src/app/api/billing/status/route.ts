// GET /api/billing/status
// Returns current subscription status and payment history

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkSubscriptionStatus,
  getDaysRemaining,
} from "@/lib/billing/subscription";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // Get the user's business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (bizError || !business) {
    return NextResponse.json(
      { error: "사업장 정보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const subscription = await checkSubscriptionStatus(business.id);

  if (!subscription) {
    return NextResponse.json({ subscription: null, payments: [] });
  }

  // Fetch payment history
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, status, paid_at, failed_reason, created_at")
    .eq("subscription_id", subscription.id)
    .order("created_at", { ascending: false })
    .limit(12);

  return NextResponse.json({
    subscription: {
      ...subscription,
      daysRemaining: getDaysRemaining(subscription),
    },
    payments: payments ?? [],
  });
}

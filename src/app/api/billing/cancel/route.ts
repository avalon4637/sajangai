// POST /api/billing/cancel
// Cancels the user's subscription
// Access continues until the current billing period ends

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelSubscription } from "@/lib/billing/subscription";

export async function POST(_request: NextRequest): Promise<NextResponse> {
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

  const result = await cancelSubscription(business.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "구독 취소에 실패했습니다." },
      { status: 422 }
    );
  }

  return NextResponse.json({ success: true });
}

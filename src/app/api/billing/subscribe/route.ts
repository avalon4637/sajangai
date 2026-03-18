// POST /api/billing/subscribe
// Creates a subscription using a PortOne billing key
// Called after the user registers their card on the billing page

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { activateSubscription } from "@/lib/billing/subscription";

interface SubscribeRequest {
  billingKey: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: SubscribeRequest;
  try {
    body = (await request.json()) as SubscribeRequest;
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }

  if (!body.billingKey) {
    return NextResponse.json(
      { error: "카드 정보가 필요합니다." },
      { status: 400 }
    );
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

  const result = await activateSubscription(business.id, body.billingKey);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "구독 활성화에 실패했습니다." },
      { status: 422 }
    );
  }

  return NextResponse.json({ success: true });
}

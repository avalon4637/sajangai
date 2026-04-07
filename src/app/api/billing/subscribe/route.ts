// POST /api/billing/subscribe
// Creates a subscription using a PortOne billing key
// Called after the user registers their card on the billing page

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { activateSubscription } from "@/lib/billing/subscription";
import { PRICING } from "@/lib/billing/pricing";
import type { PlanInterval } from "@/lib/billing/pricing";
import { checkRateLimit, getRateLimitKey } from "@/lib/api/rate-limit";

interface SubscribeRequest {
  billingKey: string;
  planInterval?: PlanInterval;
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

  // Rate limit: 3 attempts per 5 minutes per user
  const rlKey = getRateLimitKey(request, "billing-subscribe", user.id);
  const rl = checkRateLimit(rlKey, 3, 5 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  let body: SubscribeRequest;
  try {
    body = (await request.json()) as SubscribeRequest;
  } catch (err) {
    console.error("[billing/subscribe]", err);
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

  // Validate plan interval
  const planInterval = body.planInterval ?? "monthly";
  if (!(planInterval in PRICING)) {
    return NextResponse.json(
      { error: "잘못된 요금제입니다." },
      { status: 400 }
    );
  }

  const result = await activateSubscription(business.id, body.billingKey, planInterval);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "구독 활성화에 실패했습니다." },
      { status: 422 }
    );
  }

  return NextResponse.json({ success: true });
}

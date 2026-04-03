// POST /api/billing/issue-billing-key
// Issues a PortOne billing key from card credentials
// Called server-side from the billing page card form

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { issueBillingKey, PortOneError } from "@/lib/billing/portone-client";

interface IssueBillingKeyRequest {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  birthOrBusinessRegistrationNumber: string;
  passwordTwoDigits: string;
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

  let body: IssueBillingKeyRequest;
  try {
    body = (await request.json()) as IssueBillingKeyRequest;
  } catch (err) {
    console.error("[billing/issue-key]", err);
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }

  if (
    !body.cardNumber ||
    !body.expiryMonth ||
    !body.expiryYear ||
    !body.birthOrBusinessRegistrationNumber ||
    !body.passwordTwoDigits
  ) {
    return NextResponse.json(
      { error: "모든 카드 정보를 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    const result = await issueBillingKey(user.id, {
      cardNumber: body.cardNumber,
      expiryYear: body.expiryYear,
      expiryMonth: body.expiryMonth,
      birthOrBusinessRegistrationNumber: body.birthOrBusinessRegistrationNumber,
      passwordTwoDigits: body.passwordTwoDigits,
    });

    return NextResponse.json({ billingKey: result.billingKey });
  } catch (err) {
    if (err instanceof PortOneError) {
      return NextResponse.json(
        {
          error:
            err.status === 400
              ? "카드 정보가 올바르지 않습니다. 다시 확인해주세요."
              : "카드 등록에 실패했습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 422 }
      );
    }

    console.error("Issue billing key error:", err);
    return NextResponse.json(
      { error: "카드 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

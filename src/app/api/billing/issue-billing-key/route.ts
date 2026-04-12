// POST /api/billing/issue-billing-key
// DEPRECATED: Billing key issuance now happens client-side via PortOne browser SDK
// This endpoint is kept for backwards compatibility but should not be called directly.
// Card info should never be sent to our server — use @portone/browser-sdk instead.

import { NextRequest, NextResponse } from "next/server";
import { verifyCsrfOrigin } from "@/lib/api/csrf";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(
    {
      error:
        "이 엔드포인트는 더 이상 사용되지 않습니다. PortOne 브라우저 SDK를 통해 카드를 등록해주세요.",
    },
    { status: 410 }
  );
}

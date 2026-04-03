// Classification API route for SPEC-SERI-002
// POST /api/classify - Classify parsed transactions using AI

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { classifyTransactions } from "@/lib/ai/expense-classifier";
import type { ParsedTransaction } from "@/types/bookkeeping";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let businessId: string;
    try {
      businessId = await getCurrentBusinessId();
    } catch (err) {
      console.error("[classify]", err);
      return NextResponse.json(
        { error: "Business not found" },
        { status: 400 }
      );
    }

    const body = await request.json() as { transactions?: ParsedTransaction[] };
    const { transactions } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "transactions array is required" },
        { status: 400 }
      );
    }

    // Limit to 200 transactions per request to avoid timeout
    const limited = transactions.slice(0, 200);

    const classified = await classifyTransactions(limited, businessId);

    return NextResponse.json({ classified });
  } catch (error) {
    console.error("[classify] error:", error);
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}

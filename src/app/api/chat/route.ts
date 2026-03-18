// Streaming chat endpoint for 점장 Q&A
// Supports questions about business data: revenues, reviews, reports
// Returns Server-Sent Events stream via AI SDK streamText

import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CHAT_SYSTEM_PROMPT, buildChatContextPrompt } from "@/lib/ai/jeongjang-prompts";

export const maxDuration = 30;

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  businessId: z.string().uuid().optional(),
});

/**
 * Fetch a lightweight business context snapshot for the chat session.
 * Avoids heavy computation - uses cached daily_reports when available.
 */
async function fetchBusinessContext(businessId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.substring(0, 7);

  // Run all queries concurrently
  const [businessResult, revenueResult, reviewResult, briefingResult] =
    await Promise.all([
      supabase
        .from("businesses")
        .select("name")
        .eq("id", businessId)
        .single(),

      supabase
        .from("revenues")
        .select("amount")
        .eq("business_id", businessId)
        .gte("date", `${thisMonth}-01`)
        .lt("date", `${thisMonth}-32`),

      supabase
        .from("delivery_reviews")
        .select("rating, reply_status")
        .eq("business_id", businessId)
        .gte("review_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),

      supabase
        .from("daily_reports")
        .select("summary, content")
        .eq("business_id", businessId)
        .eq("report_date", today)
        .eq("report_type", "jeongjang_briefing")
        .maybeSingle(),
    ]);

  const businessName = businessResult.data?.name ?? "매장";
  const revenues = revenueResult.data ?? [];
  const reviews = reviewResult.data ?? [];
  const briefing = briefingResult.data;

  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10
        ) / 10
      : 0;
  const pendingReviews = reviews.filter(
    (r) => r.reply_status === "pending" || r.reply_status === "draft"
  ).length;

  return buildChatContextPrompt({
    businessName,
    recentRevenue: totalRevenue,
    reviewCount,
    avgRating,
    pendingReviews,
    lastBriefingDate: briefing ? today : undefined,
    lastBriefingSummary: briefing?.summary ?? undefined,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();
  const parsed = ChatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "잘못된 요청 형식입니다.",
        details: parsed.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { message, businessId } = parsed.data;

  // Build business context if businessId provided
  let contextSection = "";
  if (businessId) {
    try {
      // Verify user owns this business
      const { data: business } = await supabase
        .from("businesses")
        .select("id, user_id")
        .eq("id", businessId)
        .eq("user_id", user.id)
        .single();

      if (business) {
        contextSection = await fetchBusinessContext(businessId);
      }
    } catch {
      // Context fetch failure is non-fatal - proceed without context
    }
  }

  const systemWithContext = contextSection
    ? `${CHAT_SYSTEM_PROMPT}\n\n${contextSection}`
    : CHAT_SYSTEM_PROMPT;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemWithContext,
    prompt: message,
  });

  return result.toTextStreamResponse();
}

// POST /api/feedback - Save AI output feedback (thumbs up/down)
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";

const FeedbackSchema = z.object({
  source: z.enum(["chat", "briefing", "review_reply", "diagnosis", "seri_report"]),
  sourceId: z.string().optional(),
  rating: z.union([z.literal(1), z.literal(-1)]),
  promptVersion: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });

  const body = await req.json();
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  // Get business_id for current user
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!business)
    return Response.json(
      { error: "사업장을 찾을 수 없습니다." },
      { status: 404 }
    );

  const { error } = await supabase.from("ai_feedback").insert({
    business_id: business.id,
    source: parsed.data.source,
    source_id: parsed.data.sourceId ?? null,
    rating: parsed.data.rating,
    prompt_version: parsed.data.promptVersion ?? null,
  });

  if (error)
    return Response.json(
      { error: "피드백 저장에 실패했습니다." },
      { status: 500 }
    );

  return Response.json({ success: true });
}

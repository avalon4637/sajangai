// PATCH /api/reviews/[id]/reply - Update AI reply text for a delivery review
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateReplySchema = z.object({
  aiReply: z.string().min(1).max(2000),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateReplySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "답글 내용이 필요합니다." }, { status: 400 });
  }

  const { error } = await supabase
    .from("delivery_reviews")
    .update({
      ai_reply: parsed.data.aiReply,
      reply_status: "draft",
    })
    .eq("id", id);

  if (error) {
    return Response.json({ error: "답글 수정에 실패했습니다." }, { status: 500 });
  }

  return Response.json({ success: true });
}

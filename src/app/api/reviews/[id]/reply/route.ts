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

  // Verify business ownership before allowing update
  const { data: review } = await supabase
    .from("delivery_reviews")
    .select("business_id")
    .eq("id", id)
    .single();

  if (!review) {
    return Response.json({ error: "리뷰를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", review.business_id)
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return Response.json({ error: "접근 권한이 없습니다." }, { status: 403 });
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

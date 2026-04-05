// POST /api/reviews/[id]/publish - Publish an AI reply for a delivery review
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
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

  // Verify review exists and has an AI reply
  const { data: review } = await supabase
    .from("delivery_reviews")
    .select("ai_reply, reply_status, business_id")
    .eq("id", id)
    .single();

  if (!review) {
    return Response.json({ error: "리뷰를 찾을 수 없습니다." }, { status: 404 });
  }

  // Verify business ownership before allowing publish
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", review.business_id)
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return Response.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  }

  if (!review.ai_reply) {
    return Response.json({ error: "발행할 AI 답글이 없습니다." }, { status: 400 });
  }

  if (review.reply_status === "published" || review.reply_status === "auto_published") {
    return Response.json({ error: "이미 발행된 답글입니다." }, { status: 400 });
  }

  const { error } = await supabase
    .from("delivery_reviews")
    .update({ reply_status: "published" })
    .eq("id", id);

  if (error) {
    return Response.json({ error: "발행에 실패했습니다." }, { status: 500 });
  }

  return Response.json({ success: true });
}

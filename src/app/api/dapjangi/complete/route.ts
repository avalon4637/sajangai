// Dapjangi Complete API Route
// POST: Mark a review as "published" (reply completed)
// Updates reply_status and replied_at in delivery_reviews table

import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { reviewId } = body as { reviewId: string };

  if (!reviewId) {
    return Response.json(
      { error: "reviewId is required" },
      { status: 400 }
    );
  }

  // Verify ownership via business_id linked to user
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id);

  if (!businesses || businesses.length === 0) {
    return Response.json({ error: "No business found" }, { status: 404 });
  }

  const businessIds = businesses.map((b) => b.id);

  const { error } = await supabase
    .from("delivery_reviews")
    .update({
      reply_status: "published",
      replied_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .in("business_id", businessIds);

  if (error) {
    return Response.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}

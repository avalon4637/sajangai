import { createClient } from "@/lib/supabase/server";

/**
 * Get the current authenticated user's business ID.
 * Throws an error if the user is not authenticated or has no registered business.
 */
export async function getCurrentBusinessId(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (bizError || !business) {
    throw new Error("등록된 사업장이 없습니다.");
  }

  return business.id;
}

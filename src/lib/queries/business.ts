import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const BUSINESS_COOKIE = "selected_business_id";

/**
 * Get all businesses for the current user.
 */
export async function getUserBusinesses(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증되지 않은 사용자입니다.");

  const { data } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return data ?? [];
}

/**
 * Get the currently selected business ID.
 * Reads from cookie, falls back to first business.
 * Validates that the business belongs to the current user.
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

  // Get all user's businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!businesses || businesses.length === 0) {
    throw new Error("등록된 사업장이 없습니다.");
  }

  // Check cookie for selected business
  const cookieStore = await cookies();
  const selectedId = cookieStore.get(BUSINESS_COOKIE)?.value;

  // Validate selected business belongs to user
  if (selectedId && businesses.some((b) => b.id === selectedId)) {
    return selectedId;
  }

  // Default to first business
  return businesses[0].id;
}

/**
 * Set the selected business ID cookie.
 */
export async function setSelectedBusinessId(
  businessId: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}

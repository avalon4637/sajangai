"use server";

import { revalidatePath } from "next/cache";
import { setSelectedBusinessId } from "@/lib/queries/business";
import { createClient } from "@/lib/supabase/server";

export async function switchBusiness(
  businessId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "인증이 필요합니다." };

  // Verify business belongs to user (IDOR prevention)
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (!business) return { success: false, error: "사업장을 찾을 수 없습니다." };

  await setSelectedBusinessId(businessId);
  revalidatePath("/", "layout");
  return { success: true };
}

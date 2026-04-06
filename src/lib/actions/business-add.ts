"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setSelectedBusinessId } from "@/lib/queries/business";

interface AddBusinessInput {
  name: string;
  businessNumber: string;
  businessType?: string;
  address?: string;
}

export async function addBusiness(
  input: AddBusinessInput,
): Promise<{ success: boolean; businessId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "인증이 필요합니다." };

  // Check max businesses (limit to 5)
  const { count } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= 5) {
    return { success: false, error: "최대 5개 사업장까지 등록할 수 있습니다." };
  }

  // Insert new business
  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      user_id: user.id,
      name: input.name,
      business_number: input.businessNumber,
      business_type: input.businessType ?? null,
      address: input.address ?? null,
    })
    .select("id")
    .single();

  if (error || !business) {
    return { success: false, error: "사업장 등록에 실패했습니다." };
  }

  // Auto-switch to new business
  await setSelectedBusinessId(business.id);
  revalidatePath("/", "layout");
  return { success: true, businessId: business.id };
}

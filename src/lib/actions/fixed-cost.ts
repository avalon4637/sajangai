"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { FixedCostSchema } from "@/lib/validations/data-entry";
import { recalculateMonthlyKpi } from "@/lib/actions/kpi-sync";
import type { ActionResult, FixedCostFormData } from "@/types/data-entry";

function formatDateOrNull(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().split("T")[0];
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function createFixedCost(
  formData: FixedCostFormData
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const parsed = FixedCostSchema.parse(formData);

    const supabase = await createClient();
    const { error } = await supabase.from("fixed_costs").insert({
      business_id: businessId,
      category: parsed.category,
      amount: parsed.amount,
      is_labor: parsed.is_labor,
      start_date: formatDateOrNull(parsed.start_date),
      end_date: formatDateOrNull(parsed.end_date),
    });

    if (error) {
      return { success: false, error: `고정비 등록 실패: ${error.message}` };
    }

    // Recalculate current month KPI since fixed costs affect all months
    await recalculateMonthlyKpi(businessId, getCurrentYearMonth());
    revalidatePath("/fixed-costs");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export async function updateFixedCost(
  id: string,
  formData: FixedCostFormData
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const parsed = FixedCostSchema.parse(formData);

    const supabase = await createClient();
    const { error } = await supabase
      .from("fixed_costs")
      .update({
        category: parsed.category,
        amount: parsed.amount,
        is_labor: parsed.is_labor,
        start_date: formatDateOrNull(parsed.start_date),
        end_date: formatDateOrNull(parsed.end_date),
      })
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: `고정비 수정 실패: ${error.message}` };
    }

    await recalculateMonthlyKpi(businessId, getCurrentYearMonth());
    revalidatePath("/fixed-costs");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export async function deleteFixedCost(id: string): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("fixed_costs")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: `고정비 삭제 실패: ${error.message}` };
    }

    await recalculateMonthlyKpi(businessId, getCurrentYearMonth());
    revalidatePath("/fixed-costs");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

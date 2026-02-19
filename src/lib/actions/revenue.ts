"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { RevenueSchema } from "@/lib/validations/data-entry";
import { recalculateMonthlyKpi } from "@/lib/actions/kpi-sync";
import type { ActionResult, RevenueFormData } from "@/types/data-entry";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export async function createRevenue(
  formData: RevenueFormData
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const parsed = RevenueSchema.parse(formData);
    const dateStr = formatDate(parsed.date);

    const supabase = await createClient();
    const { error } = await supabase.from("revenues").insert({
      business_id: businessId,
      date: dateStr,
      amount: parsed.amount,
      channel: parsed.channel || null,
      category: parsed.category || null,
      memo: parsed.memo || null,
    });

    if (error) {
      return { success: false, error: `매출 등록 실패: ${error.message}` };
    }

    await recalculateMonthlyKpi(businessId, getYearMonth(dateStr));
    revalidatePath("/dashboard/revenue");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export async function updateRevenue(
  id: string,
  formData: RevenueFormData
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const parsed = RevenueSchema.parse(formData);
    const dateStr = formatDate(parsed.date);

    const supabase = await createClient();
    const { error } = await supabase
      .from("revenues")
      .update({
        date: dateStr,
        amount: parsed.amount,
        channel: parsed.channel || null,
        category: parsed.category || null,
        memo: parsed.memo || null,
      })
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: `매출 수정 실패: ${error.message}` };
    }

    await recalculateMonthlyKpi(businessId, getYearMonth(dateStr));
    revalidatePath("/dashboard/revenue");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export async function deleteRevenue(id: string): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const supabase = await createClient();

    // Get the record first to determine yearMonth for KPI recalc
    const { data: record } = await supabase
      .from("revenues")
      .select("date")
      .eq("id", id)
      .eq("business_id", businessId)
      .single();

    const { error } = await supabase
      .from("revenues")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: `매출 삭제 실패: ${error.message}` };
    }

    if (record) {
      await recalculateMonthlyKpi(businessId, getYearMonth(record.date));
    }

    revalidatePath("/dashboard/revenue");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

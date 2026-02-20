"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { ExpenseSchema } from "@/lib/validations/data-entry";
import { recalculateMonthlyKpi } from "@/lib/actions/kpi-sync";
import type { ActionResult, ExpenseFormData } from "@/types/data-entry";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export async function createExpense(
  formData: ExpenseFormData
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const parsed = ExpenseSchema.parse(formData);
    const dateStr = formatDate(parsed.date);

    const supabase = await createClient();
    const { error } = await supabase.from("expenses").insert({
      business_id: businessId,
      date: dateStr,
      type: parsed.type,
      category: parsed.category,
      amount: parsed.amount,
      memo: parsed.memo || null,
    });

    if (error) {
      return { success: false, error: `비용 등록 실패: ${error.message}` };
    }

    await recalculateMonthlyKpi(businessId, getYearMonth(dateStr));
    revalidatePath("/expense");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export async function updateExpense(
  id: string,
  formData: ExpenseFormData
): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const parsed = ExpenseSchema.parse(formData);
    const dateStr = formatDate(parsed.date);

    const supabase = await createClient();
    const { error } = await supabase
      .from("expenses")
      .update({
        date: dateStr,
        type: parsed.type,
        category: parsed.category,
        amount: parsed.amount,
        memo: parsed.memo || null,
      })
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: `비용 수정 실패: ${error.message}` };
    }

    await recalculateMonthlyKpi(businessId, getYearMonth(dateStr));
    revalidatePath("/expense");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const supabase = await createClient();

    // Get the record first to determine yearMonth for KPI recalc
    const { data: record } = await supabase
      .from("expenses")
      .select("date")
      .eq("id", id)
      .eq("business_id", businessId)
      .single();

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: `비용 삭제 실패: ${error.message}` };
    }

    if (record) {
      await recalculateMonthlyKpi(businessId, getYearMonth(record.date));
    }

    revalidatePath("/expense");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

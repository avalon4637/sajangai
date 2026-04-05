"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { recalculateMonthlyKpi } from "@/lib/actions/kpi-sync";
import type { ActionResult } from "@/types/data-entry";

export interface BulkExpenseRow {
  date: string;
  content: string;
  amount: number;
  category: string;
  type: "fixed" | "variable";
}

/**
 * Bulk insert expenses from uploaded CSV/statement data.
 * Recalculates KPIs for all affected months.
 */
export async function bulkInsertExpenses(
  rows: BulkExpenseRow[]
): Promise<ActionResult & { insertedCount?: number }> {
  try {
    if (rows.length === 0) {
      return { success: false, error: "등록할 거래가 없습니다." };
    }

    const businessId = await getCurrentBusinessId();
    const supabase = await createClient();

    const inserts = rows.map((row) => ({
      business_id: businessId,
      date: row.date,
      category: row.category,
      amount: Math.abs(row.amount),
      type: row.type,
      memo: row.content || null,
    }));

    const { error } = await supabase.from("expenses").insert(inserts);

    if (error) {
      return { success: false, error: `일괄 등록 실패: ${error.message}` };
    }

    // Recalculate KPIs for all affected months
    const affectedMonths = new Set(rows.map((r) => r.date.slice(0, 7)));
    for (const ym of affectedMonths) {
      await recalculateMonthlyKpi(businessId, ym);
    }

    revalidatePath("/transactions");
    revalidatePath("/expense");
    revalidatePath("/analysis");

    return { success: true, insertedCount: rows.length };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

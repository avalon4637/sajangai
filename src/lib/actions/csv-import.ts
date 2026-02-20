"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { recalculateMonthlyKpi } from "@/lib/actions/kpi-sync";

export interface ImportRow {
  date: string;
  channel: string;
  category: string;
  amount: number;
  type: "revenue" | "expense";
  memo: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

function getYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export async function checkDuplicates(
  rows: ImportRow[]
): Promise<Set<number>> {
  const businessId = await getCurrentBusinessId();
  const supabase = await createClient();
  const duplicateIndices = new Set<number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const table = row.type === "revenue" ? "revenues" : "expenses";

    const query = supabase
      .from(table)
      .select("id")
      .eq("business_id", businessId)
      .eq("date", row.date)
      .eq("amount", row.amount);

    if (row.type === "revenue") {
      query.eq("channel", row.channel);
    } else {
      query.eq("category", row.category);
    }

    const { data } = await query.limit(1);

    if (data && data.length > 0) {
      duplicateIndices.add(i);
    }
  }

  return duplicateIndices;
}

export async function importCsvData(
  rows: ImportRow[],
  skipIndices?: number[]
): Promise<ImportResult> {
  const businessId = await getCurrentBusinessId();
  const supabase = await createClient();

  const skipSet = new Set(skipIndices ?? []);
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];
  const affectedYearMonths = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    if (skipSet.has(i)) {
      skipped++;
      continue;
    }

    const row = rows[i];

    try {
      if (row.type === "revenue") {
        const { error } = await supabase.from("revenues").insert({
          business_id: businessId,
          date: row.date,
          amount: row.amount,
          channel: row.channel || null,
          category: row.category || null,
          memo: row.memo || null,
        });

        if (error) {
          failed++;
          errors.push(`${i + 1}번째 행 (매출): ${error.message}`);
          continue;
        }
      } else {
        const { error } = await supabase.from("expenses").insert({
          business_id: businessId,
          date: row.date,
          type: "variable" as const,
          category: row.category,
          amount: row.amount,
          memo: row.memo || null,
        });

        if (error) {
          failed++;
          errors.push(`${i + 1}번째 행 (비용): ${error.message}`);
          continue;
        }
      }

      success++;
      affectedYearMonths.add(getYearMonth(row.date));
    } catch (err) {
      failed++;
      errors.push(
        `${i + 1}번째 행: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
      );
    }
  }

  for (const yearMonth of affectedYearMonths) {
    await recalculateMonthlyKpi(businessId, yearMonth);
  }

  revalidatePath("/dashboard");
  revalidatePath("/revenue");
  revalidatePath("/expense");

  return { success, failed, skipped, errors };
}

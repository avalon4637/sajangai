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
): Promise<number[]> {
  if (rows.length === 0) return [];

  const businessId = await getCurrentBusinessId();
  const supabase = await createClient();
  const dates = [...new Set(rows.map((r) => r.date))];

  // Batch: exactly 2 queries instead of N
  const [
    { data: existingRevenues, error: revError },
    { data: existingExpenses, error: expError },
  ] = await Promise.all([
    supabase
      .from("revenues")
      .select("date, amount, channel")
      .eq("business_id", businessId)
      .in("date", dates),
    supabase
      .from("expenses")
      .select("date, amount, category")
      .eq("business_id", businessId)
      .in("date", dates),
  ]);

  if (revError)
    throw new Error(`Revenue duplicate check failed: ${revError.message}`);
  if (expError)
    throw new Error(`Expense duplicate check failed: ${expError.message}`);

  // O(1) lookup sets
  const revSet = new Set(
    (existingRevenues ?? []).map((r) => `${r.date}|${r.amount}|${r.channel}`)
  );
  const expSet = new Set(
    (existingExpenses ?? []).map((e) => `${e.date}|${e.amount}|${e.category}`)
  );

  return rows.reduce<number[]>((acc, row, i) => {
    const key =
      row.type === "revenue"
        ? `${row.date}|${row.amount}|${row.channel}`
        : `${row.date}|${row.amount}|${row.category}`;
    if ((row.type === "revenue" ? revSet : expSet).has(key)) acc.push(i);
    return acc;
  }, []);
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

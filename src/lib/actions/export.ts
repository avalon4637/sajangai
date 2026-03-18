"use server";

import { createClient } from "@/lib/supabase/server";
import { getLastDayOfMonth } from "@/lib/utils";

/**
 * Export monthly revenue summary as CSV string.
 * Columns: 날짜, 매출, 거래건수, 채널, 카테고리
 */
export async function exportRevenueSummary(
  businessId: string,
  yearMonth: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("revenues")
    .select("date, amount, channel, category, memo")
    .eq("business_id", businessId)
    .gte("date", `${yearMonth}-01`)
    .lte("date", getLastDayOfMonth(yearMonth))
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`매출 데이터 조회 실패: ${error.message}`);
  }

  const rows = data ?? [];

  // Group by date for daily summary
  const dailyMap = new Map<
    string,
    { amount: number; count: number; channels: Set<string>; categories: Set<string> }
  >();

  for (const row of rows) {
    const key = row.date;
    if (!dailyMap.has(key)) {
      dailyMap.set(key, {
        amount: 0,
        count: 0,
        channels: new Set(),
        categories: new Set(),
      });
    }
    const entry = dailyMap.get(key)!;
    entry.amount += row.amount;
    entry.count += 1;
    if (row.channel) entry.channels.add(row.channel);
    if (row.category) entry.categories.add(row.category);
  }

  // Build CSV
  const header = "날짜,매출,거래건수,채널,카테고리";
  const lines = [header];

  for (const [date, entry] of Array.from(dailyMap.entries()).sort()) {
    const channels = Array.from(entry.channels).join("|") || "-";
    const categories = Array.from(entry.categories).join("|") || "-";
    lines.push(
      `${date},${entry.amount},${entry.count},"${channels}","${categories}"`
    );
  }

  return lines.join("\n");
}

/**
 * Export monthly revenue detail as CSV string.
 * All revenue records with full details.
 */
export async function exportRevenueDetail(
  businessId: string,
  yearMonth: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("revenues")
    .select("date, amount, channel, category, memo, created_at")
    .eq("business_id", businessId)
    .gte("date", `${yearMonth}-01`)
    .lte("date", getLastDayOfMonth(yearMonth))
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`매출 상세 데이터 조회 실패: ${error.message}`);
  }

  const rows = data ?? [];

  const header = "날짜,매출금액,채널,카테고리,메모";
  const lines = [header];

  for (const row of rows) {
    const channel = row.channel ?? "-";
    const category = row.category ?? "-";
    const memo = (row.memo ?? "").replace(/"/g, '""');
    lines.push(
      `${row.date},${row.amount},"${channel}","${category}","${memo}"`
    );
  }

  return lines.join("\n");
}

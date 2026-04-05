import { createClient } from "@/lib/supabase/server";

export interface DailyCumulativeData {
  date: string;
  dailyRevenue: number;
  movingAvg7d: number;
  cumulativeRevenue: number;
}

/**
 * Get daily cumulative revenue + 7-day moving average using SQL function.
 * Falls back to simple query if function doesn't exist yet.
 */
export async function getDailyCumulative(
  businessId: string,
  year: number,
  month: number
): Promise<DailyCumulativeData[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  try {
    const { data, error } = await supabase.rpc("calculate_daily_cumulative", {
      p_business_id: businessId,
      p_year: year,
      p_month: month,
    });

    if (error) throw error;

    return (data as DailyCumulativeData[]) ?? [];
  } catch (error) {
    // Fallback: simple daily revenue query
    console.error("[DailyCumulative] RPC call failed, using fallback query:", error);
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const { data: revenues } = await supabase
      .from("revenues")
      .select("date, amount")
      .eq("business_id", businessId)
      .gte("date", `${monthStr}-01`)
      .lt("date", getNextMonth(monthStr))
      .order("date");

    if (!revenues) return [];

    // Group by date and compute cumulative
    const dailyMap: Record<string, number> = {};
    for (const r of revenues) {
      dailyMap[r.date] = (dailyMap[r.date] ?? 0) + Number(r.amount);
    }

    let cumulative = 0;
    const recentDays: number[] = [];

    return Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => {
        cumulative += amount;
        recentDays.push(amount);
        if (recentDays.length > 7) recentDays.shift();
        const avg = recentDays.reduce((s, v) => s + v, 0) / recentDays.length;

        return {
          date,
          dailyRevenue: amount,
          movingAvg7d: Math.round(avg),
          cumulativeRevenue: cumulative,
        };
      });
  }
}

function getNextMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

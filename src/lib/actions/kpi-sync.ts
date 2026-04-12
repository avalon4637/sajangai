"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Recalculate monthly KPI summary for a given business and month.
 * Delegates to a Postgres function that uses pg_advisory_xact_lock
 * to prevent race conditions from concurrent calls.
 */
export async function recalculateMonthlyKpi(
  businessId: string,
  yearMonth: string
): Promise<void> {
  const supabase = await createClient();

  // Cast needed: generated Supabase types don't include this RPC yet.
  // Created via migration 20260412200000_recalculate_monthly_kpi_fn.sql.
  const { error } = await (supabase.rpc as Function)(
    "recalculate_monthly_kpi",
    { p_business_id: businessId, p_year_month: yearMonth }
  );

  if (error) {
    console.error("[kpi-sync] recalculate_monthly_kpi RPC failed:", error);
    throw new Error(`KPI recalculation failed: ${error.message}`);
  }
}

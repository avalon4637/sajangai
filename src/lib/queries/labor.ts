import { createClient } from "@/lib/supabase/server";
import type { Tables, InsertTables, UpdateTables } from "@/types/database";

export type LaborRecord = Tables<"labor_records">;
export type LaborRecordInsert = Omit<InsertTables<"labor_records">, "net_amount">;
export type LaborRecordUpdate = Omit<UpdateTables<"labor_records">, "net_amount">;

export interface MonthlyLaborSummary {
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
}

/**
 * Get labor records for a business, optionally filtered by year-month (YYYY-MM).
 */
export async function getLaborRecords(
  businessId: string,
  yearMonth?: string
): Promise<LaborRecord[]> {
  const supabase = await createClient();

  let query = supabase
    .from("labor_records")
    .select("*")
    .eq("business_id", businessId)
    .order("payment_date", { ascending: false });

  if (yearMonth) {
    const startDate = `${yearMonth}-01`;
    const [year, month] = yearMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;

    query = query.gte("payment_date", startDate).lte("payment_date", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`인건비 기록 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Insert a new labor record.
 */
export async function createLaborRecord(
  data: LaborRecordInsert
): Promise<LaborRecord> {
  const supabase = await createClient();

  const { data: record, error } = await supabase
    .from("labor_records")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`인건비 기록 생성 실패: ${error.message}`);
  }

  return record;
}

/**
 * Update an existing labor record by id.
 */
export async function updateLaborRecord(
  id: string,
  data: LaborRecordUpdate
): Promise<LaborRecord> {
  const supabase = await createClient();

  const { data: record, error } = await supabase
    .from("labor_records")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`인건비 기록 수정 실패: ${error.message}`);
  }

  return record;
}

/**
 * Delete a labor record by id.
 */
export async function deleteLaborRecord(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("labor_records")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`인건비 기록 삭제 실패: ${error.message}`);
  }
}

/**
 * Get monthly labor summary for a business.
 * yearMonth format: YYYY-MM
 */
export async function getMonthlyLaborSummary(
  businessId: string,
  yearMonth: string
): Promise<MonthlyLaborSummary> {
  const records = await getLaborRecords(businessId, yearMonth);

  const totalGross = records.reduce((sum, r) => sum + r.gross_amount, 0);
  const totalDeductions = records.reduce((sum, r) => sum + r.deductions, 0);
  const totalNet = records.reduce((sum, r) => sum + r.net_amount, 0);

  return { totalGross, totalDeductions, totalNet };
}

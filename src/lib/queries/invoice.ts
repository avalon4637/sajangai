import { createClient } from "@/lib/supabase/server";
import type { Tables, InsertTables } from "@/types/database";

export type Invoice = Tables<"invoices">;
export type InvoiceInsert = InsertTables<"invoices">;

export interface InvoiceFilters {
  status?: "pending" | "paid" | "overdue";
  type?: "receivable" | "payable";
}

export interface OutstandingBalance {
  totalReceivable: number;
  totalPayable: number;
  overdueCount: number;
}

/**
 * Get invoices for a business with optional status/type filters.
 */
export async function getInvoices(
  businessId: string,
  filters?: InvoiceFilters
): Promise<Invoice[]> {
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select("*")
    .eq("business_id", businessId)
    .order("issue_date", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`청구서 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Insert a new invoice.
 */
export async function createInvoice(data: InvoiceInsert): Promise<Invoice> {
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`청구서 생성 실패: ${error.message}`);
  }

  return invoice;
}

/**
 * Mark an invoice as paid.
 */
export async function markAsPaid(
  invoiceId: string,
  paidDate: string
): Promise<Invoice> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_date: paidDate })
    .eq("id", invoiceId)
    .select()
    .single();

  if (error) {
    throw new Error(`청구서 결제 처리 실패: ${error.message}`);
  }

  return data;
}

/**
 * Get outstanding balance summary for a business.
 * Only counts invoices with status 'pending' or 'overdue'.
 */
export async function getOutstandingBalance(
  businessId: string
): Promise<OutstandingBalance> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("type, amount, status")
    .eq("business_id", businessId)
    .in("status", ["pending", "overdue"]);

  if (error) {
    throw new Error(`미수금/미지급금 조회 실패: ${error.message}`);
  }

  const rows = data ?? [];
  const totalReceivable = rows
    .filter((r) => r.type === "receivable")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalPayable = rows
    .filter((r) => r.type === "payable")
    .reduce((sum, r) => sum + r.amount, 0);
  const overdueCount = rows.filter((r) => r.status === "overdue").length;

  return { totalReceivable, totalPayable, overdueCount };
}

/**
 * Get all overdue invoices (past due_date with status 'pending').
 */
export async function getOverdueInvoices(
  businessId: string
): Promise<Invoice[]> {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "pending")
    .lt("due_date", today)
    .order("due_date", { ascending: true });

  if (error) {
    throw new Error(`연체 청구서 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Auto-set status to 'overdue' for invoices past their due_date.
 * Returns the count of updated records.
 */
export async function updateOverdueStatuses(
  businessId: string
): Promise<number> {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("business_id", businessId)
    .eq("status", "pending")
    .lt("due_date", today)
    .select("id");

  if (error) {
    throw new Error(`연체 상태 업데이트 실패: ${error.message}`);
  }

  return (data ?? []).length;
}

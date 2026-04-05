"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { createInvoice, markAsPaid } from "@/lib/queries/invoice";

export interface InvoiceActionResult {
  success: boolean;
  error?: string;
}

export interface AddInvoiceInput {
  type: "receivable" | "payable";
  counterparty: string;
  supplyAmount: number;
  taxAmount: number;
  issueDate: string;
  dueDate?: string;
  memo?: string;
}

/**
 * Mark an invoice as paid with today's date.
 * Verifies the invoice belongs to the current user's business.
 */
export async function markInvoiceAsPaid(
  invoiceId: string
): Promise<InvoiceActionResult> {
  try {
    const businessId = await getCurrentBusinessId();

    // Verify invoice belongs to user's business before updating
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("id", invoiceId)
      .eq("business_id", businessId)
      .single();

    if (!invoice) {
      return { success: false, error: "청구서를 찾을 수 없습니다." };
    }

    const today = new Date().toISOString().split("T")[0];
    await markAsPaid(invoiceId, today);
    revalidatePath("/invoices");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return { success: false, error: message };
  }
}

/**
 * Add a new invoice. Supply + tax amounts are stored as total.
 */
export async function addInvoice(
  input: AddInvoiceInput
): Promise<InvoiceActionResult> {
  try {
    const businessId = await getCurrentBusinessId();
    const totalAmount = input.supplyAmount + input.taxAmount;

    await createInvoice({
      business_id: businessId,
      type: input.type,
      counterparty: input.counterparty,
      amount: totalAmount,
      issue_date: input.issueDate,
      due_date: input.dueDate || null,
      memo: input.memo || null,
    });

    revalidatePath("/invoices");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return { success: false, error: message };
  }
}

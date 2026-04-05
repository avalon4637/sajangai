"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { createVendor, updateVendor, deleteVendor } from "@/lib/queries/vendor";

export interface VendorActionResult {
  success: boolean;
  error?: string;
}

export interface AddVendorInput {
  name: string;
  category?: string;
  contactName?: string;
  phone?: string;
  businessNumber?: string;
  memo?: string;
}

export interface UpdateVendorInput extends AddVendorInput {
  id: string;
}

/**
 * Add a new vendor for the current business.
 */
export async function addVendor(
  input: AddVendorInput
): Promise<VendorActionResult> {
  try {
    const businessId = await getCurrentBusinessId();

    await createVendor({
      business_id: businessId,
      name: input.name,
      category: input.category || null,
      contact_name: input.contactName || null,
      phone: input.phone || null,
      business_number: input.businessNumber || null,
      memo: input.memo || null,
    });

    revalidatePath("/vendors");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return { success: false, error: message };
  }
}

/**
 * Update an existing vendor.
 */
export async function editVendor(
  input: UpdateVendorInput
): Promise<VendorActionResult> {
  try {
    await getCurrentBusinessId();

    await updateVendor(input.id, {
      name: input.name,
      category: input.category || null,
      contact_name: input.contactName || null,
      phone: input.phone || null,
      business_number: input.businessNumber || null,
      memo: input.memo || null,
    });

    revalidatePath("/vendors");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return { success: false, error: message };
  }
}

/**
 * Delete a vendor by id.
 */
export async function removeVendor(
  vendorId: string
): Promise<VendorActionResult> {
  try {
    await getCurrentBusinessId();
    await deleteVendor(vendorId);

    revalidatePath("/vendors");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return { success: false, error: message };
  }
}

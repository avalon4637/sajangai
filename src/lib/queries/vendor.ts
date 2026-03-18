import { createClient } from "@/lib/supabase/server";
import type { Tables, InsertTables, UpdateTables } from "@/types/database";

export type Vendor = Tables<"vendors">;
export type VendorInsert = InsertTables<"vendors">;
export type VendorUpdate = UpdateTables<"vendors">;

/**
 * Get all vendors for a business, ordered by name.
 */
export async function getVendors(businessId: string): Promise<Vendor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`거래처 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Insert a new vendor.
 */
export async function createVendor(data: VendorInsert): Promise<Vendor> {
  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from("vendors")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`거래처 생성 실패: ${error.message}`);
  }

  return vendor;
}

/**
 * Update an existing vendor by id.
 */
export async function updateVendor(
  id: string,
  data: VendorUpdate
): Promise<Vendor> {
  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from("vendors")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`거래처 수정 실패: ${error.message}`);
  }

  return vendor;
}

/**
 * Delete a vendor by id.
 */
export async function deleteVendor(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("vendors").delete().eq("id", id);

  if (error) {
    throw new Error(`거래처 삭제 실패: ${error.message}`);
  }
}

/**
 * Find a vendor by name or create it if it does not exist.
 * Returns the existing or newly created vendor.
 */
export async function findOrCreateVendor(
  businessId: string,
  name: string
): Promise<Vendor> {
  const supabase = await createClient();

  // Try to find existing vendor by exact name match
  const { data: existing, error: findError } = await supabase
    .from("vendors")
    .select("*")
    .eq("business_id", businessId)
    .eq("name", name)
    .maybeSingle();

  if (findError) {
    throw new Error(`거래처 검색 실패: ${findError.message}`);
  }

  if (existing) {
    return existing;
  }

  // Create new vendor with minimal data
  const { data: created, error: createError } = await supabase
    .from("vendors")
    .insert({ business_id: businessId, name })
    .select()
    .single();

  if (createError) {
    throw new Error(`거래처 자동 생성 실패: ${createError.message}`);
  }

  return created;
}

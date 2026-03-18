import { createClient } from "@/lib/supabase/server";
import type {
  Tables,
  InsertTables,
} from "@/types/database";

export type ExpenseCategory = Tables<"expense_categories">;
export type MerchantMapping = Tables<"merchant_mappings">;

// Default 9 major categories with standard subcategories
const DEFAULT_CATEGORIES: Array<{
  major_category: string;
  sub_category: string;
  display_order: number;
}> = [
  { major_category: "고정비용", sub_category: "임대료", display_order: 10 },
  { major_category: "고정비용", sub_category: "관리비", display_order: 11 },
  { major_category: "고정비용", sub_category: "기타고정비", display_order: 12 },
  { major_category: "세금", sub_category: "부가세", display_order: 20 },
  { major_category: "세금", sub_category: "소득세", display_order: 21 },
  { major_category: "세금", sub_category: "4대보험", display_order: 22 },
  { major_category: "인건비", sub_category: "직원급여", display_order: 30 },
  { major_category: "인건비", sub_category: "아르바이트", display_order: 31 },
  { major_category: "인건비", sub_category: "대표급여", display_order: 32 },
  { major_category: "식자재", sub_category: "식재료", display_order: 40 },
  { major_category: "식자재", sub_category: "음료/주류", display_order: 41 },
  { major_category: "식자재", sub_category: "포장재", display_order: 42 },
  { major_category: "소모품", sub_category: "주방소모품", display_order: 50 },
  { major_category: "소모품", sub_category: "청소용품", display_order: 51 },
  { major_category: "소모품", sub_category: "사무용품", display_order: 52 },
  { major_category: "운영비", sub_category: "전기세", display_order: 60 },
  { major_category: "운영비", sub_category: "가스비", display_order: 61 },
  { major_category: "운영비", sub_category: "통신비", display_order: 62 },
  { major_category: "운영비", sub_category: "기타운영비", display_order: 63 },
  { major_category: "마케팅", sub_category: "광고비", display_order: 70 },
  { major_category: "마케팅", sub_category: "SNS운영", display_order: 71 },
  { major_category: "마케팅", sub_category: "이벤트비용", display_order: 72 },
  { major_category: "대표교육비", sub_category: "교육/세미나", display_order: 80 },
  { major_category: "대표교육비", sub_category: "도서/자료", display_order: 81 },
  { major_category: "수수료", sub_category: "배달앱수수료", display_order: 90 },
  { major_category: "수수료", sub_category: "카드수수료", display_order: 91 },
  { major_category: "수수료", sub_category: "PG수수료", display_order: 92 },
];

/**
 * Get all expense categories for a business, ordered by display_order.
 */
export async function getCategories(
  businessId: string
): Promise<ExpenseCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("business_id", businessId)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`카테고리 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Return the 9 major categories with standard subcategories as static data.
 * Does not require a businessId - returns the global default list.
 */
export function getDefaultCategories(): typeof DEFAULT_CATEGORIES {
  return DEFAULT_CATEGORIES;
}

/**
 * Ensure default categories exist for a business.
 * Inserts missing defaults without touching user-created categories.
 */
export async function ensureDefaultCategories(
  businessId: string
): Promise<void> {
  const supabase = await createClient();

  const inserts: InsertTables<"expense_categories">[] = DEFAULT_CATEGORIES.map(
    (cat) => ({
      business_id: businessId,
      major_category: cat.major_category,
      sub_category: cat.sub_category,
      display_order: cat.display_order,
      is_default: true,
    })
  );

  // Use upsert with onConflict to skip existing rows
  const { error } = await supabase
    .from("expense_categories")
    .upsert(inserts, {
      onConflict: "business_id,major_category,sub_category",
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(`기본 카테고리 초기화 실패: ${error.message}`);
  }
}

/**
 * Find the best matching category for a merchant name.
 * Returns the mapping with the highest confidence if found, null otherwise.
 */
export async function getMerchantMapping(
  businessId: string,
  merchantName: string
): Promise<MerchantMapping | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("merchant_mappings")
    .select("*")
    .eq("business_id", businessId)
    .ilike("merchant_name_pattern", `%${merchantName}%`)
    .order("confidence", { ascending: false })
    .order("usage_count", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`가맹점 매핑 조회 실패: ${error.message}`);
  }

  return data;
}

/**
 * Upsert a merchant-to-category mapping.
 * Increments usage_count if the mapping already exists.
 */
export async function upsertMerchantMapping(
  businessId: string,
  pattern: string,
  majorCat: string,
  subCat: string | null,
  confidence: number = 1.0,
  createdBy: "user" | "ai" = "user"
): Promise<MerchantMapping> {
  const supabase = await createClient();

  // Check if mapping already exists
  const { data: existing } = await supabase
    .from("merchant_mappings")
    .select("*")
    .eq("business_id", businessId)
    .eq("merchant_name_pattern", pattern)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("merchant_mappings")
      .update({
        major_category: majorCat,
        sub_category: subCat,
        confidence,
        usage_count: existing.usage_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new Error(`가맹점 매핑 업데이트 실패: ${error.message}`);
    return data;
  }

  const { data, error } = await supabase
    .from("merchant_mappings")
    .insert({
      business_id: businessId,
      merchant_name_pattern: pattern,
      major_category: majorCat,
      sub_category: subCat,
      confidence,
      usage_count: 1,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw new Error(`가맹점 매핑 생성 실패: ${error.message}`);
  return data;
}

/**
 * Get monthly expense breakdown grouped by major category.
 * yearMonth format: YYYY-MM
 */
export async function getExpenseByCategory(
  businessId: string,
  yearMonth: string
): Promise<Array<{ major_category: string; total: number }>> {
  const supabase = await createClient();

  // Derive start/end dates from yearMonth
  const startDate = `${yearMonth}-01`;
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("expenses")
    .select("category, amount")
    .eq("business_id", businessId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    throw new Error(`카테고리별 지출 조회 실패: ${error.message}`);
  }

  // Aggregate by category client-side
  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const cat = row.category ?? "기타";
    totals.set(cat, (totals.get(cat) ?? 0) + row.amount);
  }

  return Array.from(totals.entries())
    .map(([major_category, total]) => ({ major_category, total }))
    .sort((a, b) => b.total - a.total);
}

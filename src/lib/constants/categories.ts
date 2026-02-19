/**
 * Category presets from the "Deerna Business Ledger" Excel template.
 * These constants define the standard revenue/expense classification system.
 */

// Revenue payment channels
export const REVENUE_CHANNELS = ["카드", "지역화폐", "현금"] as const;

// Revenue sub-categories
export const REVENUE_CATEGORIES = [
  "매장",
  "테이크아웃",
  "배민",
  "쿠팡이츠",
  "요기요",
  "단체주문",
] as const;

// Expense category structure with DB mapping
export interface ExpenseCategoryGroup {
  major: string;
  subcategories: string[];
  dbType: "fixed" | "variable";
}

export const EXPENSE_CATEGORIES: ExpenseCategoryGroup[] = [
  {
    major: "고정비용",
    subcategories: [
      "월세",
      "관리비",
      "대출이자",
      "대표 건보료",
      "대표 연금",
      "보험료",
      "정기결제",
      "기장비",
      "CCTV",
      "통신비",
    ],
    dbType: "fixed",
  },
  {
    major: "세금",
    subcategories: [
      "직원4대보험",
      "부가세",
      "종소세",
      "인건비신고",
      "자동차세",
    ],
    dbType: "fixed",
  },
  {
    major: "인건비",
    subcategories: ["고정알바", "단기알바", "직원식대", "회식비"],
    dbType: "fixed",
  },
  {
    major: "식자재",
    subcategories: ["커피원두", "유제품", "시럽"],
    dbType: "variable",
  },
  {
    major: "소모품",
    subcategories: ["일회용컵", "홀더", "빨대", "티슈", "사무용품"],
    dbType: "variable",
  },
  {
    major: "운영비",
    subcategories: ["인테리어", "수리비", "식기주방용품"],
    dbType: "variable",
  },
  {
    major: "마케팅",
    subcategories: ["입간판", "포스터", "인스타광고", "협찬광고"],
    dbType: "variable",
  },
  {
    major: "대표교육비",
    subcategories: ["강의"],
    dbType: "variable",
  },
  {
    major: "수수료",
    subcategories: ["카드수수료", "배달수수료"],
    dbType: "variable",
  },
];

// Fixed cost categories (non-labor): mapped to fixed_costs table with is_labor=false
export const FIXED_COST_CATEGORIES = [
  "월세",
  "관리비",
  "대출이자",
  "대표 건보료",
  "대표 연금",
  "보험료",
  "정기결제",
  "기장비",
  "CCTV",
  "통신비",
] as const;

// Labor cost categories: mapped to fixed_costs table with is_labor=true
export const LABOR_COST_CATEGORIES = [
  "고정알바",
  "단기알바",
  "직원식대",
  "회식비",
] as const;

// Helper: get expense subcategories by DB type
export function getExpenseSubcategoriesByType(
  type: "fixed" | "variable"
): string[] {
  return EXPENSE_CATEGORIES.filter((c) => c.dbType === type).flatMap(
    (c) => c.subcategories
  );
}

// Helper: get expense major category for a subcategory
export function getMajorCategory(subcategory: string): string | undefined {
  return EXPENSE_CATEGORIES.find((c) =>
    c.subcategories.includes(subcategory)
  )?.major;
}

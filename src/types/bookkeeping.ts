// Bookkeeping types for SPEC-SERI-002: Enhanced Bookkeeping

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  merchantName: string;
  amount: number; // positive = expense, negative = income
  memo: string | null;
  originalCategory: string | null;
  bankOrCard: string;
  rawRow: Record<string, string>;
}

export interface ClassifiedTransaction extends ParsedTransaction {
  majorCategory: string;
  subCategory: string | null;
  confidence: number; // 0.0 to 1.0
  isDuplicate: boolean;
  matchedMappingId: string | null;
}

export const MAJOR_CATEGORIES = [
  "고정비용",
  "세금",
  "인건비",
  "식자재",
  "소모품",
  "운영비",
  "마케팅",
  "대표교육비",
  "수수료",
] as const;

export type MajorCategory = (typeof MAJOR_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  고정비용: "#3B82F6", // blue
  세금: "#EF4444", // red
  인건비: "#F59E0B", // amber
  식자재: "#10B981", // emerald
  소모품: "#8B5CF6", // violet
  운영비: "#6366F1", // indigo
  마케팅: "#EC4899", // pink
  대표교육비: "#14B8A6", // teal
  수수료: "#F97316", // orange
};

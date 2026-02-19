import type { Tables } from "./database";
import type {
  RevenueFormData,
  ExpenseFormData,
  FixedCostFormData,
} from "@/lib/validations/data-entry";

// Database row types
export type Revenue = Tables<"revenues">;
export type Expense = Tables<"expenses">;
export type FixedCost = Tables<"fixed_costs">;
export type MonthlySummary = Tables<"monthly_summaries">;

// Re-export form data types for convenience
export type { RevenueFormData, ExpenseFormData, FixedCostFormData };

// Server Action result type
export interface ActionResult {
  success: boolean;
  error?: string;
}

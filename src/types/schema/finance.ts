// Phase 3.1 — Finance domain aliases

import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type Revenue = Tables["revenues"]["Row"];
export type RevenueInsert = Tables["revenues"]["Insert"];
export type RevenueUpdate = Tables["revenues"]["Update"];

export type Expense = Tables["expenses"]["Row"];
export type ExpenseInsert = Tables["expenses"]["Insert"];
export type ExpenseUpdate = Tables["expenses"]["Update"];

export type FixedCost = Tables["fixed_costs"]["Row"];
export type FixedCostInsert = Tables["fixed_costs"]["Insert"];
export type FixedCostUpdate = Tables["fixed_costs"]["Update"];

export type MonthlySummary = Tables["monthly_summaries"]["Row"];

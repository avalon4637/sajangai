// Phase 2.3 / 3.1 — Monthly ROI domain aliases

import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type MonthlyRoiReport = Tables["monthly_roi_reports"]["Row"];
export type MonthlyRoiReportInsert = Tables["monthly_roi_reports"]["Insert"];
export type MonthlyRoiReportUpdate = Tables["monthly_roi_reports"]["Update"];

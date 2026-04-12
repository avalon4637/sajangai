// Phase 3.1 — Business/user domain aliases

import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type Business = Tables["businesses"]["Row"];
export type BusinessInsert = Tables["businesses"]["Insert"];
export type BusinessUpdate = Tables["businesses"]["Update"];

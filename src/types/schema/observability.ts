// Phase 0.5 / 3.1 — Observability domain aliases

import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type AiCallLog = Tables["ai_call_logs"]["Row"];
export type AiCallLogInsert = Tables["ai_call_logs"]["Insert"];
export type AiCallLogUpdate = Tables["ai_call_logs"]["Update"];

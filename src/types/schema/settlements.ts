// Phase 2.2 / 3.1 — Card settlements domain aliases

import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type CardSettlement = Tables["card_settlements"]["Row"];
export type CardSettlementInsert = Tables["card_settlements"]["Insert"];
export type CardSettlementUpdate = Tables["card_settlements"]["Update"];

export type SettlementStatus = CardSettlement["status"];

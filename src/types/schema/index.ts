// Phase 3.1 — Domain schema barrel
//
// Import convenience types from one place:
//
//   import type { Revenue, CardSettlement, Subscription } from "@/types/schema";
//
// Each domain can also be imported explicitly if you want to isolate imports:
//
//   import type { Revenue } from "@/types/schema/finance";

export * from "./business";
export * from "./finance";
export * from "./reviews";
export * from "./billing";
export * from "./observability";
export * from "./settlements";
export * from "./roi";

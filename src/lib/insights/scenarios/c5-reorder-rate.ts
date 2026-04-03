// C5: Low reorder rate (stub - needs customer-level data)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";
export const c5ReorderRate: InsightScenario = {
  id: "C5", name: "신규 재주문율 저조", category: "review",
  async evaluate(_ctx: ScenarioContext): Promise<InsightResult | null> { return null; },
};

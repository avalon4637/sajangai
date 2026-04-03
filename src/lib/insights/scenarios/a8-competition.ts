// A8: Competitor anomaly (stub - needs competitor data)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";
export const a8Competition: InsightScenario = {
  id: "A8", name: "경쟁 매장 이상", category: "revenue",
  async evaluate(_ctx: ScenarioContext): Promise<InsightResult | null> { return null; },
};

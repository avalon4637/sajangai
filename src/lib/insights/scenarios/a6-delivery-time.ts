// A6: Delivery time impact (stub - needs delivery time data)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const a6DeliveryTime: InsightScenario = {
  id: "A6",
  name: "배달시간→매출 영향",
  category: "revenue",
  async evaluate(_ctx: ScenarioContext): Promise<InsightResult | null> {
    // Requires delivery time metrics not yet collected
    return null;
  },
};

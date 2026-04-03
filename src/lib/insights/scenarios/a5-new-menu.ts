// A5: New menu effect analysis (stub - needs menu data)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const a5NewMenu: InsightScenario = {
  id: "A5",
  name: "신메뉴 효과 분석",
  category: "revenue",
  async evaluate(_ctx: ScenarioContext): Promise<InsightResult | null> {
    // Requires menu-level order data not yet available
    // Will be activated when menu tracking is implemented
    return null;
  },
};

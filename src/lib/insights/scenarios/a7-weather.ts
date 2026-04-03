// A7: Weather-linked prediction (stub - needs weather API)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";
export const a7Weather: InsightScenario = {
  id: "A7", name: "날씨 연동 예측", category: "revenue",
  async evaluate(_ctx: ScenarioContext): Promise<InsightResult | null> { return null; },
};

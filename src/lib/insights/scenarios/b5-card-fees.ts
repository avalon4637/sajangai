// B5: Card commission overcharge (stub - needs card fee data)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const b5CardFees: InsightScenario = {
  id: "B5",
  name: "카드 수수료 과다",
  category: "cost",
  async evaluate(_ctx: ScenarioContext): Promise<InsightResult | null> {
    // Requires detailed card fee data from Hyphen card sync
    return null;
  },
};

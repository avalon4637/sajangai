// B6: Settlement discrepancy (stub - needs settlement data)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const b6SettlementGap: InsightScenario = {
  id: "B6",
  name: "정산 누락 의심",
  category: "cost",
  async evaluate(_ctx: ScenarioContext): Promise<InsightResult | null> {
    // Requires order-level settlement reconciliation data
    return null;
  },
};

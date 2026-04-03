// D3: Menu profitability (stub - needs menu-level data)
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";
export const d3MenuProfit: InsightScenario = {
  id: "D3", name: "메뉴별 수익성", category: "strategy",
  async evaluate(_ctx: ScenarioContext): Promise<InsightResult | null> { return null; },
};

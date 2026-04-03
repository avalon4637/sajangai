// Insight Engine: runs all registered scenarios and stores results
import type { InsightResult, InsightScenario, ScenarioContext } from "./types";
import { loadScenarioContext, upsertInsight } from "./queries";

// Scenario registry — import and register each scenario here
import { a1RevenueReview } from "./scenarios/a1-revenue-review";
import { a2ChannelDrop } from "./scenarios/a2-channel-drop";
import { a3DayVariance } from "./scenarios/a3-day-variance";
import { a4OffSeason } from "./scenarios/a4-off-season";
import { a5NewMenu } from "./scenarios/a5-new-menu";
import { a6DeliveryTime } from "./scenarios/a6-delivery-time";
import { b1ChannelFees } from "./scenarios/b1-channel-fees";
import { b2FixedCostSpike } from "./scenarios/b2-fixed-cost-spike";
import { b3LaborRatio } from "./scenarios/b3-labor-ratio";
import { b4CostRatio } from "./scenarios/b4-cost-ratio";
import { b5CardFees } from "./scenarios/b5-card-fees";
import { b6SettlementGap } from "./scenarios/b6-settlement-gap";
import { b7SeasonalCost } from "./scenarios/b7-seasonal-cost";
import { c1RepeatKeywords } from "./scenarios/c1-repeat-keywords";
import { c2RatingDecline } from "./scenarios/c2-rating-decline";
import { a7Weather } from "./scenarios/a7-weather";
import { a8Competition } from "./scenarios/a8-competition";
import { c3PositiveReviews } from "./scenarios/c3-positive-reviews";
import { c4ChurnRisk } from "./scenarios/c4-churn-risk";
import { c5ReorderRate } from "./scenarios/c5-reorder-rate";
import { d1CashDepletion } from "./scenarios/d1-cash-depletion";
import { d2Breakeven } from "./scenarios/d2-breakeven";
import { d3MenuProfit } from "./scenarios/d3-menu-profit";
import { d4TaxSeason } from "./scenarios/d4-tax-season";
import { d5Expansion } from "./scenarios/d5-expansion";

const scenarios: InsightScenario[] = [
  // Category A: Revenue anomaly (8)
  a1RevenueReview, a2ChannelDrop, a3DayVariance, a4OffSeason, a5NewMenu, a6DeliveryTime, a7Weather, a8Competition,
  // Category B: Cost optimization (7)
  b1ChannelFees, b2FixedCostSpike, b3LaborRatio, b4CostRatio, b5CardFees, b6SettlementGap, b7SeasonalCost,
  // Category C: Review/customer (5)
  c1RepeatKeywords, c2RatingDecline, c3PositiveReviews, c4ChurnRisk, c5ReorderRate,
  // Category D: Strategy (5)
  d1CashDepletion, d2Breakeven, d3MenuProfit, d4TaxSeason, d5Expansion,
];

export interface EngineResult {
  businessId: string;
  generated: InsightResult[];
  errors: { scenarioId: string; error: string }[];
  durationMs: number;
}

/**
 * Evaluate all insight scenarios for a business.
 * Called from jeongjang morning routine or manual refresh.
 */
export async function evaluateInsights(
  businessId: string
): Promise<EngineResult> {
  const start = Date.now();
  const generated: InsightResult[] = [];
  const errors: EngineResult["errors"] = [];

  // Load context once, shared across all scenarios
  const ctx = await loadScenarioContext(businessId);

  // Minimum data check — skip if no revenue data
  if (ctx.revenues.length === 0) {
    return { businessId, generated, errors, durationMs: Date.now() - start };
  }

  // Run all scenarios in parallel
  const results = await Promise.allSettled(
    scenarios.map((s) => runScenario(s, ctx))
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const scenario = scenarios[i];

    if (result.status === "rejected") {
      errors.push({
        scenarioId: scenario.id,
        error: String(result.reason),
      });
      continue;
    }

    if (result.value !== null) {
      generated.push(result.value);
    }
  }

  // Store all generated insights
  await Promise.all(
    generated.map((insight) => upsertInsight(businessId, insight))
  );

  return {
    businessId,
    generated,
    errors,
    durationMs: Date.now() - start,
  };
}

async function runScenario(
  scenario: InsightScenario,
  ctx: ScenarioContext
): Promise<InsightResult | null> {
  try {
    return await scenario.evaluate(ctx);
  } catch (err) {
    throw new Error(
      `Scenario ${scenario.id} failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

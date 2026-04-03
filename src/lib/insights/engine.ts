// Insight Engine: runs all registered scenarios and stores results
import type { InsightResult, InsightScenario, ScenarioContext } from "./types";
import { loadScenarioContext, upsertInsight } from "./queries";

// Scenario registry — import and register each scenario here
import { a1RevenueReview } from "./scenarios/a1-revenue-review";
import { a2ChannelDrop } from "./scenarios/a2-channel-drop";
import { a3DayVariance } from "./scenarios/a3-day-variance";
import { b1ChannelFees } from "./scenarios/b1-channel-fees";
import { b2FixedCostSpike } from "./scenarios/b2-fixed-cost-spike";

const scenarios: InsightScenario[] = [
  a1RevenueReview,
  a2ChannelDrop,
  a3DayVariance,
  b1ChannelFees,
  b2FixedCostSpike,
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

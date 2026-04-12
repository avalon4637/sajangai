import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./queries", () => ({
  loadScenarioContext: vi.fn().mockResolvedValue({
    businessId: "test-biz",
    revenues: [
      { date: "2026-04-01", amount: 500000, channel: "baemin" },
      { date: "2026-04-02", amount: 450000, channel: "baemin" },
    ],
    expenses: [],
    fixedCosts: [],
    reviews: [],
  }),
  upsertInsight: vi.fn().mockResolvedValue(undefined),
  getRecentInsightsForDedup: vi.fn().mockResolvedValue([]),
}));

vi.mock("./history", () => ({
  getUserInsightHistory: vi.fn().mockResolvedValue({ dismissedScenarios: [], viewedScenarios: [], interactionCounts: {} }),
}));

vi.mock("./scoring", () => ({
  scoreInsights: vi.fn().mockImplementation((insights: unknown[]) =>
    (insights as { scenarioId: string }[]).map((i) => ({ insight: i, score: 1, shouldDisplay: true }))
  ),
}));

vi.mock("./dedup", () => ({
  deduplicateInsights: vi.fn().mockImplementation((generated: unknown[]) => generated),
}));

import { evaluateInsights } from "./engine";
import { upsertInsight } from "./queries";

describe("Insight Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs without crashing on minimal data", async () => {
    const result = await evaluateInsights("test-biz");

    expect(result.businessId).toBe("test-biz");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.generated)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("stores generated insights via upsertInsight", async () => {
    const result = await evaluateInsights("test-biz");
    expect(vi.mocked(upsertInsight)).toHaveBeenCalledTimes(result.generated.length);
  });

  it("skips review/cost scenarios when data is empty", async () => {
    const result = await evaluateInsights("test-biz");
    const reviewErrors = result.errors.filter((e) => e.scenarioId.startsWith("C"));
    expect(reviewErrors.length).toBe(0);
  });
});

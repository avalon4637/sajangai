import { describe, it, expect } from "vitest";
import type { ScenarioContext } from "../types";
import { a1RevenueReview } from "./a1-revenue-review";
import { a2ChannelDrop } from "./a2-channel-drop";
import { a3DayVariance } from "./a3-day-variance";
import { b1ChannelFees } from "./b1-channel-fees";
import { b2FixedCostSpike } from "./b2-fixed-cost-spike";

// Helper: generate revenue data for N days
function makeRevenues(
  days: number,
  baseAmount: number,
  channel = "baemin"
): ScenarioContext["revenues"] {
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      date: d.toISOString().split("T")[0],
      amount: baseAmount + (Math.random() - 0.5) * baseAmount * 0.1,
      channel,
    });
  }
  return result;
}

function makeReviews(
  count: number,
  rating: number,
  daysAgo: number
): ScenarioContext["reviews"] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo + i);
    return {
      date: d.toISOString().split("T")[0],
      rating,
      sentiment: rating >= 4 ? 0.8 : 0.2,
      keywords: rating <= 3 ? ["느림", "불친절"] : ["맛있음"],
      platform: "baemin",
      replyStatus: "none",
    };
  });
}

const emptyCtx: ScenarioContext = {
  businessId: "test-biz",
  revenues: [],
  expenses: [],
  fixedCosts: [],
  reviews: [],
};

// ============================================================
// A1: Revenue drop + review correlation
// ============================================================

describe("A1: Revenue + Review Correlation", () => {
  it("returns null when insufficient data", async () => {
    const result = await a1RevenueReview.evaluate(emptyCtx);
    expect(result).toBeNull();
  });

  it("returns null when revenue is stable", async () => {
    const ctx: ScenarioContext = {
      ...emptyCtx,
      revenues: makeRevenues(14, 500000),
      reviews: makeReviews(3, 2, 3),
    };
    const result = await a1RevenueReview.evaluate(ctx);
    // Stable revenue should not trigger even with bad reviews
    expect(result).toBeNull();
  });

  it("triggers when revenue drops 20%+ with negative review increase", async () => {
    const now = new Date();
    const thisWeek = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return { date: d.toISOString().split("T")[0], amount: 300000, channel: "baemin" };
    });
    const prevWeek = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - 7 - i);
      return { date: d.toISOString().split("T")[0], amount: 500000, channel: "baemin" };
    });

    const ctx: ScenarioContext = {
      ...emptyCtx,
      revenues: [...thisWeek, ...prevWeek],
      reviews: [
        ...makeReviews(4, 2, 3), // this week: 4 negative
        ...makeReviews(1, 2, 10), // prev week: 1 negative
      ],
    };

    const result = await a1RevenueReview.evaluate(ctx);
    expect(result).not.toBeNull();
    expect(result?.scenarioId).toBe("A1");
    expect(result?.severity).toMatch(/critical|warning/);
    expect(result?.action?.type).toBe("reply_reviews");
  });
});

// ============================================================
// A2: Single channel drop
// ============================================================

describe("A2: Single Channel Drop", () => {
  it("returns null with single channel", async () => {
    const ctx: ScenarioContext = {
      ...emptyCtx,
      revenues: makeRevenues(14, 500000, "baemin"),
    };
    const result = await a2ChannelDrop.evaluate(ctx);
    expect(result).toBeNull();
  });

  it("triggers when one channel drops while others stable", async () => {
    const now = new Date();
    const revenues = [];

    // Baemin: stable at 500k
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      revenues.push({ date: d.toISOString().split("T")[0], amount: 500000, channel: "baemin" });
    }

    // Coupang: drops from 500k to 150k (-70%)
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      revenues.push({ date: d.toISOString().split("T")[0], amount: 150000, channel: "coupangeats" });
    }
    for (let i = 7; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      revenues.push({ date: d.toISOString().split("T")[0], amount: 500000, channel: "coupangeats" });
    }

    const ctx: ScenarioContext = { ...emptyCtx, revenues };
    const result = await a2ChannelDrop.evaluate(ctx);
    expect(result).not.toBeNull();
    expect(result?.scenarioId).toBe("A2");
  });
});

// ============================================================
// A3: Day-of-week variance
// ============================================================

describe("A3: Day-of-Week Variance", () => {
  it("returns null with insufficient data", async () => {
    const ctx: ScenarioContext = {
      ...emptyCtx,
      revenues: makeRevenues(10, 500000),
    };
    const result = await a3DayVariance.evaluate(ctx);
    expect(result).toBeNull();
  });

  it("triggers when one day is consistently below 50%", async () => {
    const revenues = [];
    // 4 weeks of data, Monday (day 1) always low
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 7; day++) {
        const d = new Date();
        d.setDate(d.getDate() - week * 7 - day);
        const dayOfWeek = d.getDay();
        // Monday (1) gets 100k, others get 500k
        const amount = dayOfWeek === 1 ? 100000 : 500000;
        revenues.push({ date: d.toISOString().split("T")[0], amount, channel: "baemin" });
      }
    }

    const ctx: ScenarioContext = { ...emptyCtx, revenues };
    const result = await a3DayVariance.evaluate(ctx);
    expect(result).not.toBeNull();
    expect(result?.scenarioId).toBe("A3");
    expect(result?.severity).toBe("opportunity");
  });
});

// ============================================================
// B1: Channel fees
// ============================================================

describe("B1: Channel Fee Optimization", () => {
  it("returns null with single channel", async () => {
    const ctx: ScenarioContext = {
      ...emptyCtx,
      revenues: makeRevenues(7, 500000, "baemin"),
    };
    const result = await b1ChannelFees.evaluate(ctx);
    expect(result).toBeNull();
  });

  it("triggers when fee rate difference >= 3%", async () => {
    const revenues = [
      ...makeRevenues(7, 500000, "baemin"),
      ...makeRevenues(7, 500000, "yogiyo"),
    ];
    const ctx: ScenarioContext = { ...emptyCtx, revenues };
    const result = await b1ChannelFees.evaluate(ctx);
    // baemin 6.6% vs yogiyo 12.5% = 5.9%p difference
    expect(result).not.toBeNull();
    expect(result?.scenarioId).toBe("B1");
    expect(result?.category).toBe("cost");
  });
});

// ============================================================
// B2: Fixed cost spike
// ============================================================

describe("B2: Fixed Cost Spike", () => {
  it("returns null with insufficient data", async () => {
    const ctx: ScenarioContext = {
      ...emptyCtx,
      fixedCosts: [{ category: "임대료", amount: 1000000, month: "2026-03" }],
    };
    const result = await b2FixedCostSpike.evaluate(ctx);
    expect(result).toBeNull();
  });

  it("triggers when a category jumps 10%+", async () => {
    const ctx: ScenarioContext = {
      ...emptyCtx,
      fixedCosts: [
        { category: "임대료", amount: 1200000, month: "2026-04" },
        { category: "임대료", amount: 1000000, month: "2026-03" },
        { category: "관리비", amount: 200000, month: "2026-04" },
        { category: "관리비", amount: 200000, month: "2026-03" },
      ],
    };
    const result = await b2FixedCostSpike.evaluate(ctx);
    expect(result).not.toBeNull();
    expect(result?.scenarioId).toBe("B2");
    expect(result?.detection.title).toContain("임대료");
  });

  it("returns null when costs are stable", async () => {
    const ctx: ScenarioContext = {
      ...emptyCtx,
      fixedCosts: [
        { category: "임대료", amount: 1000000, month: "2026-04" },
        { category: "임대료", amount: 1000000, month: "2026-03" },
      ],
    };
    const result = await b2FixedCostSpike.evaluate(ctx);
    expect(result).toBeNull();
  });
});

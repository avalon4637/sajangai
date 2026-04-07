import { describe, it, expect, vi } from "vitest";

// Create a chainable mock that returns { data: [], error: null, count: 0 } for any query
function createChainMock() {
  const terminal = { data: [], error: null, count: 0 };
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") return undefined; // Not a thenable
      if (prop === "data") return terminal.data;
      if (prop === "error") return terminal.error;
      if (prop === "count") return terminal.count;
      // Return a function that returns another proxy (infinite chaining)
      return (..._args: unknown[]) => new Proxy(terminal, handler);
    },
  };
  return new Proxy(terminal, handler);
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => createChainMock(),
  }),
}));

import { calculateMonthlyRoi } from "./calculator";

describe("ROI Calculator", () => {
  it("returns zero ROI when no action data exists", async () => {
    const roi = await calculateMonthlyRoi("test-biz", "2026-04");

    expect(roi.period).toBe("2026-04");
    expect(roi.subscriptionCost).toBe(29700);
    expect(roi.totalValue).toBe(0);
    expect(roi.roiMultiple).toBe(0);
  });

  it("returns correct period", async () => {
    const roi = await calculateMonthlyRoi("test-biz", "2026-01");
    expect(roi.period).toBe("2026-01");
  });
});

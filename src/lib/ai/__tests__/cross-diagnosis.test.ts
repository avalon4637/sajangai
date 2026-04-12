// Phase 1.6 — Golden tests for cross-diagnosis.ts
//
// These tests pin the deterministic fallback behavior of
// analyzeRevenueReviewCross. The AI path is not tested here (that requires
// mocking callClaudeObject and belongs to Phase 2 integration tests).
//
// What these tests guard:
//   1. No-signal gate (returns null)
//   2. Severity thresholds in fallback diagnosis
//   3. Unreplied review → actionable step
//   4. Output schema invariants (confidence range, non-empty actions)

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fallbackCrossDiagnosis,
  analyzeRevenueReviewCross,
  type CrossDiagnosis,
} from "../cross-diagnosis";
import type { RevenueReviewCrossSnapshot } from "@/lib/insights/cross-query";

// Mock the Claude client so the AI path returns a controllable value.
// Tests that want the fallback force an error; tests that want the AI path
// stub a valid object.
vi.mock("../claude-client", () => ({
  callClaudeObject: vi.fn(),
}));
import { callClaudeObject } from "../claude-client";
const mockedCall = vi.mocked(callClaudeObject);

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeSnapshot(
  overrides: Partial<RevenueReviewCrossSnapshot> = {}
): RevenueReviewCrossSnapshot {
  return {
    businessId: "biz-1",
    weekRange: {
      start: "2026-04-04T00:00:00.000Z",
      end: "2026-04-11T00:00:00.000Z",
    },
    revenueThisWeek: 1_000_000,
    revenuePrevWeek: 1_200_000,
    revenueDeltaPct: -16.7,
    negativeReviews: [],
    unrepliedCount: 0,
    ...overrides,
  };
}

function makeNegativeReviews(
  n: number,
  content = "배달이 너무 늦어요"
): RevenueReviewCrossSnapshot["negativeReviews"] {
  return Array.from({ length: n }, (_, i) => ({
    id: `r-${i}`,
    platform: "baemin",
    rating: 2,
    content,
    reviewDate: "2026-04-10T12:00:00.000Z",
  }));
}

beforeEach(() => {
  mockedCall.mockReset();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("cross-diagnosis fallback (golden)", () => {
  it("1. No-signal gate: returns null when delta < 10% and 0 negative reviews", async () => {
    const snapshot = makeSnapshot({
      revenueThisWeek: 1_000_000,
      revenuePrevWeek: 1_050_000,
      revenueDeltaPct: -4.8,
      negativeReviews: [],
      unrepliedCount: 0,
    });

    const result = await analyzeRevenueReviewCross(snapshot);
    expect(result).toBeNull();
    // AI must not be called on a null-gate
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it("2. Fallback severity = info on mild drop (10-14%), no reviews", () => {
    const snapshot = makeSnapshot({
      revenueDeltaPct: -12,
      negativeReviews: [],
      unrepliedCount: 0,
    });

    const result = fallbackCrossDiagnosis(snapshot);
    expect(result.severity).toBe("info");
    expect(result.source).toBe("fallback");
    expect(result.actionableSteps.length).toBeGreaterThanOrEqual(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("3. Fallback severity = warning on 15-24% drop, unreplied reviews included in action", () => {
    const snapshot = makeSnapshot({
      revenueDeltaPct: -18,
      negativeReviews: makeNegativeReviews(3),
      unrepliedCount: 2,
    });

    const result = fallbackCrossDiagnosis(snapshot);
    expect(result.severity).toBe("warning");
    expect(result.actionableSteps[0].label).toContain("2");
    expect(result.actionableSteps[0].urgency).toBe("today");
    expect(result.rootCause).toContain("부정 리뷰 3건");
  });

  it("4. Fallback severity = critical on 25%+ drop", () => {
    const snapshot = makeSnapshot({
      revenueDeltaPct: -30,
      negativeReviews: makeNegativeReviews(5),
      unrepliedCount: 5,
    });

    const result = fallbackCrossDiagnosis(snapshot);
    expect(result.severity).toBe("critical");
    expect(result.expectedImpact).toMatch(/%|원|건/);
  });

  it("5. AI failure path falls back without throwing", async () => {
    mockedCall.mockRejectedValueOnce(new Error("rate limit exceeded"));

    const snapshot = makeSnapshot({
      revenueDeltaPct: -20,
      negativeReviews: makeNegativeReviews(2),
      unrepliedCount: 1,
    });

    const result = await analyzeRevenueReviewCross(snapshot);
    expect(result).not.toBeNull();
    expect(result?.source).toBe("fallback");
    expect(result?.severity).toBe("warning");
    expect(mockedCall).toHaveBeenCalledOnce();
  });

  it("6. AI success path returns source=ai with confidence boosted from delta/reviews", async () => {
    const aiResponse: Omit<CrossDiagnosis, "source" | "confidence"> = {
      rootCause: "배달 지연이 매출 하락의 주범이야",
      severity: "warning",
      topComplaints: ["배달 지연", "음식이 식음"],
      actionableSteps: [
        {
          label: "배달 파트너 점검",
          reason: "최근 7일 리뷰 4건 모두 배달 지연 언급",
          urgency: "today",
        },
      ],
      expectedImpact: "배달 시간 단축 시 주문 재개 약 12% 기대",
    };
    mockedCall.mockResolvedValueOnce(aiResponse);

    const snapshot = makeSnapshot({
      revenueDeltaPct: -22,
      negativeReviews: makeNegativeReviews(4),
      unrepliedCount: 0,
    });

    const result = await analyzeRevenueReviewCross(snapshot);
    expect(result).not.toBeNull();
    expect(result?.source).toBe("ai");
    expect(result?.rootCause).toContain("배달 지연");
    expect(result?.topComplaints).toHaveLength(2);
    expect(result?.confidence).toBeGreaterThan(0.5);
    expect(result?.confidence).toBeLessThanOrEqual(0.9);
  });

  it("7. No-signal gate with positive revenue movement also returns null", async () => {
    const snapshot = makeSnapshot({
      revenueThisWeek: 1_100_000,
      revenuePrevWeek: 1_050_000,
      revenueDeltaPct: 4.8,
      negativeReviews: [],
      unrepliedCount: 0,
    });

    const result = await analyzeRevenueReviewCross(snapshot);
    expect(result).toBeNull();
  });
});

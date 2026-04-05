import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation for all client components
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/analysis",
}));

// ---------------------------------------------------------------------------
// SurvivalGauge
// ---------------------------------------------------------------------------
import { SurvivalGauge } from "../seri/survival-gauge";
import type { SurvivalScoreResult } from "@/lib/kpi/survival-score";

const baseSurvivalScore: SurvivalScoreResult = {
  total: 72,
  grade: "B" as const,
  factors: {
    profitability: { score: 18, max: 25 },
    fixedCostStability: { score: 16, max: 25 },
    laborAppropriateness: { score: 14, max: 20 },
    cashLiquidity: { score: 12, max: 15 },
    growth: { score: 12, max: 15 },
  },
};

describe("SurvivalGauge", () => {
  it("renders the total score", () => {
    render(<SurvivalGauge score={baseSurvivalScore} />);
    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("renders the grade badge", () => {
    render(<SurvivalGauge score={baseSurvivalScore} />);
    expect(screen.getByText(/B등급/)).toBeInTheDocument();
  });

  it("renders all 5 factor bars", () => {
    render(<SurvivalGauge score={baseSurvivalScore} />);
    expect(screen.getByText("수익성")).toBeInTheDocument();
    expect(screen.getByText("고정비안정")).toBeInTheDocument();
    expect(screen.getByText("인건비적정")).toBeInTheDocument();
    expect(screen.getByText("현금유동성")).toBeInTheDocument();
    expect(screen.getByText("성장성")).toBeInTheDocument();
  });

  it("shows empty state when score is null", () => {
    render(<SurvivalGauge score={null} />);
    expect(screen.getByText("데이터가 부족합니다")).toBeInTheDocument();
  });

  it("shows delta when previousScore is provided", () => {
    render(<SurvivalGauge score={baseSurvivalScore} previousScore={65} />);
    expect(screen.getByText(/\+7점/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PnlSummaryCards
// ---------------------------------------------------------------------------
import { PnlSummaryCards } from "../seri/pnl-summary-cards";
import type { MonthlyAnalysisSummary } from "@/lib/queries/daily-revenue";

const mockCurrent: MonthlyAnalysisSummary = {
  totalRevenue: 45_000_000,
  avgDailyRevenue: 1_500_000,
  daysWithRevenue: 30,
  channelBreakdown: [
    { channel: "배달의민족", amount: 20_000_000, count: 800 },
    { channel: "카드매출", amount: 25_000_000, count: 500 },
  ],
  dailyRevenues: [],
};

const mockPrevious: MonthlyAnalysisSummary = {
  totalRevenue: 40_000_000,
  avgDailyRevenue: 1_333_000,
  daysWithRevenue: 30,
  channelBreakdown: [],
  dailyRevenues: [],
};

describe("PnlSummaryCards", () => {
  it("renders 4 summary cards", () => {
    render(<PnlSummaryCards current={mockCurrent} previous={null} />);
    expect(screen.getByText("총 매출")).toBeInTheDocument();
    expect(screen.getByText("순이익")).toBeInTheDocument();
    expect(screen.getByText("현금흐름")).toBeInTheDocument();
    expect(screen.getByText("일평균 매출")).toBeInTheDocument();
  });

  it("formats revenue in Korean units (man)", () => {
    render(<PnlSummaryCards current={mockCurrent} previous={null} />);
    // 45,000,000 -> 4,500만
    expect(screen.getByText("4,500만")).toBeInTheDocument();
  });

  it("shows delta badge when previous data is provided", () => {
    render(<PnlSummaryCards current={mockCurrent} previous={mockPrevious} />);
    // Revenue change: (45M - 40M) / 40M = 12.5% -> rounds to 13%
    // Multiple delta badges may appear (revenue + daily avg)
    const badges = screen.getAllByText("+13%");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// CostBreakdown
// ---------------------------------------------------------------------------
import { CostBreakdown } from "../seri/cost-breakdown";
import type { CostCategoryData } from "../seri/cost-breakdown";

const mockCategories: CostCategoryData[] = [
  {
    majorCategory: "인건비",
    totalAmount: 5_000_000,
    percentage: 50,
    delta: 5,
    subCategories: [
      { name: "직원급여", amount: 4_000_000, percentage: 40, delta: 3 },
      { name: "아르바이트", amount: 1_000_000, percentage: 10, delta: 10 },
    ],
  },
  {
    majorCategory: "임대료",
    totalAmount: 3_000_000,
    percentage: 30,
    delta: 0,
    subCategories: [],
  },
];

describe("CostBreakdown", () => {
  it("renders category names", () => {
    render(<CostBreakdown categories={mockCategories} totalExpense={10_000_000} />);
    expect(screen.getByText("인건비")).toBeInTheDocument();
    expect(screen.getByText("임대료")).toBeInTheDocument();
  });

  it("shows empty state when no categories", () => {
    render(<CostBreakdown categories={[]} totalExpense={0} />);
    expect(screen.getByText("비용 데이터가 없습니다")).toBeInTheDocument();
  });

  it("renders total expense header", () => {
    render(<CostBreakdown categories={mockCategories} totalExpense={10_000_000} />);
    expect(screen.getByText("비용 구성")).toBeInTheDocument();
    expect(screen.getByText(/총 1,000만원/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// CashflowForecast
// ---------------------------------------------------------------------------
import { CashflowForecast } from "../seri/cashflow-forecast";
import type { CashflowData } from "../seri/cashflow-forecast";

const mockCashflow: CashflowData = {
  currentCash: 15_000_000,
  monthlyIncome: 45_000_000,
  monthlyBurn: 38_000_000,
  netMonthlyCashflow: 7_000_000,
  scenarios: {
    baseline: { day30: 22_000_000, day60: 29_000_000, day90: 36_000_000 },
    pessimistic: { day30: 18_000_000, day60: 21_000_000, day90: 24_000_000 },
    optimistic: { day30: 26_000_000, day60: 37_000_000, day90: 48_000_000 },
  },
  isNegativeAt90Days: false,
  dataMonths: 4,
};

const negativeCashflow: CashflowData = {
  ...mockCashflow,
  isNegativeAt90Days: true,
  scenarios: {
    ...mockCashflow.scenarios,
    baseline: { day30: 10_000_000, day60: 3_000_000, day90: -5_000_000 },
  },
};

describe("CashflowForecast", () => {
  it("renders with data and shows current cash", () => {
    render(<CashflowForecast cashflow={mockCashflow} />);
    expect(screen.getByText("현금흐름 예측")).toBeInTheDocument();
    expect(screen.getByText(/1,500만원/)).toBeInTheDocument();
  });

  it("renders 30/60/90 day projections", () => {
    render(<CashflowForecast cashflow={mockCashflow} />);
    expect(screen.getByText("30일 후")).toBeInTheDocument();
    expect(screen.getByText("60일 후")).toBeInTheDocument();
    expect(screen.getByText("90일 후")).toBeInTheDocument();
  });

  it("shows warning badge when negative at 90 days", () => {
    render(<CashflowForecast cashflow={negativeCashflow} />);
    expect(screen.getByText("주의")).toBeInTheDocument();
  });

  it("shows empty state when cashflow is null", () => {
    render(<CashflowForecast cashflow={null} />);
    expect(screen.getByText("데이터가 부족합니다")).toBeInTheDocument();
  });
});

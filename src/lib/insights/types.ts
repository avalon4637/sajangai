// Insight Engine type system
// Each insight follows: Detection → Cause → Solution → Action → Tracking

export type InsightCategory = "revenue" | "cost" | "review" | "strategy";
export type InsightSeverity = "critical" | "warning" | "info" | "opportunity";
export type InsightStatus = "new" | "seen" | "acted" | "dismissed" | "expired";
export type InsightActionType =
  | "reply_reviews"
  | "send_message"
  | "view_detail"
  | "run_simulation";

export interface InsightDetection {
  title: string; // "매출이 전주 대비 18% 하락했어요"
  metric: string; // "-18%"
  comparedTo: string; // "전주 평균"
}

export interface InsightCause {
  summary: string; // "부정 리뷰 3건 증가와 동시에 발생"
  signals: string[]; // ["리뷰 평점 3.2→2.8", ...]
  confidence: number; // 0.0~1.0
}

export interface InsightSolution {
  recommendation: string; // "미답변 리뷰 5건에 답글을 등록하세요"
  expectedEffect: string; // "평점 회복 시 주문 약 12% 증가 예상"
  estimatedValue?: number; // estimated KRW amount
}

export interface InsightAction {
  type: InsightActionType;
  label: string; // "답글 등록하기"
  payload: Record<string, unknown>;
}

export interface InsightResult {
  scenarioId: string;
  category: InsightCategory;
  severity: InsightSeverity;
  detection: InsightDetection;
  cause: InsightCause;
  solution: InsightSolution;
  action?: InsightAction;
}

// Database row shape
export interface InsightEvent extends InsightResult {
  id: string;
  businessId: string;
  status: InsightStatus;
  createdAt: string;
  expiresAt: string;
  actedAt: string | null;
}

// Scenario context passed to each scenario's evaluate function
export interface ScenarioContext {
  businessId: string;
  // Revenue data (last 4 weeks daily)
  revenues: {
    date: string;
    amount: number;
    channel: string;
    fees?: number;
  }[];
  // Expense data
  expenses: {
    date: string;
    amount: number;
    category: string;
    isFixed: boolean;
  }[];
  // Fixed costs (current + previous month)
  fixedCosts: {
    category: string;
    amount: number;
    month: string; // YYYY-MM
  }[];
  // Review data
  reviews: {
    date: string;
    rating: number;
    sentiment: number;
    keywords: string[];
    platform: string;
    replyStatus: string;
  }[];
}

// Interface that each scenario must implement
export interface InsightScenario {
  id: string;
  name: string;
  category: InsightCategory;
  evaluate(ctx: ScenarioContext): Promise<InsightResult | null>;
}

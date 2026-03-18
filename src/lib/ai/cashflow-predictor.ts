// Seri S2 Feature: 14-day cash flow projection
// Estimates incoming card settlements and outgoing fixed expense payments

import { createClient } from "@/lib/supabase/server";
import { getLastDayOfMonth } from "@/lib/utils";

// Card settlement delay in business days by issuing company
// D+N means revenue received N days after transaction
const CARD_SETTLEMENT_DAYS: Record<string, number> = {
  shinhan: 2,  // 신한카드
  kb: 2,       // KB국민카드
  woori: 2,    // 우리카드
  hana: 2,     // 하나카드
  samsung: 3,  // 삼성카드
  lotte: 3,    // 롯데카드
  hyundai: 2,  // 현대카드
  bc: 2,       // BC카드
  nh: 3,       // NH농협카드
  default: 2,  // Fallback average
};

// Minimum cash balance alert threshold (KRW)
const DEFAULT_ALERT_THRESHOLD = 1_000_000; // 1,000,000 KRW

export type CashFlowRiskLevel = "safe" | "caution" | "danger";

export interface DailyCashFlow {
  date: string;           // ISO date YYYY-MM-DD
  expectedIncome: number; // Expected card settlement + delivery payouts
  expectedExpense: number; // Expected fixed cost payments due
  projectedBalance: number; // Cumulative balance estimate
  riskLevel: CashFlowRiskLevel;
  notes: string[];        // Human-readable annotations
}

export interface CashFlowForecast {
  projectionDays: number;
  startDate: string;
  endDate: string;
  currentBalance: number; // Assumed starting balance (0 if unknown)
  dailyProjections: DailyCashFlow[];
  alertDays: string[];    // Dates where balance drops below threshold
  overallRisk: CashFlowRiskLevel;
  summary: {
    totalExpectedIncome: number;
    totalExpectedExpense: number;
    lowestProjectedBalance: number;
    alertThreshold: number;
  };
}

/**
 * Add business days to a date (skipping weekends).
 * Korean holidays are not accounted for in this simplified version.
 */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * Format a Date object to YYYY-MM-DD string.
 */
function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get settlement delay for a given channel.
 * Delivery apps typically pay out within 1-3 business days weekly.
 */
function getSettlementDelay(channel: string | null): number {
  if (!channel) return CARD_SETTLEMENT_DAYS.default;

  const normalized = channel.toLowerCase();
  if (normalized.includes("shinhan") || normalized.includes("신한")) return CARD_SETTLEMENT_DAYS.shinhan;
  if (normalized.includes("kb") || normalized.includes("국민")) return CARD_SETTLEMENT_DAYS.kb;
  if (normalized.includes("woori") || normalized.includes("우리")) return CARD_SETTLEMENT_DAYS.woori;
  if (normalized.includes("hana") || normalized.includes("하나")) return CARD_SETTLEMENT_DAYS.hana;
  if (normalized.includes("samsung") || normalized.includes("삼성")) return CARD_SETTLEMENT_DAYS.samsung;
  if (normalized.includes("lotte") || normalized.includes("롯데")) return CARD_SETTLEMENT_DAYS.lotte;
  if (normalized.includes("hyundai") || normalized.includes("현대")) return CARD_SETTLEMENT_DAYS.hyundai;
  if (normalized.includes("bc")) return CARD_SETTLEMENT_DAYS.bc;
  if (normalized.includes("nh") || normalized.includes("농협")) return CARD_SETTLEMENT_DAYS.nh;
  // Delivery platforms: weekly payout (treat as 3-5 days average)
  if (normalized.includes("baemin") || normalized.includes("배민")) return 3;
  if (normalized.includes("coupang") || normalized.includes("쿠팡")) return 3;
  if (normalized.includes("yogiyo") || normalized.includes("요기요")) return 4;

  return CARD_SETTLEMENT_DAYS.default;
}

/**
 * Project 14-day cash flow for a business.
 * Uses recent revenue data to estimate incoming settlements and fixed_costs for outgoing.
 *
 * @param businessId - UUID of the business
 * @param days - Number of days to project (default 14)
 * @param alertThreshold - Minimum balance threshold for risk alerts
 * @returns Detailed cash flow forecast with daily projections
 */
export async function predictCashFlow(
  businessId: string,
  days = 14,
  alertThreshold = DEFAULT_ALERT_THRESHOLD
): Promise<CashFlowForecast> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch revenues from the last 14 days to estimate upcoming settlements
  const past14Start = new Date(today);
  past14Start.setDate(past14Start.getDate() - 14);

  const { data: recentRevenues, error: revError } = await supabase
    .from("revenues")
    .select("date, amount, channel")
    .eq("business_id", businessId)
    .gte("date", toDateString(past14Start))
    .lte("date", toDateString(today))
    .order("date", { ascending: true });

  if (revError) {
    throw new Error(`최근 매출 데이터 조회 실패: ${revError.message}`);
  }

  // Fetch active fixed costs (those without end_date or end_date in future)
  const { data: fixedCosts, error: fcError } = await supabase
    .from("fixed_costs")
    .select("category, amount, is_labor, start_date, end_date")
    .eq("business_id", businessId);

  if (fcError) {
    throw new Error(`고정비 데이터 조회 실패: ${fcError.message}`);
  }

  // Build a map of settlement income by expected settlement date
  const incomeByDate = new Map<string, number>();
  for (const rev of recentRevenues ?? []) {
    const revDate = new Date(rev.date);
    const settlementDelay = getSettlementDelay(rev.channel);
    const settlementDate = addBusinessDays(revDate, settlementDelay);
    const settlementStr = toDateString(settlementDate);

    // Only count if settlement falls within our projection window
    const projectionEnd = new Date(today);
    projectionEnd.setDate(projectionEnd.getDate() + days);
    if (settlementDate >= today && settlementDate <= projectionEnd) {
      incomeByDate.set(
        settlementStr,
        (incomeByDate.get(settlementStr) ?? 0) + rev.amount
      );
    }
  }

  // Build expense calendar from fixed_costs
  // Assume: labor (급여) paid on 25th of month, rent on 1st, others spread evenly
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthDate = new Date(today);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextYearMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const expenseByDate = new Map<string, { amount: number; notes: string[] }>();

  const activeFc = (fixedCosts ?? []).filter((fc) => {
    const projectionEnd = new Date(today);
    projectionEnd.setDate(projectionEnd.getDate() + days);
    const startOk = !fc.start_date || fc.start_date <= toDateString(projectionEnd);
    const endOk = !fc.end_date || fc.end_date >= toDateString(today);
    return startOk && endOk;
  });

  for (const fc of activeFc) {
    const paymentDates: string[] = [];

    if (fc.is_labor) {
      // Labor costs: pay on 25th
      const payDay25Current = `${currentYearMonth}-25`;
      const payDay25Next = `${nextYearMonth}-25`;
      if (new Date(payDay25Current) >= today) paymentDates.push(payDay25Current);
      if (new Date(payDay25Next) >= today) paymentDates.push(payDay25Next);
    } else if (
      fc.category.includes("임대") ||
      fc.category.includes("rent") ||
      fc.category.includes("월세")
    ) {
      // Rent: pay on 1st
      const rentDay1Next = `${nextYearMonth}-01`;
      if (new Date(rentDay1Next) >= today) paymentDates.push(rentDay1Next);
    } else {
      // Other fixed costs: spread over 10th of month
      const day10Current = `${currentYearMonth}-10`;
      const day10Next = `${nextYearMonth}-10`;
      if (new Date(day10Current) >= today) paymentDates.push(day10Current);
      if (new Date(day10Next) >= today) paymentDates.push(day10Next);
    }

    for (const payDate of paymentDates) {
      const existing = expenseByDate.get(payDate);
      if (existing) {
        existing.amount += fc.amount;
        existing.notes.push(fc.category);
      } else {
        expenseByDate.set(payDate, { amount: fc.amount, notes: [fc.category] });
      }
    }
  }

  // Build daily projections for next N days
  let runningBalance = 0; // Start at 0 (actual balance unknown without bank integration)
  const dailyProjections: DailyCashFlow[] = [];
  const alertDays: string[] = [];

  for (let i = 0; i < days; i++) {
    const projDate = new Date(today);
    projDate.setDate(projDate.getDate() + i);
    const dateStr = toDateString(projDate);

    const income = incomeByDate.get(dateStr) ?? 0;
    const expenseData = expenseByDate.get(dateStr);
    const expense = expenseData?.amount ?? 0;
    const notes: string[] = [];

    if (income > 0) {
      notes.push(`카드/배달 정산 +${income.toLocaleString()}원`);
    }
    if (expenseData?.notes.length) {
      notes.push(`지출 예정: ${expenseData.notes.join(", ")}`);
    }

    runningBalance += income - expense;

    let riskLevel: CashFlowRiskLevel = "safe";
    if (runningBalance < alertThreshold) {
      riskLevel = "danger";
      alertDays.push(dateStr);
    } else if (runningBalance < alertThreshold * 2) {
      riskLevel = "caution";
    }

    dailyProjections.push({
      date: dateStr,
      expectedIncome: income,
      expectedExpense: expense,
      projectedBalance: runningBalance,
      riskLevel,
      notes,
    });
  }

  const totalExpectedIncome = dailyProjections.reduce((s, d) => s + d.expectedIncome, 0);
  const totalExpectedExpense = dailyProjections.reduce((s, d) => s + d.expectedExpense, 0);
  const lowestProjectedBalance = Math.min(...dailyProjections.map((d) => d.projectedBalance));

  let overallRisk: CashFlowRiskLevel = "safe";
  if (alertDays.length > 0) {
    overallRisk = "danger";
  } else if (dailyProjections.some((d) => d.riskLevel === "caution")) {
    overallRisk = "caution";
  }

  return {
    projectionDays: days,
    startDate: toDateString(today),
    endDate: toDateString(dailyProjections[dailyProjections.length - 1] ? new Date(dailyProjections[dailyProjections.length - 1].date) : today),
    currentBalance: 0,
    dailyProjections,
    alertDays: [...new Set(alertDays)], // deduplicate
    overallRisk,
    summary: {
      totalExpectedIncome,
      totalExpectedExpense,
      lowestProjectedBalance,
      alertThreshold,
    },
  };
}

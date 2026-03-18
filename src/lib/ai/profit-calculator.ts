// Seri S1 Feature: Real profit/loss calculator with delivery commissions and card fees
// Calculates true P&L by deducting platform fees and card processing costs

import { createClient } from "@/lib/supabase/server";
import { getLastDayOfMonth } from "@/lib/utils";

// Delivery platform commission rates (approximate industry averages as of 2024)
const DELIVERY_COMMISSION_RATES: Record<string, number> = {
  baemin1: 0.068,     // Baemin1 (plus 10% VAT = ~7.48%)
  baemin: 0.020,      // Baemin store delivery
  coupangeats: 0.098, // Coupang Eats
  yogiyo: 0.125,      // Yogiyo
  // Generic fallback
  delivery: 0.068,
};

// Card processing fee rates by card company (approximate)
// Average weighted across card types ~2.0-3.5%
const CARD_FEE_RATE = 0.025; // 2.5% average blended rate

export interface ChannelProfitBreakdown {
  channel: string;
  grossRevenue: number;
  fees: number;
  feeRate: number;
  netRevenue: number;
  marginPercent: number;
}

export interface RealProfitResult {
  // Revenue metrics
  grossRevenue: number;
  deliveryCommissions: number;
  cardFees: number;
  netRevenue: number;
  // Cost metrics
  variableCosts: number;
  fixedCosts: number;
  laborCosts: number;
  totalCosts: number;
  // Profit metrics
  netProfit: number;
  profitMargin: number;
  // Channel breakdown
  channelBreakdown: ChannelProfitBreakdown[];
}

/**
 * Determines the commission rate for a given revenue channel name.
 * Normalizes channel names to match known delivery platforms.
 */
function getCommissionRate(channel: string | null): number {
  if (!channel) return 0;

  const normalized = channel.toLowerCase().replace(/\s+/g, "");

  if (normalized.includes("baemin1") || normalized.includes("배민1")) {
    return DELIVERY_COMMISSION_RATES.baemin1;
  }
  if (normalized.includes("baemin") || normalized.includes("배달의민족") || normalized.includes("배민")) {
    return DELIVERY_COMMISSION_RATES.baemin;
  }
  if (normalized.includes("coupang") || normalized.includes("쿠팡")) {
    return DELIVERY_COMMISSION_RATES.coupangeats;
  }
  if (normalized.includes("yogiyo") || normalized.includes("요기요")) {
    return DELIVERY_COMMISSION_RATES.yogiyo;
  }
  if (normalized.includes("delivery") || normalized.includes("배달")) {
    return DELIVERY_COMMISSION_RATES.delivery;
  }
  // Card sales, offline, etc. — apply card fee only
  if (normalized.includes("card") || normalized.includes("카드")) {
    return CARD_FEE_RATE;
  }

  return 0;
}

/**
 * Calculate real profit and loss for a business in a given month.
 * Deducts delivery commissions, card fees, variable costs, and fixed costs.
 *
 * @param businessId - UUID of the business
 * @param yearMonth - Month in YYYY-MM format
 * @returns Detailed P&L breakdown including fees and cost structure
 */
export async function calculateRealProfit(
  businessId: string,
  yearMonth: string
): Promise<RealProfitResult> {
  const supabase = await createClient();
  const monthStart = `${yearMonth}-01`;
  const monthEnd = getLastDayOfMonth(yearMonth);

  // Fetch all revenues for the month
  const { data: revenues, error: revError } = await supabase
    .from("revenues")
    .select("amount, channel")
    .eq("business_id", businessId)
    .gte("date", monthStart)
    .lte("date", monthEnd);

  if (revError) {
    throw new Error(`매출 데이터 조회 실패: ${revError.message}`);
  }

  // Fetch variable expenses
  const { data: variableExpenses, error: varError } = await supabase
    .from("expenses")
    .select("amount")
    .eq("business_id", businessId)
    .eq("type", "variable")
    .gte("date", monthStart)
    .lte("date", monthEnd);

  if (varError) {
    throw new Error(`변동비 조회 실패: ${varError.message}`);
  }

  // Fetch all fixed costs (active in this month)
  const { data: allFixedCosts, error: fcError } = await supabase
    .from("fixed_costs")
    .select("amount, is_labor, start_date, end_date")
    .eq("business_id", businessId);

  if (fcError) {
    throw new Error(`고정비 조회 실패: ${fcError.message}`);
  }

  // Filter active fixed costs for this month
  const activeFixedCosts = (allFixedCosts ?? []).filter((r) => {
    const startOk = !r.start_date || r.start_date <= monthEnd;
    const endOk = !r.end_date || r.end_date >= monthStart;
    return startOk && endOk;
  });

  // Build channel breakdown with fee deduction
  const channelMap = new Map<string, { gross: number; fees: number }>();

  for (const row of revenues ?? []) {
    const channel = row.channel ?? "기타";
    const commissionRate = getCommissionRate(row.channel);
    const fees = Math.round(row.amount * commissionRate);

    const existing = channelMap.get(channel);
    if (existing) {
      existing.gross += row.amount;
      existing.fees += fees;
    } else {
      channelMap.set(channel, { gross: row.amount, fees });
    }
  }

  // Compute channel breakdown array
  const channelBreakdown: ChannelProfitBreakdown[] = Array.from(channelMap.entries())
    .map(([channel, data]) => {
      const netRevenue = data.gross - data.fees;
      const feeRate = data.gross > 0 ? (data.fees / data.gross) * 100 : 0;
      const marginPercent = data.gross > 0 ? (netRevenue / data.gross) * 100 : 0;
      return {
        channel,
        grossRevenue: data.gross,
        fees: data.fees,
        feeRate: Math.round(feeRate * 10) / 10,
        netRevenue,
        marginPercent: Math.round(marginPercent * 10) / 10,
      };
    })
    .sort((a, b) => b.grossRevenue - a.grossRevenue);

  // Aggregate totals
  const grossRevenue = revenues?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
  const totalFees = channelBreakdown.reduce((sum, c) => sum + c.fees, 0);

  // Separate delivery commissions from card fees (approximation)
  const deliveryChannels = channelBreakdown.filter((c) =>
    ["baemin", "coupang", "yogiyo", "배달", "delivery"].some((k) =>
      c.channel.toLowerCase().includes(k)
    )
  );
  const deliveryCommissions = deliveryChannels.reduce((sum, c) => sum + c.fees, 0);
  const cardFees = totalFees - deliveryCommissions;

  const netRevenue = grossRevenue - totalFees;

  const variableCosts = variableExpenses?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
  const laborCosts = activeFixedCosts
    .filter((r) => r.is_labor)
    .reduce((sum, r) => sum + r.amount, 0);
  const nonLaborFixedCosts = activeFixedCosts
    .filter((r) => !r.is_labor)
    .reduce((sum, r) => sum + r.amount, 0);
  const fixedCosts = nonLaborFixedCosts;

  const totalCosts = variableCosts + fixedCosts + laborCosts;
  const netProfit = netRevenue - totalCosts;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 1000) / 10 : 0;

  return {
    grossRevenue,
    deliveryCommissions,
    cardFees,
    netRevenue,
    variableCosts,
    fixedCosts,
    laborCosts,
    totalCosts,
    netProfit,
    profitMargin,
    channelBreakdown,
  };
}

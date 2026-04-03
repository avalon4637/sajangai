// Seri S3 Feature: Weekly cost ratio anomaly detection
// Compares current week cost ratio vs 4-week moving average and diagnoses causes

import { createClient } from "@/lib/supabase/server";

// Alert threshold: +3 percentage points above 4-week average triggers anomaly
const ANOMALY_THRESHOLD_PP = 3.0;

export type CostAnomalyCause =
  | "supplier_price_increase"  // 매입 단가 상승
  | "waste_increase"           // 폐기/손실 증가
  | "revenue_decline"          // 매출 감소로 비율 상승
  | "seasonal"                 // 계절적 요인
  | "normal_variation";        // 정상 범위 변동

export interface WeeklySnapshot {
  weekStart: string;
  weekEnd: string;
  revenue: number;
  expenses: number;
  costRatio: number; // expenses / revenue * 100
}

export interface CostAnomalyResult {
  currentWeek: WeeklySnapshot;
  previousWeeks: WeeklySnapshot[]; // Last 4 weeks
  currentRatio: number;
  averageRatio: number;   // 4-week moving average
  deviation: number;      // currentRatio - averageRatio (in percentage points)
  isAnomaly: boolean;     // true if deviation >= threshold
  diagnosis: CostAnomalyCause;
  diagnosisLabel: string; // Korean label for the cause
  recommendations: string[];
}

/**
 * Get the start and end dates of a week (Mon–Sun) offset by N weeks from today.
 * weekOffset = 0 means current week, -1 means last week, etc.
 */
function getWeekRange(weekOffset: number): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get Monday of current week
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday + weekOffset * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: monday, end: sunday };
}

/**
 * Format a Date object to YYYY-MM-DD string.
 */
function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Determine the most likely cause of a cost anomaly.
 * Uses heuristics based on revenue trend vs expense trend.
 */
function diagnoseCause(
  current: WeeklySnapshot,
  previousWeeks: WeeklySnapshot[]
): { cause: CostAnomalyCause; label: string; recommendations: string[] } {
  if (previousWeeks.length === 0) {
    return {
      cause: "normal_variation",
      label: "정상 범위 변동",
      recommendations: ["더 많은 데이터가 쌓이면 더 정확한 분석이 가능합니다."],
    };
  }

  const avgRevenue =
    previousWeeks.reduce((s, w) => s + w.revenue, 0) / previousWeeks.length;
  const avgExpenses =
    previousWeeks.reduce((s, w) => s + w.expenses, 0) / previousWeeks.length;

  const revenueTrend = avgRevenue > 0 ? (current.revenue - avgRevenue) / avgRevenue : 0;
  const expenseTrend = avgExpenses > 0 ? (current.expenses - avgExpenses) / avgExpenses : 0;

  // Revenue declined significantly while expenses stayed similar
  if (revenueTrend < -0.15 && expenseTrend > -0.05) {
    return {
      cause: "revenue_decline",
      label: "매출 감소로 비율 상승",
      recommendations: [
        "이번 주 매출이 평균 대비 크게 감소했습니다. 고정비 부담이 상대적으로 커졌습니다.",
        "프로모션 또는 할인 이벤트로 매출 회복을 검토하세요.",
        "단기적으로 변동비 지출을 최소화하세요.",
      ],
    };
  }

  // Expenses increased while revenue was stable
  if (expenseTrend > 0.15 && revenueTrend > -0.05) {
    // Check if it's likely food cost increase or waste
    // Without detailed category data, we approximate:
    // Large single expense spike = supplier price increase
    // Moderate diffuse increase = waste
    if (expenseTrend > 0.25) {
      return {
        cause: "supplier_price_increase",
        label: "매입 단가 상승",
        recommendations: [
          "식재료 또는 원자재 비용이 크게 증가했습니다.",
          "주요 공급업체의 단가 변동을 확인하세요.",
          "대체 공급업체를 검토하거나 대량 구매 협상을 진행하세요.",
        ],
      };
    }
    return {
      cause: "waste_increase",
      label: "폐기/손실 증가",
      recommendations: [
        "식재료 폐기 또는 손실이 증가한 것으로 추정됩니다.",
        "재고 회전율을 점검하고 발주량을 조정하세요.",
        "유통기한 관리 프로세스를 강화하세요.",
      ],
    };
  }

  // Both revenue and expenses changed — check for seasonal pattern
  const month = new Date().getMonth() + 1;
  const isTypicallySlow =
    (month >= 1 && month <= 2) || // Jan-Feb: post-holiday slow
    (month >= 8 && month <= 9);   // Aug-Sep: summer slowdown
  if (isTypicallySlow && revenueTrend < -0.1) {
    return {
      cause: "seasonal",
      label: "계절적 요인",
      recommendations: [
        "이 시기는 통상적으로 매출이 감소하는 계절입니다.",
        "계절 특수 메뉴나 프로모션을 준비하세요.",
        "비수기 비용 절감 방안을 미리 계획하세요.",
      ],
    };
  }

  return {
    cause: "normal_variation",
    label: "정상 범위 변동",
    recommendations: ["비용 비율이 다소 높아졌으나 일시적 변동으로 판단됩니다. 추이를 계속 모니터링하세요."],
  };
}

/**
 * Detect cost ratio anomaly for a business by analyzing the current week vs 4-week average.
 *
 * @param businessId - UUID of the business
 * @returns Anomaly detection result with diagnosis and recommendations
 */
export async function detectCostAnomaly(
  businessId: string
): Promise<CostAnomalyResult> {
  const supabase = await createClient();

  // Collect data for current week + 4 previous weeks (5 weeks total)
  const weeks: WeeklySnapshot[] = [];

  for (let weekOffset = 0; weekOffset >= -4; weekOffset--) {
    const { start, end } = getWeekRange(weekOffset);
    const startStr = toDateString(start);
    const endStr = toDateString(end);

    // Revenue for this week
    const { data: revenues, error: revErr } = await supabase
      .from("revenues")
      .select("amount")
      .eq("business_id", businessId)
      .gte("date", startStr)
      .lte("date", endStr);

    if (revErr) {
      throw new Error(`주간 매출 조회 실패: ${revErr.message}`);
    }

    // Variable expenses for this week
    const { data: varExpenses, error: varErr } = await supabase
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .eq("type", "variable")
      .gte("date", startStr)
      .lte("date", endStr);

    if (varErr) {
      throw new Error(`주간 변동비 조회 실패: ${varErr.message}`);
    }

    const revenue = revenues?.reduce((s, r) => s + r.amount, 0) ?? 0;
    const expenses = varExpenses?.reduce((s, r) => s + r.amount, 0) ?? 0;
    const costRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;

    weeks.push({
      weekStart: startStr,
      weekEnd: endStr,
      revenue,
      expenses,
      costRatio: Math.round(costRatio * 10) / 10,
    });
  }

  const [currentWeek, ...previousWeeks] = weeks;

  // Calculate 4-week moving average (excluding current week)
  const weeksWithRevenue = previousWeeks.filter((w) => w.revenue > 0);
  const averageRatio =
    weeksWithRevenue.length > 0
      ? weeksWithRevenue.reduce((s, w) => s + w.costRatio, 0) / weeksWithRevenue.length
      : currentWeek.costRatio;

  const currentRatio = currentWeek.costRatio;
  const deviation = Math.round((currentRatio - averageRatio) * 10) / 10;
  const isAnomaly = deviation >= ANOMALY_THRESHOLD_PP;

  const { cause, label, recommendations } = isAnomaly
    ? diagnoseCause(currentWeek, weeksWithRevenue)
    : {
        cause: "normal_variation" as CostAnomalyCause,
        label: "정상 범위",
        recommendations: ["현재 비용 비율이 정상 범위 내에 있습니다."],
      };

  return {
    currentWeek,
    previousWeeks,
    currentRatio,
    averageRatio: Math.round(averageRatio * 10) / 10,
    deviation,
    isAnomaly,
    diagnosis: cause,
    diagnosisLabel: label,
    recommendations,
  };
}

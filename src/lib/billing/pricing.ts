// Pricing plans for sajang.ai subscription
// Shared between client and server components

export const PRICING = {
  monthly: { amount: 29700, label: "월간", perMonth: 29700, discount: 0 },
  quarterly: { amount: 80190, label: "3개월", perMonth: 26730, discount: 10 },
  yearly: { amount: 249480, label: "12개월", perMonth: 20790, discount: 30 },
} as const;

export type PlanInterval = keyof typeof PRICING;

// ─── Phase 2.6 — Multi-business pricing ──────────────────────────────────────
//
// Pricing rule:
//   total = base + max(0, businessCount - 1) * extra
//
// Defaults:
//   base  = 29,700 KRW per month (includes 1 business)
//   extra =  9,900 KRW per additional business
//
// Discounts from PRICING still apply to the base portion; extra businesses
// are billed at flat rate without quarterly/yearly discounts for now.

export const BASE_PRICE_KRW = 29_700;
export const EXTRA_BUSINESS_PRICE_KRW = 9_900;

export interface MultiBusinessPrice {
  base: number;
  extraCount: number; // businesses beyond the first
  extraTotal: number;
  total: number;
  perBusinessAverage: number;
}

/**
 * Compute the monthly price for an owner running N businesses under one plan.
 */
export function calculateMultiBusinessPrice(
  businessCount: number,
  options: { base?: number; extra?: number } = {}
): MultiBusinessPrice {
  const count = Math.max(1, Math.floor(businessCount));
  const base = options.base ?? BASE_PRICE_KRW;
  const extra = options.extra ?? EXTRA_BUSINESS_PRICE_KRW;

  const extraCount = Math.max(0, count - 1);
  const extraTotal = extraCount * extra;
  const total = base + extraTotal;
  const perBusinessAverage = Math.round(total / count);

  return { base, extraCount, extraTotal, total, perBusinessAverage };
}

/**
 * Format an amount as "29,700원".
 */
export function formatPriceKrw(amount: number): string {
  return `${amount.toLocaleString()}원`;
}

/**
 * Human readable explanation for the billing UI, e.g.
 *   "점장 1명 29,700원 + 추가 사업장 2개 × 9,900원 = 49,500원/월"
 */
export function describeMultiBusinessPrice(price: MultiBusinessPrice): string {
  if (price.extraCount === 0) {
    return `점장 1명 ${formatPriceKrw(price.total)}/월`;
  }
  return `점장 1명 ${formatPriceKrw(price.base)} + 추가 사업장 ${price.extraCount}개 × ${formatPriceKrw(EXTRA_BUSINESS_PRICE_KRW)} = ${formatPriceKrw(price.total)}/월`;
}

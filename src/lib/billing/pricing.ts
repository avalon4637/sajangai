// Pricing plans for sajang.ai subscription
// Shared between client and server components

export const PRICING = {
  monthly: { amount: 29700, label: "월간", perMonth: 29700, discount: 0 },
  quarterly: { amount: 80190, label: "3개월", perMonth: 26730, discount: 10 },
  yearly: { amount: 249480, label: "12개월", perMonth: 20790, discount: 30 },
} as const;

export type PlanInterval = keyof typeof PRICING;

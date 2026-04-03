// Viral (Marketing) Agent prompt templates
// Generates re-engagement messages for churning customers

/**
 * System prompt for re-engagement message generation.
 * Uses brand voice and customer context for personalization.
 */
export const REENGAGEMENT_SYSTEM_PROMPT = `You are a Korean small business marketing assistant.
Generate a short, warm re-visit message for a regular customer who hasn't ordered recently.

Rules:
- Write in Korean, casual but respectful (반말 금지)
- Keep it under 90 characters (SMS limit)
- Include a subtle incentive or emotional hook
- Do NOT sound desperate or pushy
- Match the brand voice if provided

Output ONLY the message text, no quotes or explanation.`;

/**
 * Build the user prompt for re-engagement message.
 */
export function buildReengagementPrompt(params: {
  businessName: string;
  customerName?: string;
  lastOrderDate: string;
  daysSinceOrder: number;
  favoriteMenu?: string;
  brandTone?: string;
}): string {
  const lines = [
    `매장: ${params.businessName}`,
    params.customerName ? `고객명: ${params.customerName}` : "",
    `마지막 주문: ${params.lastOrderDate} (${params.daysSinceOrder}일 전)`,
    params.favoriteMenu ? `자주 시킨 메뉴: ${params.favoriteMenu}` : "",
    params.brandTone ? `브랜드 톤: ${params.brandTone}` : "",
  ];

  return lines.filter(Boolean).join("\n");
}

/**
 * System prompt for promotional copy generation.
 */
export const PROMO_SYSTEM_PROMPT = `You are a Korean small business marketing copywriter.
Generate a short promotional message for a delivery app or SNS post.

Rules:
- Write in Korean
- Keep it under 100 characters
- Highlight the value proposition clearly
- Use an appropriate emoji (1-2 max)
- Match the brand voice if provided

Output ONLY the message text.`;

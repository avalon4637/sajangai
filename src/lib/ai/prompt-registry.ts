// Prompt version registry for tracking AI prompt versions
// Used for correlating feedback with specific prompt versions

export interface PromptEntry {
  version: string;
  key: string;
}

// @MX:NOTE: Central registry for all AI prompt versions across agent engines
// Update version strings when prompt content changes to enable feedback correlation

export const PROMPT_VERSIONS: Record<string, PromptEntry> = {
  seri_system: { version: "3.0.0", key: "seri_system" },
  seri_profit: { version: "3.0.0", key: "seri_profit" },
  seri_cashflow: { version: "3.0.0", key: "seri_cashflow" },
  seri_cost: { version: "3.0.0", key: "seri_cost" },
  seri_daily: { version: "3.0.0", key: "seri_daily" },
  dapjangi_positive: { version: "3.0.0", key: "dapjangi_positive" },
  dapjangi_neutral: { version: "3.0.0", key: "dapjangi_neutral" },
  dapjangi_negative: { version: "3.0.0", key: "dapjangi_negative" },
  dapjangi_sentiment: { version: "3.0.0", key: "dapjangi_sentiment" },
  dapjangi_insights: { version: "3.0.0", key: "dapjangi_insights" },
  jeongjang_briefing: { version: "3.0.0", key: "jeongjang_briefing" },
  jeongjang_diagnosis: { version: "3.0.0", key: "jeongjang_diagnosis" },
  jeongjang_chat: { version: "3.0.0", key: "jeongjang_chat" },
  voice_learning: { version: "3.0.0", key: "voice_learning" },
  viral_reengagement: { version: "3.0.0", key: "viral_reengagement" },
  viral_promo: { version: "3.0.0", key: "viral_promo" },
  seri_simulation: { version: "3.0.0", key: "seri_simulation" },
  dapjangi_management: { version: "3.0.0", key: "dapjangi_management" },
};

/**
 * Get the current version string for a prompt key.
 * Returns "1.0.0" as fallback when key is not registered.
 */
export function getPromptVersion(key: string): string {
  return PROMPT_VERSIONS[key]?.version ?? "1.0.0";
}

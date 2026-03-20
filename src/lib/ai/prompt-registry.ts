// Prompt version registry for tracking AI prompt versions
// Used for correlating feedback with specific prompt versions

export interface PromptEntry {
  version: string;
  key: string;
}

// @MX:NOTE: Central registry for all AI prompt versions across agent engines
// Update version strings when prompt content changes to enable feedback correlation

export const PROMPT_VERSIONS: Record<string, PromptEntry> = {
  seri_system: { version: "2.0.0", key: "seri_system" },
  seri_profit: { version: "2.0.0", key: "seri_profit" },
  seri_cashflow: { version: "2.0.0", key: "seri_cashflow" },
  seri_cost: { version: "2.0.0", key: "seri_cost" },
  seri_daily: { version: "2.0.0", key: "seri_daily" },
  dapjangi_positive: { version: "1.0.0", key: "dapjangi_positive" },
  dapjangi_neutral: { version: "1.0.0", key: "dapjangi_neutral" },
  dapjangi_negative: { version: "1.0.0", key: "dapjangi_negative" },
  dapjangi_sentiment: { version: "1.0.0", key: "dapjangi_sentiment" },
  jeongjang_briefing: { version: "2.0.0", key: "jeongjang_briefing" },
  jeongjang_diagnosis: { version: "2.0.0", key: "jeongjang_diagnosis" },
  jeongjang_chat: { version: "2.0.0", key: "jeongjang_chat" },
  voice_learning: { version: "1.0.0", key: "voice_learning" },
};

/**
 * Get the current version string for a prompt key.
 * Returns "1.0.0" as fallback when key is not registered.
 */
export function getPromptVersion(key: string): string {
  return PROMPT_VERSIONS[key]?.version ?? "1.0.0";
}

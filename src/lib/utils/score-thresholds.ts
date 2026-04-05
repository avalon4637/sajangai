// Shared survival score thresholds and color mapping
// Used by kpi-summary-cards.tsx and survival-gauge.tsx

export const SURVIVAL_SCORE = {
  GOOD: 80, // A-B grade, green
  WARNING: 50, // C grade, amber
  DANGER: 0, // D-F grade, red
} as const;

export function getSurvivalScoreColor(
  score: number,
): "green" | "amber" | "red" {
  if (score >= SURVIVAL_SCORE.GOOD) return "green";
  if (score >= SURVIVAL_SCORE.WARNING) return "amber";
  return "red";
}

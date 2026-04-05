// Unified Korean currency formatting utilities
// Single source of truth for all KRW formatting across the app

/**
 * Format a number as Korean currency with automatic unit scaling.
 * Examples: 0 -> "0원", 15000 -> "2만원", 150000000 -> "1.5억원"
 */
export function formatKRW(n: number): string {
  if (n === 0) return "0원";
  if (Math.abs(n) >= 100_000_000)
    return `${(n / 100_000_000).toFixed(1)}억원`;
  if (Math.abs(n) >= 10_000)
    return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}

/**
 * Format a number as compact Korean currency (no '원' suffix).
 * Examples: 0 -> "0", 15000 -> "2만", 150000000 -> "1.5억"
 */
export function formatCompact(n: number): string {
  if (n === 0) return "0";
  if (Math.abs(n) >= 100_000_000)
    return `${(n / 100_000_000).toFixed(1)}억`;
  if (Math.abs(n) >= 10_000) return `${Math.round(n / 10_000)}만`;
  return n.toLocaleString();
}

/**
 * Format an amount in Korean currency units with full detail.
 * Examples: 0 -> "0원", 15000 -> "2만원", 123456789 -> "1억 2,346만원"
 */
export function formatAmount(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000);
    const man = Math.floor((amount % 100_000_000) / 10_000);
    return man > 0
      ? `${eok}억 ${man.toLocaleString()}만원`
      : `${eok}억원`;
  }
  if (amount >= 10_000) {
    return `${Math.floor(amount / 10_000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

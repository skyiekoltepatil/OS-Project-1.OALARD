/**
 * Formatting helpers shared across the UI.
 */

/** Format a number to at most `decimals` decimal places, trimming trailing zeros. */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  const fixed = value.toFixed(decimals);
  if (fixed.includes('.')) {
    return fixed.replace(/\.?0+$/, '') || fixed;
  }
  return fixed;
}

/** Format a time value; integers render without decimals. */
export function formatTime(value: number): string {
  return Number.isInteger(value) ? String(value) : formatNumber(value, 2);
}

/** Format a percentage with the given precision. */
export function formatPercent(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

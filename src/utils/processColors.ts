/**
 * Consistent process color palette for the Gantt chart and visualizers.
 */

const PALETTE = [
  '#4f8cff', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#a78bfa', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#e11d48', // rose
  '#eab308', // yellow
];

/** Deterministic color for a pid based on its order of appearance. */
export function processColor(_pid: string, index: number): string {
  return PALETTE[index % PALETTE.length];
}

/**
 * Shared helpers used by multiple scheduling strategies.
 */

import type { Process } from '../../../types/process';
import type { SimulationContext } from '../SimulationContext';

/** Comparator: arrival time, then original input order. */
export function byArrivalThenOrder(ctx: SimulationContext) {
  return (a: Process, b: Process): number => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return ctx.indexOf(a.pid) - ctx.indexOf(b.pid);
  };
}

/** True when at least one process still has remaining burst. */
export function hasUnfinishedWork(ctx: SimulationContext): boolean {
  for (const p of ctx.processes) {
    if (ctx.remainingOf(p.pid) > 0) return true;
  }
  return false;
}

/**
 * Advance time to the next event while the CPU is idle.
 * Returns 1 when time was advanced, 0 otherwise.
 */
export function skipIdleTime(ctx: SimulationContext): number {
  if (ctx.runningPid !== null) return 0;
  const next = ctx.nextArrivalAfter(ctx.time);
  if (next === null) return 0;
  if (next > ctx.time) {
    ctx.emit({
      kind: 'idle',
      time: ctx.time,
      queueAfter: [...ctx.readyQueue],
      reason: `CPU idle from t=${ctx.time} to t=${next}`,
    });
    ctx.advanceTo(next);
  }
  return 1;
}

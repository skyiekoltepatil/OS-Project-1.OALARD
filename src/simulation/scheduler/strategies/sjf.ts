/**
 * SJF — Shortest Job First (non-preemptive).
 *
 * Among arrived, unfinished processes, run the one with the smallest total
 * burst time. Ties break by arrival time, then input order. Processes that
 * have not yet arrived are never considered.
 */

import type { SimulationContext } from '../SimulationContext';
import { runNonPreemptiveLoop } from './nonPreemptive';
import { byArrivalThenOrder } from './common';

export function runSJF(_processes: readonly unknown[], ctx: SimulationContext): void {
  runNonPreemptiveLoop(ctx, {
    id: 'sjf',
    selectCandidate: (candidates) => {
      const sorted = candidates
        .map((pid) => ctx.byPid.get(pid)!)
        .sort((a, b) => a.burstTime - b.burstTime || byArrivalThenOrder(ctx)(a, b));
      return sorted.length > 0 ? sorted[0].pid : null;
    },
  });
}

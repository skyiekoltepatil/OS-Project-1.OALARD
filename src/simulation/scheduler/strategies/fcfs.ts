/**
 * FCFS — First Come First Serve (non-preemptive).
 *
 * Processes run in arrival order; ties broken by input order.
 * The CPU idles (advancing time to the next arrival) when nothing is ready.
 */

import type { SimulationContext } from '../SimulationContext';
import { runNonPreemptiveLoop } from './nonPreemptive';
import { byArrivalThenOrder } from './common';

export function runFCFS(_processes: readonly unknown[], ctx: SimulationContext): void {
  runNonPreemptiveLoop(ctx, {
    id: 'fcfs',
    selectCandidate: (candidates) => {
      const arrived = candidates
        .map((pid) => ctx.byPid.get(pid)!)
        .sort(byArrivalThenOrder(ctx));
      return arrived.length > 0 ? arrived[0].pid : null;
    },
  });
}

/**
 * Shared loop for non-preemptive algorithms (FCFS/SJF/non-preemptive Priority).
 * Selects the best available candidate each time the CPU becomes free.
 */

import type { SimulationContext } from '../SimulationContext';
import { hasUnfinishedWork, skipIdleTime } from './common';

export interface NonPreemptiveSelector {
  /** Return the pid to run next among arrived, unfinished processes, or null. */
  selectCandidate(candidates: readonly string[], ctx: SimulationContext): string | null;
  /** Label used in event reasons. */
  readonly id: string;
}

export function runNonPreemptiveLoop(ctx: SimulationContext, selector: NonPreemptiveSelector): void {
  while (!ctx.finished) {
    if (ctx.runningPid === null) {
      // Emit arrival events for everything that has just shown up.
      ctx.admitArrivalsAt(ctx.time);
      const arrived = ctx.arrivedAt(ctx.time).filter((p) => ctx.remainingOf(p.pid) > 0);
      const candidate = selector.selectCandidate(
        arrived.map((p) => p.pid),
        ctx,
      );

      if (candidate === null) {
        if (!hasUnfinishedWork(ctx)) {
          ctx.finish();
          return;
        }
        skipIdleTime(ctx);
        continue;
      }

      ctx.removeFromQueue(candidate);
      ctx.setRunning(candidate);
      ctx.emit({
        kind: 'dispatch',
        time: ctx.time,
        pid: candidate,
        queueAfter: [...ctx.readyQueue],
        reason: `${selector.id.toUpperCase()} dispatches ${candidate} at t=${ctx.time}`,
      });
    }

    // Run the current process to completion (non-preemptive).
    const remaining = ctx.remainingOf(ctx.runningPid!);
    ctx.consumeRunning(remaining);
    ctx.advance(remaining);
    const pid = ctx.runningPid!;
    ctx.closeOpenSegment();
    ctx.complete(pid);
    ctx.clearRunning();
  }
}

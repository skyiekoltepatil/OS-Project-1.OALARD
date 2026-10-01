/**
 * Round Robin with a configurable time quantum.
 *
 * Uses a true FIFO ready queue. Processes run for at most `quantum` units,
 * then re-queue at the tail. Processes that arrive during a slice are
 * admitted before the preempted process re-queues (standard convention).
 * The CPU idles by jumping to the next arrival when the queue is empty.
 */

import type { Process } from '../../../types/process';
import { SimulationContext } from '../SimulationContext';

export function runRoundRobin(_processes: readonly Process[], ctx: SimulationContext): void {
  const quantum = Math.max(1, Math.floor(ctx.quantum()));

  // Seed the queue with processes arriving at t=0, in arrival/input order.
  ctx.admitArrivalsAt(ctx.time);
  while (!ctx.finished) {
    if (ctx.runningPid === null) {
      if (ctx.readyQueue.length === 0) {
        if (!hasUnfinished(ctx) || !skipIdle(ctx)) {
          ctx.finish();
          return;
        }
        ctx.admitArrivalsAt(ctx.time);
        continue;
      }
      const pid = ctx.dequeue()!;
      if (ctx.remainingOf(pid) <= 0) continue; // defensive: skip stale entries
      ctx.setRunning(pid);
      ctx.emit({
        kind: 'dispatch',
        time: ctx.time,
        pid,
        queueAfter: [...ctx.readyQueue],
        reason: `RR dispatches ${pid} for up to ${quantum} time unit${quantum === 1 ? '' : 's'}`,
      });
    }

    const running = ctx.runningPid!;
    const slice = Math.min(quantum, ctx.remainingOf(running));

    // Advance in unit steps so arrivals are admitted (in arrival order)
    // before the preempted process re-queues at the end of the slice.
    for (let step = 0; step < slice; step++) {
      ctx.consumeRunning(1);
      ctx.advance(1);
      ctx.admitArrivalsAt(ctx.time);
      if (ctx.remainingOf(running) === 0) break;
    }

    if (ctx.remainingOf(running) === 0) {
      ctx.closeOpenSegment();
      ctx.complete(running);
      ctx.clearRunning();
    } else {
      // Quantum expired: requeue the process at the tail.
      ctx.closeOpenSegment();
      ctx.clearRunning();
      ctx.enqueue(running);
      ctx.emit({
        kind: 'requeue',
        time: ctx.time,
        pid: running,
        queueAfter: [...ctx.readyQueue],
        reason: `${running} quantum expired; ${ctx.remainingOf(running)} unit${ctx.remainingOf(running) === 1 ? '' : 's'} remain`,
      });
    }
  }
}

function hasUnfinished(ctx: SimulationContext): boolean {
  return ctx.processes.some((p) => ctx.remainingOf(p.pid) > 0);
}

/** Jump to the next arrival. Returns false when nothing will ever arrive. */
function skipIdle(ctx: SimulationContext): boolean {
  const next = ctx.nextArrivalAfter(ctx.time);
  if (next === null) return false;
  ctx.emit({
    kind: 'idle',
    time: ctx.time,
    queueAfter: [...ctx.readyQueue],
    reason: `CPU idle from t=${ctx.time} to t=${next}`,
  });
  ctx.advanceTo(next);
  return true;
}

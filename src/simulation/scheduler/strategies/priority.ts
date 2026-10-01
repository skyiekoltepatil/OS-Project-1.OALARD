/**
 * Priority Scheduling — preemptive and non-preemptive.
 *
 * Priority is interpreted via `ctx.normalizedPriority` so that the UI-level
 * direction option (smaller number = higher priority, or the reverse) always
 * maps to "smaller normalized value wins". Ties break by arrival time, then
 * input order. The preemptive variant re-evaluates at every arrival and
 * preempts only on a strictly better candidate (ties keep the runner).
 */

import type { Process } from '../../../types/process';
import { SimulationContext } from '../SimulationContext';
import { runNonPreemptiveLoop } from './nonPreemptive';

export function runPriority(processes: readonly Process[], ctx: SimulationContext): void {
  if (!ctx.isPreemptive()) {
    runNonPreemptiveLoop(ctx, {
      id: 'priority',
      selectCandidate: (candidates) => pickBest(ctx, candidates),
    });
    return;
  }

  let guard = 0;
  const maxIterations = processes.reduce((s, p) => s + Math.ceil(p.burstTime), 0) + processes.length + 16;

  while (!ctx.finished && guard++ < maxIterations) {
    if (ctx.runningPid === null) {
      if (!admitAndDispatch(ctx)) {
        if (!hasUnfinished(ctx)) {
          ctx.finish();
          return;
        }
        skipIdle(ctx);
        continue;
      }
    }

    considerPreemption(ctx);

    const running = ctx.runningPid;
    if (running === null) continue;

    const remaining = ctx.remainingOf(running);
    const nextArrival = ctx.nextArrivalAfter(ctx.time);
    const untilArrival = nextArrival === null ? Number.POSITIVE_INFINITY : nextArrival - ctx.time;
    const runFor = Math.min(remaining, untilArrival);

    if (runFor === Number.POSITIVE_INFINITY) {
      ctx.consumeRunning(remaining);
      ctx.advance(remaining);
      finishRunning(ctx, running);
      continue;
    }

    // nextArrivalAfter() returns strictly later arrivals, so runFor > 0 here.

    ctx.consumeRunning(runFor);
    ctx.advance(runFor);

    if (ctx.remainingOf(running) === 0) {
      finishRunning(ctx, running);
    }
  }

  if (!ctx.finished) ctx.finish();
}

function pickBest(ctx: SimulationContext, candidates: readonly string[]): string | null {
  const live = candidates.filter((pid) => ctx.remainingOf(pid) > 0);
  if (live.length === 0) return null;
  return [...live].sort((a, b) => ctx.compareCandidates(a, b))[0];
}

function admitAndDispatch(ctx: SimulationContext): boolean {
  ctx.admitArrivalsAt(ctx.time);
  const best = pickBest(ctx, [...ctx.readyQueue]);
  if (best === null) return false;
  ctx.removeFromQueue(best);
  ctx.setRunning(best);
  ctx.emit({
    kind: 'dispatch',
    time: ctx.time,
    pid: best,
    queueAfter: [...ctx.readyQueue],
    reason: `Priority dispatches ${best} (highest priority) at t=${ctx.time}`,
  });
  return true;
}

function considerPreemption(ctx: SimulationContext): void {
  const running = ctx.runningPid;
  if (running === null) return;

  ctx.admitArrivalsAt(ctx.time);

  const best = pickBest(ctx, [...ctx.readyQueue]);
  if (best === null) return;

  if (beats(ctx, best, running)) {
    ctx.removeFromQueue(best);
    ctx.clearRunning();
    ctx.enqueue(running);
    ctx.setRunning(best);
    ctx.emit({
      kind: 'preempt',
      time: ctx.time,
      pid: running,
      byPid: best,
      queueAfter: [...ctx.readyQueue],
      reason: `${best} has higher priority; ${running} preempted`,
    });
  }
}

function beats(ctx: SimulationContext, challenger: string, running: string): boolean {
  const pc = ctx.normalizedPriority(challenger);
  const pr = ctx.normalizedPriority(running);
  if (pc !== pr) return pc < pr;
  const ac = ctx.byPid.get(challenger)!.arrivalTime;
  const ar = ctx.byPid.get(running)!.arrivalTime;
  return ac < ar;
}

function finishRunning(ctx: SimulationContext, pid: string): void {
  ctx.closeOpenSegment();
  ctx.complete(pid);
  ctx.clearRunning();
}

function hasUnfinished(ctx: SimulationContext): boolean {
  return ctx.processes.some((p) => ctx.remainingOf(p.pid) > 0);
}

function skipIdle(ctx: SimulationContext): void {
  const next = ctx.nextArrivalAfter(ctx.time);
  if (next !== null && next > ctx.time) {
    ctx.emit({
      kind: 'idle',
      time: ctx.time,
      queueAfter: [...ctx.readyQueue],
      reason: `CPU idle from t=${ctx.time} to t=${next}`,
    });
    ctx.advanceTo(next);
  }
}

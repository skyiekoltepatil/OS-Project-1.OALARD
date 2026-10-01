/**
 * SRTF — Shortest Remaining Time First (preemptive SJF).
 *
 * The process with the smallest remaining burst owns the CPU. Whenever a new
 * process arrives (or the running process finishes) the scheduler re-evaluates
 * and may preempt the running process. Ties keep the running process to avoid
 * thrashing; otherwise ties break by arrival time, then input order.
 */

import type { Process } from '../../../types/process';
import { SimulationContext } from '../SimulationContext';

export function runSRTF(processes: readonly Process[], ctx: SimulationContext): void {
  let guard = 0;
  const maxIterations = processes.reduce((sum, p) => sum + Math.ceil(p.burstTime), 0) + processes.length + 16;

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

    // If a newly arrived process beats the running one, swap immediately.
    considerPreemption(ctx);

    // Determine how long we can safely run before the next arrival.
    const running = ctx.runningPid;
    if (running === null) continue; // nothing runnable yet; loop will idle-skip

    const remaining = ctx.remainingOf(running);
    const nextArrival = ctx.nextArrivalAfter(ctx.time);
    const untilArrival = nextArrival === null ? Number.POSITIVE_INFINITY : nextArrival - ctx.time;
    const runFor = Math.min(remaining, untilArrival);

    if (runFor === Number.POSITIVE_INFINITY) {
      // No future arrivals; run to completion.
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

  if (!ctx.finished) {
    // Safety: never loop forever (cannot happen with valid inputs).
    ctx.finish();
  }
}

/** Admit arrived processes and dispatch the best one. Returns true if dispatched. */
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
    reason: `SRTF dispatches ${best} (shortest remaining time) at t=${ctx.time}`,
  });
  return true;
}

/** Preempt the running process if any queued/arrived process beats it. */
function considerPreemption(ctx: SimulationContext): void {
  const running = ctx.runningPid;
  if (running === null) return;

  ctx.admitArrivalsAt(ctx.time);

  const contenders = [...ctx.readyQueue];
  if (contenders.length === 0) return;

  const best = pickBest(ctx, contenders);
  if (best === null) return;

  if (beats(ctx, best, running)) {
    ctx.removeFromQueue(best);
    ctx.clearRunning(); // re-queue the running process
    ctx.enqueue(running);
    ctx.setRunning(best);
    ctx.emit({
      kind: 'preempt',
      time: ctx.time,
      pid: running,
      byPid: best,
      queueAfter: [...ctx.readyQueue],
      reason: `${best} arrived with shorter remaining time; ${running} preempted`,
    });
  }
}

/** Pick the best candidate by SRTF ordering (remaining, arrival, input order). */
function pickBest(ctx: SimulationContext, candidates: readonly string[]): string | null {
  const live = candidates.filter((pid) => ctx.remainingOf(pid) > 0);
  if (live.length === 0) return null;
  return [...live].sort((a, b) => {
    const ra = ctx.remainingOf(a);
    const rb = ctx.remainingOf(b);
    if (ra !== rb) return ra - rb;
    return ctx.compareCandidates(a, b);
  })[0];
}

/** True when `challenger` strictly beats `running` under SRTF ordering. */
function beats(ctx: SimulationContext, challenger: string, running: string): boolean {
  const rc = ctx.remainingOf(challenger);
  const rr = ctx.remainingOf(running);
  if (rc !== rr) return rc < rr;
  // Tie on remaining time: arrival time decides; earlier arrival wins.
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

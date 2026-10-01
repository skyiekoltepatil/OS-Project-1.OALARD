/**
 * Snapshot replay: converts a completed timeline into per-time-unit
 * snapshots the live visualizer can step through.
 *
 * Replaying snapshots is purely presentational — it never re-runs or alters
 * the scheduling computation. Ready-queue order is reconstructed from the
 * timeline: arrivals are admitted in (arrival time, input) order, a process
 * preempted at a quantum expiry/preemption is re-queued at the tail, and the
 * dispatched process is removed from the head — matching the engine's
 * conventions.
 */

import type { ExecutionSegment, SimulationResult } from '../types/scheduling';
import type { SimulationSnapshot } from '../types/simulation';
import type { Process } from '../types/process';

/** Build a snapshot for each time unit from 0 through the end of the run. */
export function buildSnapshots(
  processes: readonly Process[],
  result: SimulationResult,
): SimulationSnapshot[] {
  const snapshots: SimulationSnapshot[] = [];
  const totalTime = totalOf(result.segments);

  const remaining: Record<string, number> = {};
  for (const p of processes) remaining[p.pid] = p.burstTime;

  const completed: string[] = [];
  const queue: string[] = [];
  let runningPid: string | null = null;

  const arrivalOrder = (a: Process, b: Process): number =>
    a.arrivalTime - b.arrivalTime || processes.indexOf(a) - processes.indexOf(b);

  const admitArrivals = (t: number): void => {
    for (const p of processes.filter((p) => p.arrivalTime <= t).sort(arrivalOrder)) {
      if (remaining[p.pid] > 0 && p.pid !== runningPid && !queue.includes(p.pid)) {
        queue.push(p.pid);
      }
    }
  };

  for (let t = 0; t <= totalTime; t++) {
    const active = result.segments.find((s) => t >= s.startTime && t < s.endTime);
    const activePid = active?.pid ?? null;

    if (activePid !== runningPid) {
      // Boundary: the previous runner leaves the CPU, the next one enters.
      const previous = runningPid;
      if (previous !== null && remaining[previous] > 0) {
        queue.push(previous); // preempted or quantum expired → tail of the queue
      }
      runningPid = activePid;
      if (activePid !== null) {
        const idx = queue.indexOf(activePid);
        if (idx >= 0) queue.splice(idx, 1);
      }
    }

    admitArrivals(t);

    if (activePid !== null) {
      remaining[activePid] = round2(Math.max(0, remaining[activePid] - 1));
    }

    for (const p of processes) {
      if (remaining[p.pid] === 0 && !completed.includes(p.pid) && p.pid !== activePid) {
        completed.push(p.pid);
      }
    }

    snapshots.push({
      time: t,
      runningPid: activePid,
      readyQueue: [...queue],
      completedPids: [...completed],
      remainingBurst: { ...remaining },
      lastEvent: null,
      finished: processes.length > 0 && completed.length === processes.length,
    });
  }

  return snapshots;
}

function totalOf(segments: readonly ExecutionSegment[]): number {
  if (segments.length === 0) return 0;
  return Math.ceil(Math.max(...segments.map((s) => s.endTime)));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

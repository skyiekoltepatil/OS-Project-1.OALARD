/**
 * Metrics engine.
 *
 * Computes per-process metrics (CT, TAT, WT, RT) and aggregate summary
 * statistics (averages, CPU utilization, throughput) from an execution
 * timeline. All values are derived from the actual simulation — never
 * hard-coded.
 *
 * Formulas:
 *   CT  = completion time (end of the process's last CPU segment)
 *   TAT = CT - AT
 *   WT  = TAT - BT
 *   RT  = first CPU start time - AT
 *   CPU utilization = busy time / total execution time × 100
 *   Throughput       = completed processes / total execution time
 */

import type {
  ExecutionSegment,
  ProcessMetricsMap,
  ProcessMetricsView,
  SimulationSummary,
} from '../types/scheduling';
import type { Process } from '../types/process';

/** Merge adjacent/overlapping busy segments belonging to the same process. */
export function mergeSegments(segments: readonly ExecutionSegment[]): ExecutionSegment[] {
  const busy = segments.filter((s) => s.pid !== null).slice().sort((a, b) => a.startTime - b.startTime);
  const merged: ExecutionSegment[] = [];
  for (const seg of busy) {
    const last = merged[merged.length - 1];
    if (last && last.pid === seg.pid && seg.startTime <= last.endTime) {
      merged[merged.length - 1] = { ...last, endTime: Math.max(last.endTime, seg.endTime) };
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

/** Compute per-process metrics from merged busy segments. */
export function computeMetrics(processes: readonly Process[], segments: readonly ExecutionSegment[]): ProcessMetricsMap {
  const map = new Map<string, ProcessMetricsView>();

  for (const p of processes) {
    const mine = segments.filter((s) => s.pid === p.pid);
    if (mine.length === 0) {
      // Never scheduled (can only happen with an empty run or an error).
      map.set(p.pid, {
        pid: p.pid,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        completionTime: Number.NaN,
        turnaroundTime: Number.NaN,
        waitingTime: Number.NaN,
        responseTime: Number.NaN,
        firstStartTime: Number.NaN,
      });
      continue;
    }

    const firstStartTime = mine[0].startTime;
    const completionTime = Math.max(...mine.map((s) => s.endTime));
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;

    map.set(p.pid, {
      pid: p.pid,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime: firstStartTime - p.arrivalTime,
      firstStartTime,
    });
  }

  return map;
}

/** Compute the aggregate summary for a completed simulation. */
export function computeSummary(
  processes: readonly Process[],
  segments: readonly ExecutionSegment[],
  metrics: ProcessMetricsMap,
): SimulationSummary {
  const busyTime = segments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  const completed = segments.length > 0 ? metrics.size : 0;
  const totalExecutionTime =
    segments.length > 0 ? Math.max(...segments.map((s) => s.endTime)) : 0;

  const avg = (pick: (m: ProcessMetricsView) => number): number => {
    if (metrics.size === 0) return 0;
    let sum = 0;
    for (const m of metrics.values()) sum += pick(m);
    return sum / metrics.size;
  };

  return {
    processCount: processes.length,
    totalExecutionTime,
    busyTime,
    idleTime: totalExecutionTime - busyTime,
    cpuUtilization: totalExecutionTime > 0 ? (busyTime / totalExecutionTime) * 100 : 0,
    throughput: totalExecutionTime > 0 ? completed / totalExecutionTime : 0,
    avgWaitingTime: avg((m) => m.waitingTime),
    avgTurnaroundTime: avg((m) => m.turnaroundTime),
    avgResponseTime: avg((m) => m.responseTime),
  };
}

/**
 * Algorithm correctness tests.
 *
 * Expected timelines and metrics are hand-computed; each test asserts the
 * Gantt segments, the derived metrics (CT, TAT, WT, RT), and the summary.
 */

import { describe, it, expect } from 'vitest';
import { runSimulation } from '../runSimulation';
import type { Process } from '../../types/process';
import type { RunOptions } from '../scheduler/SimulationContext';

const DEFAULTS: RunOptions = { timeQuantum: 2, preemptive: false, highValueIsHighPriority: false };

const P = (pid: string, arrivalTime: number, burstTime: number, priority = 1): Process => ({
  pid,
  arrivalTime,
  burstTime,
  priority,
});

function seg(pid: string | null, startTime: number, endTime: number): string {
  return `${pid ?? 'IDLE'}:${startTime}-${endTime}`;
}

function timeline(result: { segments: { pid: string | null; startTime: number; endTime: number }[] }): string[] {
  return result.segments.map((s) => seg(s.pid, s.startTime, s.endTime));
}

// ---------------------------------------------------------------- FCFS

describe('FCFS', () => {
  it('schedules normal processes in arrival order', () => {
    const processes = [P('P1', 0, 5), P('P2', 1, 3), P('P3', 2, 8)];
    const result = runSimulation(processes, 'fcfs', DEFAULTS);

    expect(timeline(result)).toEqual(['P1:0-5', 'P2:5-8', 'P3:8-16']);

    expect(result.metrics.get('P1')).toMatchObject({ completionTime: 5, turnaroundTime: 5, waitingTime: 0, responseTime: 0 });
    expect(result.metrics.get('P2')).toMatchObject({ completionTime: 8, turnaroundTime: 7, waitingTime: 4, responseTime: 4 });
    expect(result.metrics.get('P3')).toMatchObject({ completionTime: 16, turnaroundTime: 14, waitingTime: 6, responseTime: 6 });

    expect(result.summary.avgWaitingTime).toBeCloseTo(10 / 3, 5);
    expect(result.summary.avgTurnaroundTime).toBeCloseTo(26 / 3, 5);
    expect(result.summary.cpuUtilization).toBeCloseTo(100, 5);
    expect(result.summary.throughput).toBeCloseTo(3 / 16, 5);
  });

  it('handles identical arrival times by input order', () => {
    const processes = [P('P2', 0, 4), P('P1', 0, 2), P('P3', 0, 3)];
    const result = runSimulation(processes, 'fcfs', DEFAULTS);
    expect(timeline(result)).toEqual(['P2:0-4', 'P1:4-6', 'P3:6-9']);
  });

  it('shows CPU idle time when the first process arrives late', () => {
    const processes = [P('P1', 3, 2), P('P2', 10, 4)];
    const result = runSimulation(processes, 'fcfs', DEFAULTS);
    expect(timeline(result)).toEqual(['P1:3-5', 'P2:10-14']);

    expect(result.summary.busyTime).toBe(6);
    expect(result.summary.idleTime).toBe(8); // 3 before P1 + 5 between jobs
    expect(result.summary.totalExecutionTime).toBe(14);
    expect(result.summary.cpuUtilization).toBeCloseTo((6 / 14) * 100, 5);
  });
});

// ---------------------------------------------------------------- SJF

describe('SJF', () => {
  it('picks the smallest burst among arrived processes', () => {
    const processes = [P('P1', 0, 7), P('P2', 2, 4), P('P3', 4, 1), P('P4', 5, 4)];
    const result = runSimulation(processes, 'sjf', DEFAULTS);

    // t=0: only P1 → run to t=7. t=7: {P2,P3,P4} → P3(1) → P2(4) → P4(4 tie by arrival).
    expect(timeline(result)).toEqual(['P1:0-7', 'P3:7-8', 'P2:8-12', 'P4:12-16']);

    expect(result.metrics.get('P1')).toMatchObject({ completionTime: 7, turnaroundTime: 7, waitingTime: 0 });
    expect(result.metrics.get('P3')).toMatchObject({ completionTime: 8, turnaroundTime: 4, waitingTime: 3 });
    expect(result.metrics.get('P2')).toMatchObject({ completionTime: 12, turnaroundTime: 10, waitingTime: 6 });
    expect(result.metrics.get('P4')).toMatchObject({ completionTime: 16, turnaroundTime: 11, waitingTime: 7 });
  });

  it('does not sort the entire set by burst — respects arrivals', () => {
    const processes = [P('A', 0, 10), P('B', 1, 1)];
    const result = runSimulation(processes, 'sjf', DEFAULTS);
    // A starts at 0 (B not yet arrived) and is never preempted (non-preemptive).
    expect(timeline(result)).toEqual(['A:0-10', 'B:10-11']);
    expect(result.metrics.get('A')).toMatchObject({ completionTime: 10, waitingTime: 0, responseTime: 0 });
    expect(result.metrics.get('B')).toMatchObject({ completionTime: 11, turnaroundTime: 10, waitingTime: 9 });
  });

  it('breaks burst ties by arrival time then input order', () => {
    const processes = [P('X', 0, 5), P('Y', 0, 3), P('Z', 0, 3)];
    const result = runSimulation(processes, 'sjf', DEFAULTS);
    expect(timeline(result)).toEqual(['Y:0-3', 'Z:3-6', 'X:6-11']);
  });
});

// ---------------------------------------------------------------- SRTF

describe('SRTF', () => {
  it('preempts when a shorter job arrives', () => {
    const processes = [P('P1', 0, 8), P('P2', 1, 4), P('P3', 2, 9), P('P4', 3, 5)];
    const result = runSimulation(processes, 'srtf', { ...DEFAULTS, preemptive: true });

    // Classic textbook example:
    // P1:0-1, P2:1-5, P4:5-10, P1:10-17, P3:17-26
    expect(timeline(result)).toEqual(['P1:0-1', 'P2:1-5', 'P4:5-10', 'P1:10-17', 'P3:17-26']);

    expect(result.metrics.get('P1')).toMatchObject({ completionTime: 17, turnaroundTime: 17, waitingTime: 9, responseTime: 0 });
    expect(result.metrics.get('P2')).toMatchObject({ completionTime: 5, turnaroundTime: 4, waitingTime: 0, responseTime: 0 });
    expect(result.metrics.get('P3')).toMatchObject({ completionTime: 26, turnaroundTime: 24, waitingTime: 15, responseTime: 15 });
    expect(result.metrics.get('P4')).toMatchObject({ completionTime: 10, turnaroundTime: 7, waitingTime: 2, responseTime: 2 });

    expect(result.summary.avgWaitingTime).toBeCloseTo(26 / 4, 5);
    expect(result.summary.cpuUtilization).toBeCloseTo(100, 5);
  });

  it('handles equal remaining times without thrashing (runner keeps CPU)', () => {
    const processes = [P('P1', 0, 4), P('P2', 2, 2)];
    const result = runSimulation(processes, 'srtf', { ...DEFAULTS, preemptive: true });

    // At t=2: P1 remaining=2, P2=2 → tie → runner (P1) keeps CPU.
    expect(timeline(result)).toEqual(['P1:0-4', 'P2:4-6']);
    expect(result.metrics.get('P1')).toMatchObject({ completionTime: 4, responseTime: 0 });
    expect(result.metrics.get('P2')).toMatchObject({ completionTime: 6, turnaroundTime: 4, waitingTime: 2, responseTime: 2 });
  });

  it('handles multiple arrivals and repeated preemption', () => {
    const processes = [P('P1', 0, 6), P('P2', 1, 3), P('P3', 2, 1)];
    const result = runSimulation(processes, 'srtf', { ...DEFAULTS, preemptive: true });

    // P1:0-1 → P2 arrives (3<5): P2:1-2 → P3 arrives (1<2): P3:2-3 → P2:3-5 → P1:5-10
    expect(timeline(result)).toEqual(['P1:0-1', 'P2:1-2', 'P3:2-3', 'P2:3-5', 'P1:5-10']);

    expect(result.metrics.get('P1')).toMatchObject({ completionTime: 10, turnaroundTime: 10, waitingTime: 4, responseTime: 0 });
    expect(result.metrics.get('P2')).toMatchObject({ completionTime: 5, turnaroundTime: 4, waitingTime: 1, responseTime: 0 });
    expect(result.metrics.get('P3')).toMatchObject({ completionTime: 3, turnaroundTime: 1, waitingTime: 0, responseTime: 0 });
  });
});

// ---------------------------------------------------------------- Round Robin

describe('Round Robin', () => {
  it('rotates processes with quantum 2', () => {
    const processes = [P('P1', 0, 5), P('P2', 0, 6), P('P3', 1, 3), P('P4', 2, 1), P('P5', 3, 5)];
    const result = runSimulation(processes, 'rr', DEFAULTS);

    // Hand-traced RR with q=2 (arrivals admitted before the requeue):
    // P1:0-2, P2:2-4, P3:4-6, P4:6-7, P1:7-9, P5:9-11, P2:11-13,
    // P3:13-14, P1:14-15, P5:15-17, P2:17-19, P5:19-20
    expect(timeline(result)).toEqual([
      'P1:0-2', 'P2:2-4', 'P3:4-6', 'P4:6-7', 'P1:7-9', 'P5:9-11',
      'P2:11-13', 'P3:13-14', 'P1:14-15', 'P5:15-17', 'P2:17-19', 'P5:19-20',
    ]);
    expect(result.summary.busyTime).toBe(20);
  });

  it('requeues processes when the quantum expires', () => {
    const processes = [P('P1', 0, 5), P('P2', 0, 3)];
    const result = runSimulation(processes, 'rr', DEFAULTS);
    expect(timeline(result)).toEqual(['P1:0-2', 'P2:2-4', 'P1:4-6', 'P2:6-7', 'P1:7-8']);
  });

  it('respects arrivals mid-slice and idles when the queue is empty', () => {
    const processes = [P('P1', 0, 3), P('P2', 7, 2)];
    const result = runSimulation(processes, 'rr', DEFAULTS);
    // P1 runs 0-3, queue empty → idle until 7 → P2:7-9.
    expect(timeline(result)).toEqual(['P1:0-3', 'P2:7-9']);
    expect(result.summary.idleTime).toBe(4);
  });

  it('handles a quantum larger than every burst', () => {
    const processes = [P('P1', 0, 2), P('P2', 0, 3)];
    const result = runSimulation(processes, 'rr', { ...DEFAULTS, timeQuantum: 10 });
    expect(timeline(result)).toEqual(['P1:0-2', 'P2:2-5']);
  });

  it('handles a very small quantum of 1', () => {
    const processes = [P('P1', 0, 3), P('P2', 0, 2)];
    const result = runSimulation(processes, 'rr', { ...DEFAULTS, timeQuantum: 1 });
    expect(timeline(result)).toEqual(['P1:0-1', 'P2:1-2', 'P1:2-3', 'P2:3-4', 'P1:4-5']);
  });
});

// ---------------------------------------------------------------- Priority

describe('Priority', () => {
  it('non-preemptive: picks the best priority among arrived processes', () => {
    const processes = [P('P1', 0, 4, 2), P('P2', 1, 2, 1), P('P3', 2, 3, 3)];
    const result = runSimulation(processes, 'priority', DEFAULTS);

    // t=0: only P1 → runs 0-4. t=4: P2(1) beats P3(3).
    expect(timeline(result)).toEqual(['P1:0-4', 'P2:4-6', 'P3:6-9']);
  });

  it('preemptive: a higher-priority arrival preempts the runner', () => {
    const processes = [P('P1', 0, 5, 3), P('P2', 2, 3, 1)];
    const result = runSimulation(processes, 'priority', { ...DEFAULTS, preemptive: true });

    expect(timeline(result)).toEqual(['P1:0-2', 'P2:2-5', 'P1:5-8']);

    expect(result.metrics.get('P1')).toMatchObject({ completionTime: 8, turnaroundTime: 8, waitingTime: 3, responseTime: 0 });
    expect(result.metrics.get('P2')).toMatchObject({ completionTime: 5, turnaroundTime: 3, waitingTime: 0, responseTime: 0 });
  });

  it('supports high-value-first direction', () => {
    const processes = [P('P1', 0, 4, 1), P('P2', 0, 4, 3)];
    const result = runSimulation(processes, 'priority', { ...DEFAULTS, highValueIsHighPriority: true });
    // Priority 3 beats priority 1 when the direction is flipped.
    expect(timeline(result)).toEqual(['P2:0-4', 'P1:4-8']);
  });

  it('breaks priority ties by arrival then input order', () => {
    const processes = [P('B', 0, 3, 2), P('A', 0, 3, 2)];
    const result = runSimulation(processes, 'priority', DEFAULTS);
    expect(timeline(result)).toEqual(['B:0-3', 'A:3-6']);
  });

  it('idle gap between priority runs', () => {
    const processes = [P('P1', 0, 2, 1), P('P2', 6, 3, 1)];
    const result = runSimulation(processes, 'priority', DEFAULTS);
    expect(timeline(result)).toEqual(['P1:0-2', 'P2:6-9']);
    expect(result.summary.cpuUtilization).toBeCloseTo((5 / 9) * 100, 5);
  });
});

// ---------------------------------------------------------------- Edge cases

describe('Edge cases', () => {
  it('returns an empty result for zero processes', () => {
    const result = runSimulation([], 'fcfs', DEFAULTS);
    expect(result.segments).toEqual([]);
    expect(result.summary.processCount).toBe(0);
    expect(result.summary.cpuUtilization).toBe(0);
    expect(result.summary.throughput).toBe(0);
  });

  it('handles a single process', () => {
    const result = runSimulation([P('P1', 2, 3)], 'rr', DEFAULTS);
    expect(timeline(result)).toEqual(['P1:2-5']);
    expect(result.metrics.get('P1')).toMatchObject({ completionTime: 5, turnaroundTime: 3, waitingTime: 0, responseTime: 0 });
  });

  it('handles simultaneous arrivals with identical parameters', () => {
    const processes = [P('P1', 0, 4, 2), P('P2', 0, 4, 2), P('P3', 0, 4, 2)];
    const result = runSimulation(processes, 'rr', DEFAULTS);
    expect(timeline(result)).toEqual(['P1:0-2', 'P2:2-4', 'P3:4-6', 'P1:6-8', 'P2:8-10', 'P3:10-12']);
  });

  it('handles large burst times', () => {
    const processes = [P('P1', 0, 100000), P('P2', 0, 1)];
    const result = runSimulation(processes, 'fcfs', DEFAULTS);
    expect(timeline(result)).toEqual(['P1:0-100000', 'P2:100000-100001']);
  });

  it('preemption at the exact same timestamp', () => {
    const processes = [P('P1', 0, 4, 5), P('P2', 3, 2, 1)];
    const result = runSimulation(processes, 'priority', { ...DEFAULTS, preemptive: true });
    // P2 arrives at t=3 exactly when P1 is mid-run; P2 has better priority.
    expect(timeline(result)).toEqual(['P1:0-3', 'P2:3-5', 'P1:5-6']);
    expect(result.metrics.get('P1')).toMatchObject({ completionTime: 6, waitingTime: 2 });
  });
});

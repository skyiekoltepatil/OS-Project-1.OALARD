/**
 * Metrics formulas, snapshot replay, and comparison tests.
 */

import { describe, it, expect } from 'vitest';
import { runSimulation } from '../runSimulation';
import { runComparison } from '../comparison';
import { buildSnapshots } from '../snapshots';
import { formatNumber, formatTime, formatPercent } from '../../utils/formatting';
import type { Process } from '../../types/process';
import type { RunOptions } from '../scheduler/SimulationContext';

const DEFAULTS: RunOptions = { timeQuantum: 2, preemptive: false, highValueIsHighPriority: false };

const P = (pid: string, arrivalTime: number, burstTime: number, priority = 1): Process => ({
  pid,
  arrivalTime,
  burstTime,
  priority,
});

describe('Metric formulas', () => {
  it('CT = end of last CPU segment', () => {
    const r = runSimulation([P('P1', 0, 5), P('P2', 1, 3)], 'fcfs', DEFAULTS);
    expect(r.metrics.get('P2')!.completionTime).toBe(8);
  });

  it('TAT = CT - AT', () => {
    const r = runSimulation([P('P1', 2, 5)], 'fcfs', DEFAULTS);
    const m = r.metrics.get('P1')!;
    expect(m.completionTime).toBe(7);
    expect(m.turnaroundTime).toBe(m.completionTime - m.arrivalTime);
  });

  it('WT = TAT - BT (for every process of an SRTF run)', () => {
    const r = runSimulation([P('P1', 0, 8), P('P2', 1, 4), P('P3', 2, 9), P('P4', 3, 5)], 'srtf', {
      ...DEFAULTS,
      preemptive: true,
    });
    for (const m of r.metrics.values()) {
      expect(m.waitingTime).toBeCloseTo(m.turnaroundTime - m.burstTime, 10);
    }
  });

  it('RT = first start - AT, even after preemption', () => {
    const r = runSimulation([P('P1', 0, 5, 3), P('P2', 2, 3, 1)], 'priority', {
      ...DEFAULTS,
      preemptive: true,
    });
    expect(r.metrics.get('P1')!.responseTime).toBe(0); // started at 0
    expect(r.metrics.get('P2')!.responseTime).toBe(0); // started at 2
  });

  it('CPU utilization excludes idle time', () => {
    const r = runSimulation([P('P1', 3, 4), P('P2', 10, 2)], 'fcfs', DEFAULTS);
    // busy = 6, total = 12 → 50%.
    expect(r.summary.busyTime).toBe(6);
    expect(r.summary.totalExecutionTime).toBe(12);
    expect(r.summary.cpuUtilization).toBeCloseTo(50, 5);
  });

  it('throughput = completed / total execution time', () => {
    const r = runSimulation([P('P1', 0, 5), P('P2', 1, 3)], 'fcfs', DEFAULTS);
    expect(r.summary.throughput).toBeCloseTo(2 / 8, 10);
  });
});

describe('Snapshots', () => {
  it('produce one snapshot per time unit with running pid and queue', () => {
    const processes = [P('P1', 0, 3), P('P2', 1, 2)];
    const r = runSimulation(processes, 'fcfs', DEFAULTS);
    const snaps = buildSnapshots(processes, r);

    expect(snaps.length).toBe(6); // t = 0..5
    expect(snaps[0]).toMatchObject({ time: 0, runningPid: 'P1', readyQueue: [] });
    expect(snaps[1]).toMatchObject({ time: 1, runningPid: 'P1', readyQueue: ['P2'] });
    expect(snaps[2]).toMatchObject({ time: 2, runningPid: 'P1', readyQueue: ['P2'] });
    expect(snaps[3]).toMatchObject({ time: 3, runningPid: 'P2' });
    expect(snaps[5]).toMatchObject({ time: 5, runningPid: null, finished: true });
  });

  it('show remaining burst decreasing and completion tracking', () => {
    const processes = [P('P1', 0, 2), P('P2', 0, 3)];
    const r = runSimulation(processes, 'rr', DEFAULTS);
    const snaps = buildSnapshots(processes, r);

    expect(snaps[0].remainingBurst['P1']).toBe(1);
    expect(snaps[1].remainingBurst['P1']).toBe(0);
    expect(snaps[2].completedPids).toContain('P1');
    expect(snaps[snaps.length - 1].finished).toBe(true);
  });
});

describe('Comparison mode', () => {
  it('runs the same dataset through all five algorithms', () => {
    const processes = [P('P1', 0, 5), P('P2', 1, 3), P('P3', 2, 8), P('P4', 4, 2)];
    const rows = runComparison(processes, DEFAULTS);

    expect(rows.map((r) => r.algorithm)).toEqual(['fcfs', 'sjf', 'srtf', 'rr', 'priority']);
    for (const row of rows) {
      expect(row.summary.processCount).toBe(4);
      // Every unit of work is scheduled exactly once by every algorithm.
      expect(row.summary.busyTime).toBe(processes.reduce((s, p) => s + p.burstTime, 0));
    }
  });

  it('always keeps busy time equal to total burst across algorithms', () => {
    const processes = [P('A', 0, 8), P('B', 3, 4), P('C', 5, 1)];
    const rows = runComparison(processes, DEFAULTS);
    for (const row of rows) {
      expect(row.summary.busyTime).toBe(13);
    }
  });
});

describe('Formatting utilities', () => {
  it('formatNumber trims trailing zeros', () => {
    expect(formatNumber(3.5)).toBe('3.5');
    expect(formatNumber(2)).toBe('2');
    expect(formatNumber(1 / 3)).toBe('0.33');
    expect(formatNumber(Number.NaN)).toBe('—');
  });

  it('formatTime renders integers without decimals', () => {
    expect(formatTime(4)).toBe('4');
    expect(formatTime(4.5)).toBe('4.5');
  });

  it('formatPercent renders with one decimal', () => {
    expect(formatPercent(87.5)).toBe('87.5%');
    expect(formatPercent(Number.NaN)).toBe('—');
  });
});

import type { Process } from './process';

/** All scheduling algorithms supported by SchedOS. */
export type AlgorithmId = 'fcfs' | 'sjf' | 'srtf' | 'rr' | 'priority';

/** Preemption preference for algorithms that support both modes. */
export type PreemptionMode = 'preemptive' | 'non-preemptive';

/** Direction of priority comparison. */
export type PriorityDirection = 'low-value-first' | 'high-value-first';

/** Per-run scheduling configuration. */
export interface SchedulingConfig {
  readonly algorithm: AlgorithmId;
  /** Round Robin time quantum. Must be > 0 when algorithm is 'rr'. */
  readonly timeQuantum: number;
  /** Preemption mode (used by SRTF vs SJF and preemptive vs non-preemptive Priority). */
  readonly preemption: PreemptionMode;
  /** Priority ordering direction. */
  readonly priorityDirection: PriorityDirection;
}

/** A contiguous period during which one process (or the idle slot) owns the CPU. */
export interface ExecutionSegment {
  readonly pid: string | null; // null => CPU idle
  readonly startTime: number;
  readonly endTime: number;
  readonly process?: Process; // present when pid is not null
}

/** Complete result of running a scheduling simulation. */
export interface SimulationResult {
  readonly segments: ExecutionSegment[];
  readonly metrics: ProcessMetricsMap;
  readonly summary: SimulationSummary;
}

/** Metrics keyed by process id. */
export type ProcessMetricsMap = ReadonlyMap<string, ProcessMetricsView>;

/** Per-process metric view exposed to the UI. */
export interface ProcessMetricsView {
  readonly pid: string;
  readonly arrivalTime: number;
  readonly burstTime: number;
  readonly priority: number;
  readonly completionTime: number;
  readonly turnaroundTime: number;
  readonly waitingTime: number;
  readonly responseTime: number;
  readonly firstStartTime: number;
}

/** Aggregate statistics for a completed simulation. */
export interface SimulationSummary {
  readonly processCount: number;
  readonly totalExecutionTime: number;
  readonly busyTime: number;
  readonly idleTime: number;
  readonly cpuUtilization: number; // percentage 0..100
  readonly throughput: number; // processes per unit time
  readonly avgWaitingTime: number;
  readonly avgTurnaroundTime: number;
  readonly avgResponseTime: number;
}

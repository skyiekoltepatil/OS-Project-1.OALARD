/**
 * Process model for SchedOS.
 *
 * A `Process` is an immutable record. All simulation code treats processes
 * as plain data; scheduling state (remaining burst, etc.) is tracked
 * separately by the simulation engine.
 */

/** A process as entered by the user (immutable input to the scheduler). */
export interface Process {
  /** Unique process identifier, e.g. "P1". */
  readonly pid: string;
  /** Time at which the process arrives in the ready queue. Must be >= 0. */
  readonly arrivalTime: number;
  /** Total CPU time required. Must be > 0. May be fractional. */
  readonly burstTime: number;
  /** Scheduling priority. Lower value = higher priority by default. */
  readonly priority: number;
}

/** A process paired with its computed metrics after simulation. */
export interface ProcessMetrics {
  readonly process: Process;
  /** Time at which the process finished execution (Infinity if it never completes). */
  readonly completionTime: number;
  /** Turnaround time: CT - AT. */
  readonly turnaroundTime: number;
  /** Waiting time: TAT - BT. */
  readonly waitingTime: number;
  /** Response time: first CPU start time - AT. */
  readonly responseTime: number;
  /** Time at which the process first received the CPU. */
  readonly firstStartTime: number;
}

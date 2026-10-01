/**
 * A single discrete scheduling event produced by the simulation engine.
 * The live visualizer replays these events one time unit at a time.
 */
export type SimulationEvent =
  | { kind: 'process-arrives'; time: number; pid: string; queueAfter: string[] }
  | {
      kind: 'dispatch';
      time: number;
      pid: string;
      queueAfter: string[];
      reason: string;
    }
  | {
      kind: 'preempt';
      time: number;
      pid: string; // process being preempted
      byPid: string; // process taking the CPU
      queueAfter: string[];
      reason: string;
    }
  | {
      kind: 'requeue';
      time: number;
      pid: string;
      queueAfter: string[];
      reason: string;
    }
  | { kind: 'complete'; time: number; pid: string; queueAfter: string[] }
  | { kind: 'idle'; time: number; queueAfter: string[]; reason: string }
  | { kind: 'finish'; time: number };

/** State of the simulation at a specific time unit (for the live view). */
export interface SimulationSnapshot {
  readonly time: number;
  readonly runningPid: string | null;
  readonly readyQueue: string[];
  readonly completedPids: string[];
  readonly remainingBurst: Readonly<Record<string, number>>;
  readonly lastEvent: SimulationEvent | null;
  readonly finished: boolean;
}

/** Player state for the live simulation view. */
export type PlaybackState = 'idle' | 'running' | 'paused' | 'finished';

/** Speed multiplier options for playback. */
export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4;

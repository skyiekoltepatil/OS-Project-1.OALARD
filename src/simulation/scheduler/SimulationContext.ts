/**
 * Simulation context shared by all scheduler strategies.
 *
 * A strategy drives the context forward, one decision at a time, until the
 * context reports `finished`. The context owns all mutable state and is
 * responsible for emitting timeline segments and snapshot events.
 *
 * This module is pure TypeScript: no React, no DOM.
 */

import type { ExecutionSegment } from '../../types/scheduling';
import type { SimulationEvent } from '../../types/simulation';
import type { Process } from '../../types/process';

export interface RunOptions {
  readonly timeQuantum: number;
  readonly preemptive: boolean;
  /** When true, a numerically larger priority value means higher priority. */
  readonly highValueIsHighPriority: boolean;
}

interface RuntimeState {
  remaining: Map<string, number>;
  readyQueue: string[];
  runningPid: string | null;
  currentSliceStart: number;
  firstStart: Map<string, number>;
  completed: Set<string>;
  time: number;
  finished: boolean;
}

export class SimulationContext {
  readonly processes: readonly Process[];
  readonly byPid: Map<string, Process>;
  private readonly state: RuntimeState;
  private readonly _segments: ExecutionSegment[] = [];
  private readonly _events: SimulationEvent[] = [];

  constructor(processes: readonly Process[], private readonly options: RunOptions) {
    this.processes = processes;
    this.byPid = new Map(processes.map((p) => [p.pid, p]));
    this.state = {
      remaining: new Map(processes.map((p) => [p.pid, p.burstTime])),
      readyQueue: [],
      runningPid: null,
      currentSliceStart: 0,
      firstStart: new Map(),
      completed: new Set(),
      time: 0,
      finished: false,
    };
  }

  // ---------------------------------------------------------------- getters

  get time(): number {
    return this.state.time;
  }

  get runningPid(): string | null {
    return this.state.runningPid;
  }

  get readyQueue(): readonly string[] {
    return this.state.readyQueue;
  }

  get remainingBurst(): ReadonlyMap<string, number> {
    return this.state.remaining;
  }

  get finished(): boolean {
    return this.state.finished;
  }

  get segments(): readonly ExecutionSegment[] {
    return this._segments;
  }

  get events(): readonly SimulationEvent[] {
    return this._events;
  }

  quantum(): number {
    return this.options.timeQuantum;
  }

  isPreemptive(): boolean {
    return this.options.preemptive;
  }

  // ------------------------------------------------------------- helpers

  /** All processes that have arrived at (or before) the given time. */
  arrivedAt(time: number): Process[] {
    return this.processes.filter((p) => p.arrivalTime <= time);
  }

  /** Next arrival time strictly after `time`, or null if none. */
  nextArrivalAfter(time: number): number | null {
    let next: number | null = null;
    for (const p of this.processes) {
      if (p.arrivalTime > time && (next === null || p.arrivalTime < next)) {
        next = p.arrivalTime;
      }
    }
    return next;
  }

  /** Effective priority of a process normalized so smaller always wins. */
  normalizedPriority(pid: string): number {
    const p = this.byPid.get(pid);
    if (!p) throw new Error(`Unknown pid: ${pid}`);
    return this.options.highValueIsHighPriority ? -p.priority : p.priority;
  }

  /**
   * Deterministic tie-breaker: priority (normalized) → arrival time → input
   * order. Used by every algorithm so results are reproducible.
   */
  compareCandidates(a: string, b: string): number {
    const pa = this.normalizedPriority(a);
    const pb = this.normalizedPriority(b);
    if (pa !== pb) return pa - pb;
    const ta = this.byPid.get(a)!.arrivalTime;
    const tb = this.byPid.get(b)!.arrivalTime;
    if (ta !== tb) return ta - tb;
    return this.indexOf(a) - this.indexOf(b);
  }

  /** Index of a process in the original input order. */
  indexOf(pid: string): number {
    return this.processes.findIndex((p) => p.pid === pid);
  }

  /** Push a process onto the tail of the ready queue. */
  enqueue(pid: string): void {
    if (!this.state.readyQueue.includes(pid)) {
      this.state.readyQueue.push(pid);
    }
  }

  /**
   * Admit processes that arrive exactly at `time` and emit an arrival event
   * for each. The running process is never re-admitted, and repeated calls
   * at the same timestamp emit nothing (single source of the convention).
   */
  admitArrivalsAt(time: number): void {
    for (const p of this.processes) {
      if (
        p.arrivalTime === time &&
        this.remainingOf(p.pid) > 0 &&
        p.pid !== this.state.runningPid &&
        !this.state.readyQueue.includes(p.pid)
      ) {
        this.state.readyQueue.push(p.pid);
        this.emit({
          kind: 'process-arrives',
          time,
          pid: p.pid,
          queueAfter: [...this.state.readyQueue],
        });
      }
    }
  }

  /** Remove and return the head of the ready queue, if any. */
  dequeue(): string | null {
    return this.state.readyQueue.shift() ?? null;
  }

  /** Remove a specific pid from the ready queue (used on preemption swap). */
  removeFromQueue(pid: string): void {
    const idx = this.state.readyQueue.indexOf(pid);
    if (idx >= 0) this.state.readyQueue.splice(idx, 1);
  }

  /** Record the first time a process receives the CPU (response time). */
  markFirstStart(pid: string): void {
    if (!this.state.firstStart.has(pid)) {
      this.state.firstStart.set(pid, this.state.time);
    }
  }

  // ------------------------------------------------------------- mutation

  /**
   * Close any open busy segment at the current time. Called before
   * switching the running process or finishing the simulation.
   */
  closeOpenSegment(): void {
    const running = this.state.runningPid;
    if (running === null) return;
    const start = this.state.currentSliceStart;
    if (this.state.time > start) {
      const proc = this.byPid.get(running)!;
      this._segments.push({ pid: running, startTime: start, endTime: this.state.time, process: proc });
    }
    this.state.currentSliceStart = this.state.time;
  }

  /** Set the given process as the one on the CPU starting now. */
  setRunning(pid: string): void {
    this.closeOpenSegment();
    this.state.runningPid = pid;
    this.state.currentSliceStart = this.state.time;
    this.markFirstStart(pid);
  }

  /** Clear the CPU (idle) from the current time onward. */
  clearRunning(): void {
    this.closeOpenSegment();
    this.state.runningPid = null;
  }

  /** Advance the clock by one unit (or to a target). */
  advance(delta = 1): void {
    this.state.time += delta;
  }

  /** Jump the clock to the given absolute time. */
  advanceTo(time: number): void {
    this.state.time = time;
  }

  /** Consume one unit of CPU from the running process. */
  consumeRunning(delta = 1): number {
    const pid = this.state.runningPid;
    if (pid === null) return 0;
    const remaining = this.state.remaining.get(pid)!;
    const used = Math.min(remaining, delta);
    this.state.remaining.set(pid, remaining - used);
    if (this.state.remaining.get(pid)! <= 0) {
      this.state.remaining.delete(pid);
    }
    return used;
  }

  remainingOf(pid: string): number {
    return this.state.remaining.get(pid) ?? 0;
  }

  /** Mark a process completed and emit the event. */
  complete(pid: string): void {
    this.state.completed.add(pid);
    this.emit({ kind: 'complete', time: this.state.time, pid, queueAfter: [...this.state.readyQueue] });
  }

  /** Emit an event onto the event log. */
  emit(event: SimulationEvent): void {
    this._events.push(event);
  }

  /** Mark the simulation complete and close any open segment. */
  finish(): void {
    this.closeOpenSegment();
    this.state.finished = true;
    this.emit({ kind: 'finish', time: this.state.time });
  }
}

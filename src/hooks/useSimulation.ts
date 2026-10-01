/**
 * useSimulation — the single source of truth for the simulator UI.
 *
 * Owns:
 *  - the process list and scheduling configuration
 *  - the deterministic simulation result (recomputed only on demand)
 *  - live playback state (play / pause / step / reset / speed)
 *
 * The scheduling math itself lives in src/simulation (pure TypeScript);
 * this hook only orchestrates it and holds React state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Process } from '../types/process';
import type {
  AlgorithmId,
  PreemptionMode,
  PriorityDirection,
  SimulationResult,
} from '../types/scheduling';
import type { PlaybackSpeed, PlaybackState, SimulationSnapshot } from '../types/simulation';
import { runSimulation } from '../simulation/runSimulation';
import { buildSnapshots } from '../simulation/snapshots';
import { DEFAULT_DATASET, SAMPLE_DATASETS } from '../data/sampleProcesses';

const BASE_SPEED_MS = 600; // duration of one time unit at 1× speed

export interface SimulationControls {
  // process management
  processes: Process[];
  setProcesses: (processes: Process[]) => void;
  addProcess: (process: Process) => void;
  updateProcess: (index: number, process: Process) => void;
  deleteProcess: (index: number) => void;
  duplicateProcess: (index: number) => void;
  clearProcesses: () => void;
  loadDataset: (datasetId: string) => void;

  // configuration
  algorithm: AlgorithmId;
  setAlgorithm: (a: AlgorithmId) => void;
  timeQuantum: number;
  setTimeQuantum: (q: number) => void;
  preemption: PreemptionMode;
  setPreemption: (p: PreemptionMode) => void;
  priorityDirection: PriorityDirection;
  setPriorityDirection: (d: PriorityDirection) => void;

  // playback
  playback: PlaybackState;
  currentTime: number;
  snapshot: SimulationSnapshot | null;
  speed: PlaybackSpeed;
  setSpeed: (s: PlaybackSpeed) => void;
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;

  // results
  result: SimulationResult | null;
  hasRun: boolean;
}

export function useSimulation(): SimulationControls {
  const [processes, setProcesses] = useState<Process[]>([...DEFAULT_DATASET.processes]);
  const [algorithm, setAlgorithm] = useState<AlgorithmId>('fcfs');
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [preemption, setPreemption] = useState<PreemptionMode>('non-preemptive');
  const [priorityDirection, setPriorityDirection] = useState<PriorityDirection>('low-value-first');
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [playback, setPlayback] = useState<PlaybackState>('idle');
  const [frameIndex, setFrameIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  /**
   * The deterministic result, recomputed only when inputs/config change.
   * Changing playback or speed never re-runs the scheduler.
   */
  const result = useMemo<SimulationResult | null>(() => {
    if (processes.length === 0) return null;
    return runSimulation(processes, algorithm, {
      timeQuantum,
      preemptive: algorithm === 'srtf' || (algorithm === 'priority' && preemption === 'preemptive'),
      highValueIsHighPriority: priorityDirection === 'high-value-first',
    });
  }, [processes, algorithm, timeQuantum, preemption, priorityDirection]);

  const snapshots = useMemo<SimulationSnapshot[]>(
    () => (result ? buildSnapshots(processes, result) : []),
    [processes, result],
  );

  // Clamp frame index whenever the timeline changes (edits during playback).
  const maxIndex = Math.max(0, snapshots.length - 1);
  useEffect(() => {
    setFrameIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Playback ticker.
  useEffect(() => {
    stopTimer();
    if (playback !== 'running') return;
    if (frameIndex >= maxIndex) {
      setPlayback('finished');
      return;
    }
    timerRef.current = window.setInterval(() => {
      setFrameIndex((i) => {
        const next = i + 1;
        if (next >= maxIndex) {
          stopTimer();
          setPlayback('finished');
          return maxIndex;
        }
        return next;
      });
    }, BASE_SPEED_MS / speed);
    return stopTimer;
  }, [playback, speed, frameIndex >= maxIndex, maxIndex, stopTimer]);

  // Reset playback whenever inputs or algorithm change.
  useEffect(() => {
    setPlayback('idle');
    setFrameIndex(0);
  }, [processes, algorithm, timeQuantum, preemption, priorityDirection]);

  const play = useCallback(() => {
    if (snapshots.length === 0) return;
    setFrameIndex((i) => {
      if (i >= maxIndex) return 0; // replay from the start
      return i;
    });
    setPlayback('running');
  }, [snapshots.length, maxIndex]);

  const pause = useCallback(() => {
    setPlayback((p) => (p === 'running' ? 'paused' : p));
  }, []);

  const step = useCallback(() => {
    if (snapshots.length === 0) return;
    stopTimer();
    // Stepping from IDLE means the simulation is now mid-run (PAUSED);
    // stepping at FINISHED is a no-op.
    setPlayback((p) => (p === 'finished' ? 'finished' : 'paused'));
    setFrameIndex((i) => Math.min(i + 1, maxIndex));
  }, [snapshots.length, maxIndex, stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    setPlayback('idle');
    setFrameIndex(0);
  }, [stopTimer]);

  // ------------------------------------------------------------ processes

  const addProcess = useCallback((process: Process) => {
    setProcesses((prev) => [...prev, process]);
  }, []);

  const updateProcess = useCallback((index: number, process: Process) => {
    setProcesses((prev) => prev.map((p, i) => (i === index ? process : p)));
  }, []);

  const deleteProcess = useCallback((index: number) => {
    setProcesses((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const duplicateProcess = useCallback((index: number) => {
    setProcesses((prev) => {
      const source = prev[index];
      if (!source) return prev;
      const copy = { ...source };
      let n = 2;
      const existing = new Set(prev.map((p) => p.pid));
      while (existing.has(`${source.pid}-${n}`)) n++;
      copy.pid = `${source.pid}-${n}`;
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  }, []);

  const clearProcesses = useCallback(() => setProcesses([]), []);

  const loadDataset = useCallback(
    (datasetId: string) => {
      const dataset = SAMPLE_DATASETS.find((d) => d.id === datasetId);
      if (!dataset) return;
      stopTimer();
      setProcesses([...dataset.processes]);
      setPlayback('idle');
      setFrameIndex(0);
    },
    [stopTimer],
  );

  return {
    processes,
    setProcesses,
    addProcess,
    updateProcess,
    deleteProcess,
    duplicateProcess,
    clearProcesses,
    loadDataset,
    algorithm,
    setAlgorithm,
    timeQuantum,
    setTimeQuantum,
    preemption,
    setPreemption,
    priorityDirection,
    setPriorityDirection,
    playback,
    currentTime: snapshots[frameIndex]?.time ?? 0,
    snapshot: snapshots[frameIndex] ?? null,
    speed,
    setSpeed,
    play,
    pause,
    step,
    reset,
    result,
    hasRun: result !== null,
  };
}

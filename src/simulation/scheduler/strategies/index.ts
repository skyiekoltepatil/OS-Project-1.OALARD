/**
 * Strategy registry: maps an AlgorithmId to its implementation.
 */

import type { AlgorithmId } from '../../../types/scheduling';
import type { Process } from '../../../types/process';
import type { SimulationContext } from '../SimulationContext';
import { runFCFS } from './fcfs';
import { runSJF } from './sjf';
import { runSRTF } from './srtf';
import { runRoundRobin } from './roundRobin';
import { runPriority } from './priority';

export type StrategyFn = (processes: readonly Process[], ctx: SimulationContext) => void;

export const STRATEGIES: Record<AlgorithmId, StrategyFn> = {
  fcfs: runFCFS,
  sjf: runSJF,
  srtf: runSRTF,
  rr: runRoundRobin,
  priority: runPriority,
};

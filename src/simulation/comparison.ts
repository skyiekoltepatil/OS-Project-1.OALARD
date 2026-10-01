/**
 * Algorithm comparison: runs the same dataset through every supported
 * algorithm configuration and returns metrics for side-by-side analysis.
 *
 * Note: comparison presents trade-offs, not a "best" algorithm.
 */

import type { AlgorithmId } from '../types/scheduling';
import type { Process } from '../types/process';
import type { RunOptions } from './scheduler/SimulationContext';
import { runSimulation } from './runSimulation';

export interface ComparisonRow {
  readonly algorithm: AlgorithmId;
  readonly label: string;
  readonly summary: ReturnType<typeof runSimulation>['summary'];
}

const LABELS: Record<AlgorithmId, string> = {
  fcfs: 'FCFS',
  sjf: 'SJF',
  srtf: 'SRTF',
  rr: 'Round Robin',
  priority: 'Priority',
};

/** Run every algorithm over the dataset and collect per-algorithm results. */
export function runComparison(
  processes: readonly Process[],
  baseOptions: RunOptions,
): ComparisonRow[] {
  const algorithms: AlgorithmId[] = ['fcfs', 'sjf', 'srtf', 'rr', 'priority'];
  return algorithms.map((algorithm) => ({
    algorithm,
    label: LABELS[algorithm],
    summary: runSimulation(processes, algorithm, baseOptions).summary,
  }));
}

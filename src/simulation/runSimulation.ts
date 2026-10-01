/**
 * Timeline: builds the final, replayable result of a simulation.
 *
 * Architecture (mandatory separation):
 *   Input Processes → Scheduler → Execution Timeline → Metrics → Visualization
 *
 * The scheduler strategies produce a raw timeline via the SimulationContext;
 * this module post-processes it (merging adjacent slices, computing metrics
 * and summary) into the immutable SimulationResult consumed by the UI.
 */

import type { ExecutionSegment, SimulationResult } from '../types/scheduling';
import type { Process } from '../types/process';
import { SimulationContext, type RunOptions } from './scheduler/SimulationContext';
import { STRATEGIES } from './scheduler/strategies';
import { computeMetrics, computeSummary, mergeSegments } from './metrics';

/**
 * Run a scheduling algorithm over a process set and produce the complete
 * timeline + metrics. Pure function: no React, no DOM, no global state.
 */
export function runSimulation(
  processes: readonly Process[],
  algorithm: keyof typeof STRATEGIES,
  options: RunOptions,
): SimulationResult {
  const ctx = new SimulationContext(processes, options);
  if (processes.length > 0) {
    STRATEGIES[algorithm](processes, ctx);
    if (!ctx.finished) ctx.finish();
  }

  const merged = mergeSegments(ctx.segments);
  const metrics = computeMetrics(processes, merged);
  const summary = computeSummary(processes, merged, metrics);

  return { segments: merged, metrics, summary };
}

export type { ExecutionSegment };

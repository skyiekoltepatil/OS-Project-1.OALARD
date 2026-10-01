/**
 * Event formatting helpers for the live event log.
 */

import type { SimulationEvent } from '../types/simulation';

/** Human-readable text describing a simulation event. */
export function describeEvent(event: SimulationEvent): string {
  switch (event.kind) {
    case 'process-arrives':
      return `${event.pid} arrives at t=${event.time}`;
    case 'dispatch':
      return event.reason;
    case 'preempt':
      return `${event.byPid} preempts ${event.pid} at t=${event.time} — ${event.reason}`;
    case 'requeue':
      return `${event.pid} re-queued at t=${event.time} — ${event.reason}`;
    case 'complete':
      return `${event.pid} completed at t=${event.time}`;
    case 'idle':
      return event.reason;
    case 'finish':
      return `Simulation finished at t=${event.time}`;
  }
}

/** Short badge label for an event kind. */
export function eventBadge(event: SimulationEvent): string {
  switch (event.kind) {
    case 'process-arrives':
      return 'ARRIVE';
    case 'dispatch':
      return 'DISPATCH';
    case 'preempt':
      return 'PREEMPT';
    case 'requeue':
      return 'REQUEUE';
    case 'complete':
      return 'DONE';
    case 'idle':
      return 'IDLE';
    case 'finish':
      return 'END';
  }
}

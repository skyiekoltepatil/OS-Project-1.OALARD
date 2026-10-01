/**
 * Algorithm metadata used across the UI (labels, colors, descriptions).
 * Pure data — no React.
 */

import type { AlgorithmId } from '../types/scheduling';

export interface AlgorithmInfo {
  readonly id: AlgorithmId;
  readonly name: string;
  readonly short: string;
  readonly color: string;
  readonly type: 'Non-preemptive' | 'Preemptive' | 'Preemptive or non-preemptive';
  readonly concept: string;
  readonly dataStructure: string;
  readonly characteristics: string;
  readonly pros: readonly string[];
  readonly cons: readonly string[];
}

export const ALGORITHM_INFO: Record<AlgorithmId, AlgorithmInfo> = {
  fcfs: {
    id: 'fcfs',
    name: 'First Come First Serve',
    short: 'FCFS',
    color: '#4f8cff',
    type: 'Non-preemptive',
    concept: 'Processes are executed in strict arrival order — the first process to arrive gets the CPU first.',
    dataStructure: 'FIFO queue',
    characteristics: 'Selection depends on process ordering / data structure; arrival-order scan per dispatch.',
    pros: ['Simple and fair in arrival order', 'No starvation', 'No preemption overhead'],
    cons: ['Convoy effect: short jobs wait behind long ones', 'Poor average waiting time for mixed workloads'],
  },
  sjf: {
    id: 'sjf',
    name: 'Shortest Job First',
    short: 'SJF',
    color: '#22c55e',
    type: 'Non-preemptive',
    concept: 'Among arrived processes, the one with the smallest burst time executes first.',
    dataStructure: 'Selection scan over arrived processes',
    characteristics: 'Selection depends on ready-process selection; scans arrived processes per dispatch.',
    pros: ['Optimal average waiting time among non-preemptive policies', 'Minimizes the convoy effect'],
    cons: ['Requires knowing burst times in advance', 'Long jobs can starve under continuous short arrivals'],
  },
  srtf: {
    id: 'srtf',
    name: 'Shortest Remaining Time First',
    short: 'SRTF',
    color: '#f59e0b',
    type: 'Preemptive',
    concept: 'Preemptive version of SJF: a newly arrived process with a shorter remaining burst preempts the running process.',
    dataStructure: 'Event-driven selection over remaining times',
    characteristics: 'Selection depends on event handling / remaining-time selection at each arrival.',
    pros: ['Optimal average waiting time (when bursts are known)', 'Responsive to short jobs'],
    cons: ['Preemption overhead', 'Long jobs may starve', 'Burst times must be known/estimated'],
  },
  rr: {
    id: 'rr',
    name: 'Round Robin',
    short: 'RR',
    color: '#a78bfa',
    type: 'Preemptive',
    concept: 'Each process receives a fixed time quantum; unfinished processes are re-queued at the tail of the ready queue.',
    dataStructure: 'Circular (FIFO) ready queue',
    characteristics: 'Queue-based: O(1) enqueue/dequeue per dispatch; time advances in unit steps.',
    pros: ['Fair sharing, no starvation', 'Good response time for interactive workloads'],
    cons: ['Performance depends heavily on the quantum', 'More context switches than non-preemptive policies'],
  },
  priority: {
    id: 'priority',
    name: 'Priority Scheduling',
    short: 'Priority',
    color: '#ec4899',
    type: 'Preemptive or non-preemptive',
    concept: 'The CPU is assigned to the available process with the highest priority (smaller number = higher priority by default).',
    dataStructure: 'Priority-based selection scan',
    characteristics: 'Priority-based selection over ready processes; preemptive variant re-checks at each arrival.',
    pros: ['Models real-world importance levels', 'Flexible policy via direction and preemption'],
    cons: ['Low-priority processes can starve', 'Needs aging or similar techniques in real systems'],
  },
};

export const ALGORITHM_ORDER: readonly AlgorithmId[] = ['fcfs', 'sjf', 'srtf', 'rr', 'priority'];

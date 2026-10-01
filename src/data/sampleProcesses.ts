/**
 * Predefined sample datasets for instant demonstrations.
 */

import type { Process } from '../types/process';

export interface SampleDataset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly processes: readonly Process[];
}

export const SAMPLE_DATASETS: readonly SampleDataset[] = [
  {
    id: 'basic',
    name: 'Dataset 1 — Basic',
    description: 'A small mixed workload, good for FCFS and SJF.',
    processes: [
      { pid: 'P1', arrivalTime: 0, burstTime: 5, priority: 2 },
      { pid: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
      { pid: 'P3', arrivalTime: 2, burstTime: 8, priority: 3 },
      { pid: 'P4', arrivalTime: 4, burstTime: 2, priority: 2 },
    ],
  },
  {
    id: 'preemptive',
    name: 'Dataset 2 — Preemption Demo',
    description: 'A long job followed by short arrivals — shows SRTF and preemptive Priority taking the CPU away.',
    processes: [
      { pid: 'P1', arrivalTime: 0, burstTime: 8, priority: 3 },
      { pid: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
      { pid: 'P3', arrivalTime: 2, burstTime: 9, priority: 4 },
      { pid: 'P4', arrivalTime: 3, burstTime: 5, priority: 2 },
    ],
  },
  {
    id: 'roundrobin',
    name: 'Dataset 3 — Round Robin',
    description: 'Several medium-length jobs — ideal for watching the ready queue rotate with quantum = 2.',
    processes: [
      { pid: 'P1', arrivalTime: 0, burstTime: 5, priority: 1 },
      { pid: 'P2', arrivalTime: 0, burstTime: 6, priority: 2 },
      { pid: 'P3', arrivalTime: 1, burstTime: 3, priority: 3 },
      { pid: 'P4', arrivalTime: 2, burstTime: 1, priority: 2 },
      { pid: 'P5', arrivalTime: 3, burstTime: 5, priority: 4 },
    ],
  },
  {
    id: 'idle',
    name: 'Dataset 4 — CPU Idle Gap',
    description: 'A late first arrival so the CPU idles at t=0; shows utilization below 100%.',
    processes: [
      { pid: 'P1', arrivalTime: 3, burstTime: 4, priority: 1 },
      { pid: 'P2', arrivalTime: 10, burstTime: 2, priority: 1 },
    ],
  },
];

export const DEFAULT_DATASET: SampleDataset = SAMPLE_DATASETS[0];

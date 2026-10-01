# SchedOS — Interactive CPU Scheduling Simulator

SchedOS is an interactive, browser-based CPU scheduling simulator built for operating-systems
education. Define a set of processes, choose a scheduling policy — **FCFS, SJF, SRTF, Round
Robin, or Priority (preemptive / non-preemptive)** — and watch the scheduler build the
execution timeline step by step, with a live Gantt chart, CPU and ready-queue visualization,
event log, and automatically computed scheduling metrics. Every number shown is derived from
the actual simulation; nothing is hard-coded.

## Features

- **Live System Monitor & OS Processes** — Built-in Node.js server (`systeminformation`) fetches your actual computer's real-time CPU/RAM usage and imports your top running processes into the simulator!
- **5 scheduling policies** with correct, textbook semantics (arrival-aware, tie-breaking documented)
- **Live simulation view** — CPU card, animated ready queue, completed list, simulation clock
- **Interactive Gantt chart** — proportional time scale, explicit IDLE segments, per-block start/end/duration tooltips
- **Step-by-step mode** — advance one time unit at a time; every dispatch, preemption, requeue and completion is logged with a plain-English explanation
- **Playback controls** — play / pause / step / reset with 0.25× – 4× speed (speed never changes the result)
- **Editable process table** — inline editing with validation (unique PID, AT ≥ 0, BT > 0, priority range)
- **Sample datasets** — basic, preemption demo, Round Robin rotation, CPU-idle demo
- **Algorithm comparison** — run the same workload through all five policies and compare metrics side by side
- **Statistics dashboard** — average WT/TAT/RT, CPU utilization, throughput
- **Dark, professional UI** with keyboard shortcuts (`Space` play/pause, `→` step, `R` reset)

## Supported Algorithms

| Algorithm | Type | Data structure | Selection rule |
|---|---|---|---|
| **FCFS** | Non-preemptive | FIFO queue | Earliest arrival (ties: input order) |
| **SJF** | Non-preemptive | Selection scan | Smallest burst among *arrived* (ties: arrival, input order) |
| **SRTF** | Preemptive | Event-driven scan | Smallest *remaining* burst; strictly shorter arrivals preempt (ties keep the runner) |
| **Round Robin** | Preemptive (time-sliced) | Circular FIFO queue | Queue head; up to `q` units, then re-queued at the tail |
| **Priority** | Non-preemptive *or* preemptive | Selection scan | Best (normalized) priority; ties: arrival, input order |

**Conventions** (documented in-app under *Docs & About*):

- Priority direction is configurable: *smaller number = higher priority* (default) or the reverse.
- Round Robin: processes arriving during a slice are admitted **before** the preempted process re-queues.
- CPU idle periods are shown explicitly and never counted as busy time.

## Operating-Systems Concepts Demonstrated

- Process states and transitions (new → ready → running → terminated)
- Ready queue discipline (FIFO, priority ordering, circular queue)
- Preemption and context switches (dispatch / preempt / requeue events)
- The **convoy effect** (FCFS), **starvation** (SJF/SRTF/Priority), and quantum trade-offs (RR)
- CPU utilization vs. idle time; turnaround vs. response time
- Deterministic tie-breaking and scheduling fairness

## Architecture

Scheduling logic is fully separated from the UI (pure TypeScript, no React):

```
Input Processes → Scheduler → Execution Timeline → Metrics Engine → Visualization
```

```
src/
├── algorithms/…                    (see simulation/scheduler/strategies)
├── simulation/
│   ├── scheduler/
│   │   ├── SimulationContext.ts    # shared mutable engine state + event log
│   │   └── strategies/
│   │       ├── fcfs.ts             # each algorithm implemented independently
│   │       ├── sjf.ts
│   │       ├── srtf.ts
│   │       ├── roundRobin.ts
│   │       ├── priority.ts
│   │       ├── nonPreemptive.ts    # shared non-preemptive driver loop
│   │       └── common.ts
│   ├── runSimulation.ts            # strategy → timeline → SimulationResult
│   ├── metrics.ts                  # CT/TAT/WT/RT + summary statistics
│   ├── snapshots.ts                # per-time-unit replay for the live view
│   ├── comparison.ts               # all-algorithms comparison runner
│   └── events.ts                   # human-readable event formatting
├── components/                     # React UI (Header, ControlPanel, ProcessTable,
│                                   # GanttChart, LiveView, MetricsPanel,
│                                   # ComparisonPanel, AlgorithmInfo, StatisticsCards,
│                                   # AboutModal)
├── hooks/
│   ├── useSimulation.ts            # state + playback orchestration
│   └── useKeyboardShortcuts.ts
├── data/
│   ├── sampleProcesses.ts          # 4 demo datasets
│   └── algorithmInfo.ts
├── types/                          # process / scheduling / simulation models
└── utils/                          # validation, formatting, colors
```

## Metrics

For every process, computed from the timeline:

| Metric | Formula |
|---|---|
| Completion Time (CT) | end of the process's last CPU segment |
| Turnaround Time (TAT) | CT − AT |
| Waiting Time (WT) | TAT − BT |
| Response Time (RT) | first CPU start time − AT |
| CPU Utilization | busy time ÷ total execution time × 100 (idle excluded) |
| Throughput | completed processes ÷ total execution time |

## Installation

Requires **Node 18+** (verified on Node v26.8.2 with npm 11.19.1).

```bash
npm install
npm run dev
```

> **Note:** The `npm run dev` command uses `concurrently` to boot up both the Vite frontend server (React) and the Node.js Express backend server (port 3001) simultaneously.

## Live System Integration

This project now includes a **Live System Monitor** component powered by a local Express backend.
1. When you run `npm run dev`, an API spins up on `http://localhost:3001` that uses the `systeminformation` package to fetch your computer's real-time hardware data.
2. The UI will request your permission to view system metrics (CPU load, RAM usage, and active processes).
3. You can click **`+ Live OS`** in the Processes table to map your top actual running processes into the simulator! Their CPU % maps to *Burst Time* and their RAM % maps to *Priority*.

Open the printed local URL — normally `http://localhost:5173`. If that port is
occupied (e.g. another Vite app is running), Vite automatically picks the next
free port (5174, 5175, …); use the URL printed in the terminal.

## Production Build

```bash
npm run build     # type-checks (strict TS) + bundles to dist/
npm run preview   # serve the production build locally
```

## Testing

```bash
npm test          # vitest run — 37 tests
npm run test:watch
```

The suite covers, per algorithm: normal scheduling, same arrival times, CPU idle gaps,
arrival-aware selection (SJF never sorts the whole set), SRTF preemption chains and
equal-remaining ties, RR rotation / requeueing / mid-slice arrivals / quantum 1 / quantum ≫
burst, priority ties and both directions, preemption at the exact same timestamp, large burst
times, the empty-input edge case, metric formulas (CT/TAT/WT/RT), CPU utilization with idle
time, throughput, snapshot replay, comparison-mode invariants (busy time = Σ burst for every
policy), and formatting utilities. Simulations are deterministic, which is what makes
*reset* reliable.

## Algorithm Explanation (implementation notes)

- **FCFS / SJF / non-preemptive Priority** share a driver loop: admit arrivals → select the
  best candidate by the policy's rule → run to completion → repeat. SJF's selection only
  considers processes that have already arrived, so it is *not* a global sort by burst.
- **SRTF** re-evaluates at every arrival: the run is capped at `min(remaining, next arrival)`;
  a strictly shorter remaining time preempts (equal remaining keeps the runner, avoiding
  thrashing).
- **Round Robin** advances in unit steps inside each slice so arrivals are admitted in
  arrival order *before* the preempted process re-queues; queue operations are O(1).
- **Preemptive Priority** mirrors SRTF but compares normalized priority values.
- Complexity: shared loop algorithms are O(n) per scheduling decision (O(n²) worst case);
  RR is O(1) per dispatch with ≈ Σ⌈BT/q⌉ slices. All engines also emit a discrete event log
  for the step view.

## Screenshots

Captured from the running app (Retina, full dashboard):

1. `docs/screenshots/gantt.png` — Gantt chart after an SRTF run on the preemption dataset (P1 → P2 → P4 → P1 → P3 with preemptions)
2. `docs/screenshots/live-view.png` — CPU + ready queue mid-simulation, paused at t=3 with P2 running
3. `docs/screenshots/comparison.png` — all five algorithms compared on the same workload

## Future Improvements

- Priority **aging** to demonstrate starvation prevention
- Multi-level feedback queue
- Extra metrics (context-switch counts, Gantt export as SVG/PNG)
- Adjustable context-switch overhead to quantify its cost
- Interactive "what-if" slider comparing two algorithms at once

---

Built as an educational project — the priority direction, tie-breaking rules and metric
definitions are documented in the in-app **Docs & About** dialog.

> **Verified on:** macOS 27.0.1 (Apple Silicon) · Node v26.8.2 · npm 11.19.1 · Chrome 154 —
> 37 unit tests and a 28-point browser smoke test (headless Chrome driving the real UI:
> dataset loading, play/step/reset, preemption states, process editing, comparison, modal)
> all pass with a clean browser console.

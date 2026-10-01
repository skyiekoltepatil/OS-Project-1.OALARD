import { X } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="about-title">SchedOS — Documentation</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <h3>What is this?</h3>
          <p>
            SchedOS is an interactive CPU scheduling simulator. You define processes
            (arrival time, burst time, priority), choose a scheduling algorithm, and watch the
            scheduler build the execution timeline step by step. Every metric is computed from
            the actual simulation — nothing is hard-coded.
          </p>

          <h3>Scheduling formulas</h3>
          <ul>
            <li><strong>Completion Time (CT)</strong> — time at which the process finishes.</li>
            <li><strong>Turnaround Time (TAT)</strong> = CT − AT.</li>
            <li><strong>Waiting Time (WT)</strong> = TAT − BT.</li>
            <li><strong>Response Time (RT)</strong> = first CPU start time − AT.</li>
            <li><strong>CPU Utilization</strong> = busy time ÷ total execution time × 100. Idle periods are excluded.</li>
            <li><strong>Throughput</strong> = completed processes ÷ total execution time.</li>
          </ul>

          <h3>Conventions</h3>
          <ul>
            <li>Priority: <strong>smaller number = higher priority</strong> by default (direction is switchable).</li>
            <li>Ties break consistently by arrival time, then input order.</li>
            <li>Round Robin: processes arriving during a slice are admitted before the preempted process re-queues.</li>
            <li>CPU idle periods are shown explicitly on the Gantt chart.</li>
          </ul>

          <h3>Suggested demo (3 minutes)</h3>
          <ol>
            <li>Load <em>Dataset 1 — Basic</em>, select FCFS, press Play. Point out the ready queue, the CPU card, and waiting times.</li>
            <li>Reset. Select SRTF and load <em>Dataset 2 — Preemption Demo</em>. Step with → to show P2 arriving at t=1 and preempting P1.</li>
            <li>Reset. Select Round Robin with quantum 2 and load <em>Dataset 3</em>. Watch the queue rotate; use 0.25× speed.</li>
            <li>Open <em>Algorithm Comparison</em> and compare average waiting times for the same workload.</li>
          </ol>

          <h3>Keyboard shortcuts</h3>
          <ul>
            <li><kbd>Space</kbd> — play / pause</li>
            <li><kbd>→</kbd> — step one time unit</li>
            <li><kbd>R</kbd> — reset</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

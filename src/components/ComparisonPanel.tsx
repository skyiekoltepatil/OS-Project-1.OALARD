import { useMemo, useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
import type { Process } from '../types/process';
import type { RunOptions } from '../simulation/scheduler/SimulationContext';
import { runComparison } from '../simulation/comparison';
import { ALGORITHM_INFO, ALGORITHM_ORDER } from '../data/algorithmInfo';
import { formatNumber, formatPercent, formatTime } from '../utils/formatting';

interface ComparisonPanelProps {
  processes: Process[];
  options: RunOptions;
}

export function ComparisonPanel({ processes, options }: ComparisonPanelProps) {
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () => (open && processes.length > 0 ? runComparison(processes, options) : []),
    [open, processes, options],
  );

  return (
    <section className="panel" aria-label="Algorithm comparison">
      <div className="panel-header">
        <h2><GitCompareArrows size={15} /> Algorithm Comparison</h2>
        <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide comparison' : 'Run comparison'}
        </button>
      </div>

      {!open ? (
        <p className="empty-hint">
          Run the same workload through every algorithm to compare trade-offs side by side.
        </p>
      ) : processes.length === 0 ? (
        <p className="empty-hint">Add processes to run a comparison.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table metrics-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th className="num">Avg WT</th>
                  <th className="num">Avg TAT</th>
                  <th className="num">Avg RT</th>
                  <th className="num">CPU Utilization</th>
                  <th className="num">Throughput</th>
                  <th className="num">Total Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.algorithm}>
                    <td className="metric-pid" style={{ color: ALGORITHM_INFO[row.algorithm].color }}>
                      {row.label}
                    </td>
                    <td className="num">{formatNumber(row.summary.avgWaitingTime)}</td>
                    <td className="num">{formatNumber(row.summary.avgTurnaroundTime)}</td>
                    <td className="num">{formatNumber(row.summary.avgResponseTime)}</td>
                    <td className="num">{formatPercent(row.summary.cpuUtilization)}</td>
                    <td className="num">{formatNumber(row.summary.throughput, 3)}</td>
                    <td className="num">{formatTime(row.summary.totalExecutionTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="comparison-notes">
            {ALGORITHM_ORDER.map((id) => (
              <details key={id} className="compare-note">
                <summary style={{ color: ALGORITHM_INFO[id].color }}>
                  {ALGORITHM_INFO[id].short}
                </summary>
                <p>{ALGORITHM_INFO[id].concept}</p>
                <p className="note-tradeoff">
                  Trade-offs: {ALGORITHM_INFO[id].pros.join(' · ')} — but {ALGORITHM_INFO[id].cons.join(' · ')}.
                </p>
              </details>
            ))}
            <p className="note-disclaimer">
              Metrics differ because each policy selects processes differently; no algorithm is
              universally "best" — the table shows trade-offs, not rankings.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

import { Table } from 'lucide-react';
import type { SimulationResult } from '../types/scheduling';
import { formatTime } from '../utils/formatting';

interface MetricsPanelProps {
  result: SimulationResult | null;
}

export function MetricsPanel({ result }: MetricsPanelProps) {
  if (!result || result.segments.length === 0) {
    return (
      <section className="panel" aria-label="Process metrics">
        <div className="panel-header">
          <h2><Table size={15} /> Metrics</h2>
        </div>
        <p className="empty-hint">Metrics appear after a simulation.</p>
      </section>
    );
  }

  const rows = [...result.metrics.values()].sort(
    (a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid, undefined, { numeric: true }),
  );

  return (
    <section className="panel" aria-label="Process metrics">
      <div className="panel-header">
        <h2><Table size={15} /> Metrics</h2>
        <span className="panel-subtitle">CT · TAT = CT − AT · WT = TAT − BT · RT = first start − AT</span>
      </div>
      <div className="table-wrap">
        <table className="data-table metrics-table">
          <thead>
            <tr>
              <th>Process</th>
              <th className="num">AT</th>
              <th className="num">BT</th>
              <th className="num">Priority</th>
              <th className="num">CT</th>
              <th className="num">TAT</th>
              <th className="num">WT</th>
              <th className="num">RT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.pid}>
                <td className="metric-pid">{m.pid}</td>
                <td className="num">{formatTime(m.arrivalTime)}</td>
                <td className="num">{formatTime(m.burstTime)}</td>
                <td className="num">{formatTime(m.priority)}</td>
                <td className="num">{formatTime(m.completionTime)}</td>
                <td className="num">{formatTime(m.turnaroundTime)}</td>
                <td className="num">{formatTime(m.waitingTime)}</td>
                <td className="num">{formatTime(m.responseTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

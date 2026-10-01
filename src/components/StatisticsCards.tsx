import { Activity, BarChart3, Clock3, Gauge, Layers, Timer } from 'lucide-react';
import type { SimulationResult } from '../types/scheduling';
import { formatNumber, formatPercent } from '../utils/formatting';

interface StatisticsCardsProps {
  result: SimulationResult | null;
  processCount: number;
}

export function StatisticsCards({ result, processCount }: StatisticsCardsProps) {
  const s = result?.summary;
  const cards = [
    { icon: Layers, label: 'Processes', value: String(processCount) },
    { icon: Timer, label: 'Avg Waiting Time', value: s ? formatNumber(s.avgWaitingTime) : '—' },
    { icon: Clock3, label: 'Avg Turnaround Time', value: s ? formatNumber(s.avgTurnaroundTime) : '—' },
    { icon: Activity, label: 'Avg Response Time', value: s ? formatNumber(s.avgResponseTime) : '—' },
    { icon: Gauge, label: 'CPU Utilization', value: s ? formatPercent(s.cpuUtilization) : '—' },
    {
      icon: BarChart3,
      label: 'Throughput',
      value: s && s.totalExecutionTime > 0
        ? `${formatNumber(s.throughput, 3)} /unit`
        : '—',
    },
  ];

  return (
    <section className="stats-grid" aria-label="Simulation statistics">
      {cards.map(({ icon: Icon, label, value }) => (
        <div key={label} className="stat-card">
          <div className="stat-icon"><Icon size={16} /></div>
          <div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        </div>
      ))}
    </section>
  );
}

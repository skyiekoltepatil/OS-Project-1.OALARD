import { memo } from 'react';
import { Clock } from 'lucide-react';
import type { SimulationResult } from '../types/scheduling';
import { formatTime } from '../utils/formatting';
import { processColor } from '../utils/processColors';

interface GanttChartProps {
  result: SimulationResult | null;
  currentTime: number;
  hasStarted: boolean;
}

export const GanttChart = memo(function GanttChart({ result, currentTime, hasStarted }: GanttChartProps) {
  if (!result || result.segments.length === 0) {
    return (
      <section className="panel" aria-label="Gantt chart">
        <SectionTitle />
        <p className="empty-hint">Add at least one process to render the execution timeline.</p>
      </section>
    );
  }

  const total = Math.max(...result.segments.map((s) => s.endTime));

  return (
    <section className="panel" aria-label="Gantt chart">
      <SectionTitle />
      <div className="gantt-track" role="img" aria-label="CPU execution timeline">
        {result.segments.map((s, i) => {
          const width = ((s.endTime - s.startTime) / total) * 100;
          const isIdle = s.pid === null;
          const color = isIdle ? 'transparent' : processColor(s.pid!, i);
          const isPast = s.endTime <= currentTime;
          const isCurrent = hasStarted && s.startTime <= currentTime && currentTime < s.endTime;
          const stateClass = !hasStarted ? '' : isCurrent ? 'seg-current' : isPast ? 'seg-past' : 'seg-future';
          return (
            <div
              key={`${s.pid ?? 'idle'}-${s.startTime}-${i}`}
              className={`gantt-seg ${isIdle ? 'seg-idle' : ''} ${stateClass}`}
              style={{ width: `${width}%`, backgroundColor: color }}
              title={
                isIdle
                  ? `CPU idle · ${formatTime(s.startTime)} → ${formatTime(s.endTime)} (${formatTime(s.endTime - s.startTime)})`
                  : `${s.pid} · ${formatTime(s.startTime)} → ${formatTime(s.endTime)} · duration ${formatTime(s.endTime - s.startTime)}`
              }
            >
              <span className="seg-label">{isIdle ? 'IDLE' : s.pid}</span>
              <span className="seg-duration">{formatTime(s.endTime - s.startTime)}</span>
            </div>
          );
        })}
      </div>
      <div className="gantt-ruler" aria-hidden="true">
        {result.segments.map((s, i) => (
          <div key={`tick-${i}`} style={{ width: `${((s.endTime - s.startTime) / total) * 100}%` }}>
            <span className="tick-start">{formatTime(s.startTime)}</span>
            {i === result.segments.length - 1 && <span className="tick-end">{formatTime(s.endTime)}</span>}
          </div>
        ))}
      </div>
    </section>
  );
});

function SectionTitle() {
  return (
    <div className="panel-header">
      <h2>
        <Clock size={15} /> Gantt Chart
      </h2>
      <span className="panel-subtitle">Hover a block for start / end / duration</span>
    </div>
  );
}

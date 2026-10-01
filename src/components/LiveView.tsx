import { memo } from 'react';
import { Cpu, CheckCircle2, ListOrdered, Timer } from 'lucide-react';
import type { Process } from '../types/process';
import type { SimulationSnapshot } from '../types/simulation';
import type { PlaybackState } from '../types/simulation';
import { processColor } from '../utils/processColors';
import { formatTime } from '../utils/formatting';

interface LiveViewProps {
  processes: Process[];
  snapshot: SimulationSnapshot | null;
  playback: PlaybackState;
}

export const LiveView = memo(function LiveView({ processes, snapshot, playback }: LiveViewProps) {
  const colorOf = (pid: string): string => {
    const idx = processes.findIndex((p) => p.pid === pid);
    return processColor(pid, idx);
  };

  const running = snapshot?.runningPid ?? null;
  const queue = snapshot?.readyQueue ?? [];
  const completed = snapshot?.completedPids ?? [];
  const time = snapshot?.time ?? 0;
  const remaining = snapshot?.remainingBurst ?? {};

  return (
    <div className="live-grid">
      <div className="live-card" aria-label="CPU state">
        <div className="live-card-title">
          <Cpu size={15} /> CPU
          <span className={`live-badge badge-${playback}`}>
            {playback === 'running' ? 'RUNNING' : playback.toUpperCase()}
          </span>
        </div>
        <div className="cpu-box">
          {running ? (
            <div className="cpu-process" style={{ borderColor: colorOf(running) }}>
              <span className="cpu-pid" style={{ color: colorOf(running) }}>{running}</span>
              <span className="cpu-remaining">remaining {formatTime(remaining[running] ?? 0)}</span>
            </div>
          ) : (
            <span className="cpu-idle">IDLE</span>
          )}
        </div>
        <div className="sim-time">
          <Timer size={14} /> Simulation time: <strong>{formatTime(time)}</strong>
        </div>
      </div>

      <div className="live-card" aria-label="Ready queue">
        <div className="live-card-title">
          <ListOrdered size={15} /> Ready Queue
        </div>
        {queue.length === 0 ? (
          <p className="empty-hint">Empty</p>
        ) : (
          <div className="queue-row">
            {queue.map((pid, i) => (
              <span key={`${pid}-${i}`} className="queue-item">
                <span className="queue-chip" style={{ borderColor: colorOf(pid), color: colorOf(pid) }}>
                  {pid}
                </span>
                {i < queue.length - 1 && <span className="queue-arrow">→</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="live-card" aria-label="Completed processes">
        <div className="live-card-title">
          <CheckCircle2 size={15} /> Completed
        </div>
        {completed.length === 0 ? (
          <p className="empty-hint">None yet</p>
        ) : (
          <div className="queue-row">
            {completed.map((pid) => (
              <span key={pid} className="queue-chip chip-done" style={{ borderColor: colorOf(pid), color: colorOf(pid) }}>
                {pid}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

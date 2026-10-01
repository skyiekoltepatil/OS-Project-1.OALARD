import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { SystemMonitor } from './components/SystemMonitor';
import { ControlPanel } from './components/ControlPanel';
import { ProcessTable } from './components/ProcessTable';
import { GanttChart } from './components/GanttChart';
import { LiveView } from './components/LiveView';
import { MetricsPanel } from './components/MetricsPanel';
import { ComparisonPanel } from './components/ComparisonPanel';
import { AlgorithmInfoPanel } from './components/AlgorithmInfo';
import { StatisticsCards } from './components/StatisticsCards';
import { AboutModal } from './components/AboutModal';
import { useSimulation } from './hooks/useSimulation';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { RunOptions } from './simulation/scheduler/SimulationContext';

export default function App() {
  const sim = useSimulation();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useKeyboardShortcuts(sim, true);

  const options = useMemo<RunOptions>(
    () => ({
      timeQuantum: sim.timeQuantum,
      preemptive:
        sim.algorithm === 'srtf' || (sim.algorithm === 'priority' && sim.preemption === 'preemptive'),
      highValueIsHighPriority: sim.priorityDirection === 'high-value-first',
    }),
    [sim.algorithm, sim.preemption, sim.priorityDirection, sim.timeQuantum],
  );

  const hasStarted = sim.playback !== 'idle' || sim.currentTime > 0;

  return (
    <div className="app-shell">
      <Header onOpenAbout={() => setAboutOpen(true)} />

      <main className="app-main">
        <SystemMonitor />
        <ControlPanel sim={sim} onNotify={notify} />

        <StatisticsCards result={sim.result} processCount={sim.processes.length} />

        <div className="layout-grid">
          <div className="layout-center">
            <GanttChart result={sim.result} currentTime={sim.currentTime} hasStarted={hasStarted} />
            <LiveView processes={sim.processes} snapshot={sim.snapshot} playback={sim.playback} />
            <MetricsPanel result={sim.result} />
            <ComparisonPanel processes={sim.processes} options={options} />
          </div>
          <aside className="layout-side">
            <ProcessTable sim={sim} />
            <AlgorithmInfoPanel sim={sim} />
          </aside>
        </div>
      </main>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      {toast && (
        <div className="toast" role="status">{toast}</div>
      )}

      <footer className="app-footer">
        <span>SchedOS — an educational CPU scheduling simulator. Metrics computed live from the simulation.</span>
      </footer>
    </div>
  );
}

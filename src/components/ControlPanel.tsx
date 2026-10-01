import {
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import type { SimulationControls } from '../hooks/useSimulation';
import { ALGORITHM_INFO, ALGORITHM_ORDER } from '../data/algorithmInfo';
import { SAMPLE_DATASETS } from '../data/sampleProcesses';

interface ControlPanelProps {
  sim: SimulationControls;
  onNotify: (message: string) => void;
}

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

export function ControlPanel({ sim, onNotify }: ControlPanelProps) {
  const algo = ALGORITHM_INFO[sim.algorithm];
  const isPriority = sim.algorithm === 'priority';
  const isRR = sim.algorithm === 'rr';

  return (
    <section className="panel control-panel" aria-label="Simulation controls">
      <div className="control-row">
        <div className="control-group">
          <label className="control-label" htmlFor="algorithm-select">Algorithm</label>
          <select
            id="algorithm-select"
            className="select"
            value={sim.algorithm}
            onChange={(e) => sim.setAlgorithm(e.target.value as typeof sim.algorithm)}
          >
            {ALGORITHM_ORDER.map((id) => (
              <option key={id} value={id}>{ALGORITHM_INFO[id].name}</option>
            ))}
          </select>
        </div>

        {isRR && (
          <div className="control-group">
            <label className="control-label" htmlFor="quantum-input">Time Quantum</label>
            <input
              id="quantum-input"
              className="input input-quantum"
              type="number"
              min={1}
              step={1}
              value={sim.timeQuantum}
              onChange={(e) => {
                const q = Number(e.target.value);
                if (Number.isInteger(q) && q > 0) sim.setTimeQuantum(q);
              }}
            />
          </div>
        )}

        {isPriority && (
          <>
            <div className="control-group">
              <span className="control-label">Mode</span>
              <div className="segmented" role="group" aria-label="Preemption mode">
                <button
                  className={sim.preemption === 'non-preemptive' ? 'seg-btn active' : 'seg-btn'}
                  onClick={() => sim.setPreemption('non-preemptive')}
                >
                  Non-preemptive
                </button>
                <button
                  className={sim.preemption === 'preemptive' ? 'seg-btn active' : 'seg-btn'}
                  onClick={() => sim.setPreemption('preemptive')}
                >
                  Preemptive
                </button>
              </div>
            </div>
            <div className="control-group">
              <span className="control-label">Priority</span>
              <div className="segmented" role="group" aria-label="Priority direction">
                <button
                  className={sim.priorityDirection === 'low-value-first' ? 'seg-btn active' : 'seg-btn'}
                  onClick={() => sim.setPriorityDirection('low-value-first')}
                  title="Smaller number = higher priority"
                >
                  Low value first
                </button>
                <button
                  className={sim.priorityDirection === 'high-value-first' ? 'seg-btn active' : 'seg-btn'}
                  onClick={() => sim.setPriorityDirection('high-value-first')}
                  title="Larger number = higher priority"
                >
                  High value first
                </button>
              </div>
            </div>
          </>
        )}

        <div className="control-group playback-group">
          <span className="control-label">Simulation</span>
          <div className="playback-buttons">
            <button
              className="btn btn-primary"
              onClick={() => (sim.playback === 'running' ? sim.pause() : sim.play())}
              disabled={sim.processes.length === 0}
              title={sim.playback === 'running' ? 'Pause' : 'Play'}
            >
              {sim.playback === 'running' ? <Pause size={16} /> : <Play size={16} />}
              <span>{sim.playback === 'running' ? 'Pause' : 'Play'}</span>
            </button>
            <button
              className="btn btn-ghost"
              onClick={sim.step}
              disabled={sim.processes.length === 0 || sim.playback === 'finished'}
              title="Advance one time unit"
            >
              <ChevronRight size={16} />
              <span>Step</span>
            </button>
            <button
              className="btn btn-ghost"
              onClick={sim.reset}
              disabled={sim.playback === 'idle' && sim.currentTime === 0}
              title="Reset simulation"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="control-group">
          <span className="control-label">Speed</span>
          <div className="segmented" role="group" aria-label="Playback speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                className={sim.speed === s ? 'seg-btn active' : 'seg-btn'}
                onClick={() => sim.setSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label" htmlFor="dataset-select">Load Example</label>
          <div className="dataset-row">
            <select
              id="dataset-select"
              className="select"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  sim.loadDataset(e.target.value);
                  onNotify(`Loaded ${SAMPLE_DATASETS.find((d) => d.id === e.target.value)?.name ?? 'dataset'}`);
                }
              }}
            >
              <option value="">Choose dataset…</option>
              {SAMPLE_DATASETS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button
              className="btn btn-ghost"
              onClick={() => {
                sim.clearProcesses();
                onNotify('All processes cleared');
              }}
              disabled={sim.processes.length === 0}
              title="Remove all processes"
            >
              <Zap size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      <p className="algo-hint">
        <strong>{algo.short}</strong> — {algo.type}. {algo.concept}
        {isPriority && sim.priorityDirection === 'low-value-first'
          ? ' Direction: smaller number = higher priority.'
          : ''}
        {isPriority && sim.priorityDirection === 'high-value-first'
          ? ' Direction: larger number = higher priority.'
          : ''}
      </p>
    </section>
  );
}

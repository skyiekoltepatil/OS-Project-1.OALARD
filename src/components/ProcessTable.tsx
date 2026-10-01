import { useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import type { Process } from '../types/process';
import type { SimulationControls } from '../hooks/useSimulation';
import {
  validateArrivalTime,
  validateBurstTime,
  validatePid,
  validatePriority,
} from '../utils/validation';

interface ProcessTableProps {
  sim: SimulationControls;
}

interface RowErrors {
  pid?: string;
  arrivalTime?: string;
  burstTime?: string;
  priority?: string;
}

export function ProcessTable({ sim }: ProcessTableProps) {
  const [errors, setErrors] = useState<Record<number, RowErrors>>({});

  const revalidate = (rows: Process[]) => {
    const next: Record<number, RowErrors> = {};
    const pids = rows.map((p) => p.pid);
    rows.forEach((p, i) => {
      const row: RowErrors = {};
      const pidCheck = validatePid(p.pid, pids, i);
      if (!pidCheck.valid) row.pid = pidCheck.message;
      const atCheck = validateArrivalTime(String(p.arrivalTime));
      if (!atCheck.valid) row.arrivalTime = atCheck.message;
      const btCheck = validateBurstTime(String(p.burstTime));
      if (!btCheck.valid) row.burstTime = btCheck.message;
      const prCheck = validatePriority(String(p.priority));
      if (!prCheck.valid) row.priority = prCheck.message;
      if (Object.keys(row).length > 0) next[i] = row;
    });
    setErrors(next);
  };

  const commit = (index: number, patch: Partial<Process>) => {
    const updated = sim.processes.map((p, i) => (i === index ? { ...p, ...patch } : p));
    revalidate(updated);
    sim.updateProcess(index, updated[index]);
  };

  const addProcess = () => {
    const existing = new Set(sim.processes.map((p) => p.pid));
    let n = sim.processes.length + 1;
    while (existing.has(`P${n}`)) n++;
    sim.addProcess({ pid: `P${n}`, arrivalTime: 0, burstTime: 2, priority: 1 });
  };

  const fetchLive = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/processes');
      if (!res.ok) return;
      const data = await res.json();
      
      const newProcesses = data.slice(0, 5).map((p: any, i: number) => ({
        pid: `${p.name.substring(0, 4).toUpperCase()}-${p.id}`,
        arrivalTime: i,
        burstTime: Math.max(1, Math.round(p.cpu)),
        priority: Math.max(1, Math.round(p.memory))
      }));
      
      sim.setProcesses(newProcesses);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="panel" aria-label="Process list">
      <div className="panel-header">
        <h2>Processes</h2>
        <div className="panel-actions">
          <button className="btn btn-ghost" onClick={fetchLive} title="Load real OS processes">
            <Plus size={15} />
            <span>Live OS</span>
          </button>
          <button className="btn btn-ghost" onClick={addProcess}>
            <Plus size={15} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {sim.processes.length === 0 ? (
        <p className="empty-hint">
          No processes. Add one or load an example dataset from the controls above.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>PID</th>
                <th className="num">Arrival</th>
                <th className="num">Burst</th>
                <th className="num">Priority</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sim.processes.map((p, i) => {
                const rowErr = errors[i] ?? {};
                return (
                  <tr key={`${p.pid}-${i}`} className={Object.keys(rowErr).length ? 'row-invalid' : ''}>
                    <td>
                      <input
                        className="cell-input"
                        value={p.pid}
                        aria-label={`PID of row ${i + 1}`}
                        onChange={(e) => commit(i, { pid: e.target.value })}
                      />
                      {rowErr.pid && <span className="cell-error">{rowErr.pid}</span>}
                    </td>
                    <td className="num">
                      <input
                        className="cell-input"
                        type="number"
                        min={0}
                        value={p.arrivalTime}
                        aria-label={`Arrival time of ${p.pid}`}
                        onChange={(e) => commit(i, { arrivalTime: Number(e.target.value) })}
                      />
                      {rowErr.arrivalTime && <span className="cell-error">{rowErr.arrivalTime}</span>}
                    </td>
                    <td className="num">
                      <input
                        className="cell-input"
                        type="number"
                        min={1}
                        value={p.burstTime}
                        aria-label={`Burst time of ${p.pid}`}
                        onChange={(e) => commit(i, { burstTime: Number(e.target.value) })}
                      />
                      {rowErr.burstTime && <span className="cell-error">{rowErr.burstTime}</span>}
                    </td>
                    <td className="num">
                      <input
                        className="cell-input"
                        type="number"
                        min={0}
                        value={p.priority}
                        aria-label={`Priority of ${p.pid}`}
                        onChange={(e) => commit(i, { priority: Number(e.target.value) })}
                      />
                      {rowErr.priority && <span className="cell-error">{rowErr.priority}</span>}
                    </td>
                    <td className="actions-col">
                      <button
                        className="icon-btn"
                        onClick={() => sim.duplicateProcess(i)}
                        title={`Duplicate ${p.pid}`}
                        aria-label={`Duplicate ${p.pid}`}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => {
                          sim.deleteProcess(i);
                          revalidate(sim.processes.filter((_, j) => j !== i));
                        }}
                        title={`Delete ${p.pid}`}
                        aria-label={`Delete ${p.pid}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Server } from 'lucide-react';

interface SystemMetrics {
  cpu: number;
  memory: {
    total: number;
    used: number;
    free: number;
  };
}

interface ProcessMetrics {
  id: number;
  name: string;
  cpu: number;
  memory: number;
  state: string;
}

export function SystemMonitor() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [system, setSystem] = useState<SystemMetrics | null>(null);
  const [processes, setProcesses] = useState<ProcessMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission) return;

    const fetchData = async () => {
      try {
        const sysRes = await fetch('http://localhost:3001/api/system');
        const sysData = await sysRes.json();
        if (sysRes.ok) setSystem(sysData);

        const procRes = await fetch('http://localhost:3001/api/processes');
        const procData = await procRes.json();
        if (procRes.ok) setProcesses(procData);
        setError(null);
      } catch (err) {
        setError('Failed to connect to local server. Make sure it is running on port 3001.');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [hasPermission]);

  if (hasPermission === null) {
    return (
      <div className="panel" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem' }}>
        <Activity className="icon" style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: 'var(--primary-color)' }} />
        <h2 style={{ marginBottom: '1rem' }}>Access System Metrics</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          SchedOS wants to access your computer's real-time CPU, RAM, and active processes. 
          Do you allow this application to read your system data?
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => setHasPermission(true)}>
            Allow Access
          </button>
          <button className="btn btn-secondary" onClick={() => setHasPermission(false)}>
            Deny
          </button>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="panel" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Permission Denied</h2>
        <p>You have chosen not to share system metrics. Restart the app to allow access.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel" style={{ marginBottom: '1.5rem', border: '1px solid var(--danger-color)' }}>
        <h2 className="panel-title"><Activity className="icon" /> Live System Monitor</h2>
        <div style={{ color: 'var(--danger-color)', padding: '1rem' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ marginBottom: '1.5rem' }}>
      <header className="panel-header">
        <h2 className="panel-title">
          <Activity className="icon" /> Live System Monitor
        </h2>
      </header>
      <div className="panel-body">
        {system ? (
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div>
              <strong><Cpu className="icon" size={16}/> CPU Load:</strong> {system.cpu.toFixed(1)}%
            </div>
            <div>
              <strong><Server className="icon" size={16}/> RAM Used:</strong> {(system.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB / {(system.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB
            </div>
          </div>
        ) : (
          <div>Loading system data...</div>
        )}
        
        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>PID</th>
                <th>Name</th>
                <th>CPU %</th>
                <th>RAM %</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {processes.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.cpu.toFixed(1)}</td>
                  <td>{p.memory.toFixed(1)}</td>
                  <td>{p.state}</td>
                </tr>
              ))}
              {processes.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>Loading processes...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

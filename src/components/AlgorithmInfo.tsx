import { GraduationCap } from 'lucide-react';
import type { SimulationControls } from '../hooks/useSimulation';
import { ALGORITHM_INFO } from '../data/algorithmInfo';

interface AlgorithmInfoPanelProps {
  sim: SimulationControls;
}

export function AlgorithmInfoPanel({ sim }: AlgorithmInfoPanelProps) {
  const info = ALGORITHM_INFO[sim.algorithm];

  return (
    <section className="panel" aria-label="Algorithm information">
      <div className="panel-header">
        <h2><GraduationCap size={15} /> About {info.short}</h2>
      </div>
      <dl className="algo-info">
        <dt>Concept</dt>
        <dd>{info.concept}</dd>
        <dt>Type</dt>
        <dd>{info.type}</dd>
        <dt>Data structure</dt>
        <dd>{info.dataStructure}</dd>
        <dt>Simulation characteristics</dt>
        <dd>{info.characteristics}</dd>
        <dt>Strengths</dt>
        <dd>
          <ul className="algo-list">
            {info.pros.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </dd>
        <dt>Limitations</dt>
        <dd>
          <ul className="algo-list">
            {info.cons.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </dd>
      </dl>
    </section>
  );
}

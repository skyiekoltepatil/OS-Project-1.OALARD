/**
 * useKeyboardShortcuts — global keyboard control for the simulator.
 *
 * Space: play/pause · →: step forward · ←: step back · R: reset
 */

import { useEffect } from 'react';
import type { SimulationControls } from './useSimulation';

export function useKeyboardShortcuts(controls: SimulationControls, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Ignore when the user is typing in an input field.
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target?.isContentEditable) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (controls.playback === 'running') controls.pause();
          else controls.play();
          break;
        case 'ArrowRight':
          e.preventDefault();
          controls.step();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          controls.reset(); // left arrow rewinds to start for simplicity
          break;
        case 'r':
        case 'R':
          controls.reset();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [controls, enabled]);
}

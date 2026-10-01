import { BookOpen, Github } from 'lucide-react';

interface HeaderProps {
  onOpenAbout: () => void;
}

export function Header({ onOpenAbout }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="4" rx="1" fill="#4f8cff" />
            <rect x="3" y="10" width="12" height="4" rx="1" fill="#22c55e" />
            <rect x="3" y="16" width="15" height="4" rx="1" fill="#f59e0b" />
          </svg>
        </div>
        <div>
          <h1>SchedOS</h1>
          <p>Interactive CPU Scheduling Simulator</p>
        </div>
      </div>
      <div className="header-actions">
        <button className="btn btn-ghost" onClick={onOpenAbout} aria-label="Open documentation">
          <BookOpen size={16} />
          <span>Docs &amp; About</span>
        </button>
        <a
          className="btn btn-ghost"
          href="https://github.com/"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="GitHub repository"
        >
          <Github size={16} />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
}

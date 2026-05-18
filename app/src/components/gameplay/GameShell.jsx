import { useState } from 'react';

export function GameShell({
  status,
  stage,
  action,
  drawerLabel = 'Table details',
  details,
  footer,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="game-shell">
      <div className="game-status-strip">
        {status}
        {details && (
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            className="game-detail-toggle"
            aria-expanded={detailsOpen}
          >
            {detailsOpen ? 'Hide details' : drawerLabel}
          </button>
        )}
      </div>

      <div className="game-focus-grid">
        <section className="game-stage" aria-label="Vault stage">
          {stage}
        </section>
        <section className="game-action-dock" aria-label="Current action">
          {action}
        </section>
      </div>

      {detailsOpen && (
        <section className="game-detail-drawer" aria-label={drawerLabel}>
          {details}
        </section>
      )}

      {footer && (
        <section className="game-post-action" aria-label="Round outcome">
          {footer}
        </section>
      )}
    </div>
  );
}

export function QuietPanel({ children, className = '' }) {
  return (
    <div className={`game-quiet-panel ${className}`}>
      {children}
    </div>
  );
}

export function StatusPill({ label, value, tone = 'neutral' }) {
  const toneClass = {
    neutral: 'text-vault-text',
    good: 'text-oxide-green',
    warn: 'text-tungsten',
    danger: 'text-signal-red',
    info: 'text-blueprint',
  }[tone] || 'text-vault-text';

  return (
    <div className="min-w-0">
      <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
        {label}
      </span>
      <span className={`block truncate font-mono text-xs ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

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
    <div className="game-shell l-decision-frame">
      <div className="game-status-strip caper-layer caper-layer-information">
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

      <div className="game-focus-grid l-decision">
        <section className="game-stage caper-layer caper-layer-planning l-decision-primary" aria-label="Vault stage">
          {stage}
        </section>
        <section className="game-action-dock caper-layer caper-layer-control l-decision-action" aria-label="Current action">
          {action}
        </section>
      </div>

      {detailsOpen && (
        <section className="game-detail-drawer caper-layer caper-layer-information" aria-label={drawerLabel}>
          {details}
        </section>
      )}

      {footer && (
        <section className="game-post-action caper-layer caper-layer-overlay" aria-label="Round outcome">
          {footer}
        </section>
      )}
    </div>
  );
}

export function QuietPanel({ children, className = '' }) {
  return (
    <div className={`game-quiet-panel caper-layer caper-layer-information ${className}`}>
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
      <span className="type-label block text-vault-text-dim" data-type-contract>
        {label}
      </span>
      <span className={`block truncate font-mono text-xs ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

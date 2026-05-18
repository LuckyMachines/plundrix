import { Link } from 'react-router-dom';

const TONES = {
  good: 'border-oxide-green/35 text-oxide-green bg-oxide-green/8',
  warn: 'border-tungsten/35 text-tungsten bg-tungsten/8',
  danger: 'border-signal-red/35 text-signal-red bg-signal-red/8',
  info: 'border-blueprint/35 text-blueprint bg-blueprint/8',
  neutral: 'border-vault-border text-vault-text bg-vault-dark/35',
};

export function ProofCard({ title, type = 'proof', status, score, summary, source, command, timestamp, tone = 'neutral', action }) {
  return (
    <article className="cohesion-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">{type}</p>
          <h3 className="mt-1 font-display text-xl text-vault-text">{title}</h3>
        </div>
        {(status || score !== undefined) && (
          <span className={`cohesion-badge ${TONES[tone] || TONES.neutral}`}>
            {score !== undefined ? score : status}
          </span>
        )}
      </div>
      {summary && <p className="mt-3 text-sm leading-6 text-vault-text-dim">{summary}</p>}
      <CardMeta source={source} command={command} timestamp={timestamp} />
      {action && <div className="mt-4">{action}</div>}
    </article>
  );
}

export function RiskCard({ severity = 'info', title, evidence, impact, mitigation, owner, command }) {
  const tone = severity === 'red' || severity === 'blocker' || severity === 'danger' ? 'danger' : severity === 'yellow' || severity === 'warn' ? 'warn' : 'info';
  return (
    <article className="cohesion-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg text-vault-text">{title}</h3>
        <span className={`cohesion-badge ${TONES[tone]}`}>{severity}</span>
      </div>
      {evidence && <p className="mt-3 text-sm leading-6 text-vault-text-dim">{Array.isArray(evidence) ? evidence.join(' ') : evidence}</p>}
      {impact && <p className="mt-2 text-sm leading-6 text-vault-text">Impact: {impact}</p>}
      {mitigation && <p className="mt-2 text-sm leading-6 text-vault-text-dim">Mitigation: {mitigation}</p>}
      {(owner || command) && <CardMeta source={owner ? `Owner: ${owner}` : ''} command={command} />}
    </article>
  );
}

export function CommandCard({ command, purpose, safety, status }) {
  return (
    <article className="cohesion-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">{safety || 'command'}</p>
          <code className="mt-1 block break-all rounded bg-vault-dark px-3 py-2 font-mono text-xs text-vault-text">
            {command}
          </code>
        </div>
        {status && <span className={`cohesion-badge ${TONES.info}`}>{status}</span>}
      </div>
      {purpose && <p className="mt-3 text-sm leading-6 text-vault-text-dim">{purpose}</p>}
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(command)}
        className="mt-3 min-h-[44px] rounded border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text hover:border-tungsten/55"
      >
        Copy command
      </button>
    </article>
  );
}

export function EmptyState({ missing, why, action, command }) {
  return (
    <section className="cohesion-empty">
      <p className="label">Empty state</p>
      <h3 className="mt-2 font-display text-xl text-vault-text">{missing}</h3>
      {why && <p className="mt-2 max-w-2xl text-sm leading-6 text-vault-text-dim">{why}</p>}
      {command && <CommandCard command={command} purpose="Suggested next action" />}
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}

export function SavedReportCard({ type, title, status, timestamp, source, to, onOpen }) {
  const content = (
    <>
      <p className="label">{type}</p>
      <h3 className="mt-1 font-display text-lg text-vault-text">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {status && <span className={`cohesion-badge ${TONES.info}`}>{status}</span>}
        {timestamp && <span className="font-mono text-xs text-vault-text-dim">{timestamp}</span>}
      </div>
      {source && <p className="mt-2 text-sm text-vault-text-dim">{source}</p>}
    </>
  );
  if (to) return <Link to={to} className="cohesion-card block hover:border-tungsten/60">{content}</Link>;
  return <button type="button" onClick={onOpen} className="cohesion-card block w-full text-left hover:border-tungsten/60">{content}</button>;
}

export function GlossaryLink({ term }) {
  return (
    <Link to="/glossary" className="text-tungsten underline decoration-tungsten/35 underline-offset-4">
      {term}
    </Link>
  );
}

export function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`cohesion-badge ${TONES[tone] || TONES.neutral}`}>{children}</span>;
}

function CardMeta({ source, command, timestamp }) {
  if (!source && !command && !timestamp) return null;
  return (
    <dl className="mt-4 grid gap-2 font-mono text-xs text-vault-text-dim">
      {source && <div><dt className="uppercase tracking-[0.12em]">Source</dt><dd className="break-words text-vault-text">{source}</dd></div>}
      {timestamp && <div><dt className="uppercase tracking-[0.12em]">Timestamp</dt><dd className="text-vault-text">{timestamp}</dd></div>}
      {command && <div><dt className="uppercase tracking-[0.12em]">Command</dt><dd><code className="break-all text-vault-text">{command}</code></dd></div>}
    </dl>
  );
}

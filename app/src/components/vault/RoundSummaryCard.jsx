import { truncateAddress } from '../../lib/formatting';

export default function RoundSummaryCard({ session }) {
  const summary = session?.latestRoundSummary;
  if (!summary || (!summary.commits && !summary.locks && !summary.tools && !summary.sabotages && !summary.winner)) {
    return null;
  }

  return (
    <div className="border border-vault-border rounded bg-vault-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="font-display text-xs uppercase tracking-[0.3em] text-vault-text-dim">
          Round Summary
        </h3>
        {summary.winner && (
          <span className="font-mono text-xs uppercase tracking-wider text-tungsten">
            Winner {truncateAddress(summary.winner)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Metric label="Commits" value={summary.commits} />
        <Metric label="Locks" value={summary.locks} />
        <Metric label="Tools" value={summary.tools} />
        <Metric label="Hits" value={summary.sabotages} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-vault-border bg-vault-dark/30 px-3 py-2">
      <p className="font-mono text-[11px] uppercase tracking-wider text-vault-text-dim">
        {label}
      </p>
      <p className="font-mono text-lg text-vault-text tabular-nums">{value}</p>
    </div>
  );
}

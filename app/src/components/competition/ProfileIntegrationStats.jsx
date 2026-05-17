export default function ProfileIntegrationStats({ stats }) {
  if (!stats) {
    return (
      <section className="border border-vault-border rounded bg-vault-surface p-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-vault-text-dim">
          Observed Session Story
        </h2>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim">
          No local event history has been observed for this profile yet.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-vault-border rounded bg-vault-surface p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-vault-text-dim">
          Observed Session Story
        </h2>
        <span className="font-mono text-xs uppercase tracking-wider text-blueprint">
          Local integration
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Observed Games" value={stats.gamesPlayed} />
        <Metric label="Locks" value={stats.locksCracked} />
        <Metric label="Tools" value={stats.toolsFound} />
        <Metric label="Sabotage Hits" value={stats.sabotages} />
        <Metric label="Stunned" value={stats.stunned} />
        <Metric label="Commits" value={stats.commits} />
        <Metric label="Wins" value={stats.wins} />
        <Metric label="Score" value={stats.playstyleScore} />
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-vault-border bg-vault-panel/70 px-3 py-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-vault-text-dim">
        {label}
      </div>
      <div className="mt-2 font-mono text-vault-text">{value}</div>
    </div>
  );
}

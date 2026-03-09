import { Link } from 'react-router-dom';
import { formatTimestamp } from '../../lib/formatting';

export default function SeasonOverview({ overview, season }) {
  return (
    <section className="border border-vault-border rounded bg-vault-surface p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-vault-text-dim">
            Live Season
          </p>
          <h2 className="font-display text-3xl uppercase tracking-[0.16em] text-tungsten mt-2">
            {season.label}
          </h2>
          <p className="font-mono text-sm text-vault-text-dim mt-2">
            Runs until {formatTimestamp(season.endsAt)}
          </p>
        </div>
        <Link
          to="/leaderboard"
          className="rounded border border-tungsten/35 px-3 py-2 font-mono text-xs uppercase tracking-[0.22em] text-tungsten hover:bg-tungsten/10"
        >
          View Ladder
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Profiles" value={overview.totalProfiles} />
        <Metric label="Sessions" value={overview.totalSessions} />
        <Metric label="Completed" value={overview.completeSessions} />
        <Metric label="Active" value={overview.activeSessions} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QueueMetric label="Open Tables" value={overview.queueBreakdown.open} />
        <QueueMetric label="Mixed Tables" value={overview.queueBreakdown.mixed} />
        <QueueMetric
          label="Agent Ladders"
          value={overview.queueBreakdown.agent_ladder}
        />
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-vault-border bg-vault-panel/70 px-4 py-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-vault-text-dim">
        {label}
      </div>
      <div className="font-display text-3xl tracking-[0.12em] uppercase text-vault-text mt-2">
        {value}
      </div>
    </div>
  );
}

function QueueMetric({ label, value }) {
  return (
    <div className="rounded border border-vault-border/70 bg-vault-surface/70 px-4 py-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-vault-text-dim">
        {label}
      </div>
      <div className="font-display text-2xl tracking-[0.12em] uppercase text-tungsten mt-2">
        {value}
      </div>
    </div>
  );
}

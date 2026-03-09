import BadgeChip from './BadgeChip';
import TypePill from './TypePill';
import { formatPercent } from '../../lib/formatting';

export default function ProfileSummary({ data }) {
  const { profile, seasonRank, ladderRank } = data;

  return (
    <section className="space-y-6">
      <div className="border border-vault-border rounded bg-vault-surface p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl uppercase tracking-[0.16em] text-tungsten">
            {profile.displayName}
          </h1>
          <TypePill type={profile.type} />
        </div>
        <p className="font-mono text-sm text-vault-text-dim uppercase tracking-[0.22em]">
          {profile.title}
        </p>
        {profile.team ? (
          <p className="font-mono text-sm text-vault-text-dim">Team: {profile.team}</p>
        ) : null}
        {profile.bio ? (
          <p className="text-vault-text-dim max-w-3xl">{profile.bio}</p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Season Rank" value={seasonRank || '--'} />
          <Metric label="Season Points" value={profile.season.points} />
          <Metric label="Win Rate" value={formatPercent(profile.season.winRate)} />
          <Metric label="Ladder Rank" value={ladderRank || '--'} />
        </div>
      </div>

      <div className="border border-vault-border rounded bg-vault-surface p-6 space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-vault-text-dim">
          Badges
        </h2>
        {profile.badges?.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((badge) => (
              <BadgeChip key={badge.id} badge={badge} />
            ))}
          </div>
        ) : (
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim">
            No badges yet.
          </p>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <StatsCard title="Season Stats" stats={profile.season} />
        <StatsCard title="All-Time Stats" stats={profile.allTime} />
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

function StatsCard({ title, stats }) {
  return (
    <div className="border border-vault-border rounded bg-vault-surface p-5">
      <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-vault-text-dim">
        {title}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-sm">
        <StatRow label="Games" value={stats.gamesPlayed} />
        <StatRow label="Wins" value={stats.wins} />
        <StatRow label="Locks" value={stats.locksCracked} />
        <StatRow label="Sabotages" value={stats.sabotages} />
        <StatRow label="Perfect" value={stats.perfectSessions} />
        <StatRow label="Best Streak" value={stats.bestWinStreak} />
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="rounded border border-vault-border/70 bg-vault-panel/70 px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-vault-text-dim">
        {label}
      </div>
      <div className="mt-2 text-vault-text">{value}</div>
    </div>
  );
}

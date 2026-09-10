import { Link } from 'react-router-dom';
import BadgeChip from './BadgeChip';
import TypePill from './TypePill';

export default function LeaderboardTable({
  title,
  entries,
  emptyLabel = 'No leaderboard entries yet.',
}) {
  return (
    <section className="border border-vault-border rounded bg-vault-surface">
      <div className="border-b border-vault-border px-5 py-4">
        <h2 className="font-mono text-xs tracking-beacon text-vault-text-dim uppercase">
          {title}
        </h2>
      </div>

      {entries?.length ? (
        <div className="divide-y divide-vault-border">
          {entries.map((entry) => (
            <div
              key={entry.address}
              className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="min-w-10 text-center">
                  <div className="font-display text-2xl leading-none text-tungsten">
                    #{entry.rank}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/profile/${entry.address}`}
                      className="font-display text-xl tracking-interface uppercase text-vault-text hover:text-tungsten"
                    >
                      {entry.displayName}
                    </Link>
                    <TypePill type={entry.type} />
                  </div>
                  <p className="font-mono text-xs uppercase tracking-beacon text-vault-text-dim">
                    {entry.title}
                  </p>
                  {entry.badges?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {entry.badges.map((badge) => (
                        <BadgeChip key={badge.id} badge={badge} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm font-mono text-vault-text-dim sm:min-w-[14rem]">
                <div>
                  <div className="text-micro uppercase tracking-brand">Points</div>
                  <div className="text-lg text-vault-text">{entry.points}</div>
                </div>
                <div>
                  <div className="text-micro uppercase tracking-brand">Wins</div>
                  <div className="text-lg text-vault-text">{entry.wins ?? entry.ladderWins}</div>
                </div>
                <div>
                  <div className="text-micro uppercase tracking-brand">Games</div>
                  <div className="text-lg text-vault-text">
                    {entry.gamesPlayed ?? entry.ladderGames}
                  </div>
                </div>
                <div>
                  <div className="text-micro uppercase tracking-brand">Form</div>
                  <div className="text-lg text-vault-text">
                    {entry.recentForm?.length ? entry.recentForm.join(' ') : '...'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-center font-mono text-xs uppercase tracking-beacon text-vault-text-dim">
          {emptyLabel}
        </div>
      )}
    </section>
  );
}

import { Link } from 'react-router-dom';
import { truncateAddress } from '../../lib/formatting';

export default function PlaystyleStats({ profiles = [], currentAddress }) {
  const rows = profiles.slice(0, 8);

  return (
    <section className="border border-vault-border rounded bg-vault-surface">
      <div className="border-b border-vault-border px-5 py-4">
        <h2 className="font-mono text-xs tracking-[0.3em] text-vault-text-dim uppercase">
          Local Playstyle Integration
        </h2>
      </div>
      {rows.length ? (
        <div className="divide-y divide-vault-border">
          {rows.map((profile, index) => {
            const isCurrent = profile.address?.toLowerCase?.() === currentAddress?.toLowerCase?.();
            return (
              <div
                key={profile.address}
                className={`px-5 py-4 grid gap-3 md:grid-cols-[4rem_1fr_18rem] md:items-center ${
                  isCurrent ? 'bg-tungsten/5' : ''
                }`}
              >
                <div className="font-display text-2xl text-tungsten">#{index + 1}</div>
                <div>
                  <Link
                    to={`/profile/${profile.address}`}
                    className="font-mono text-sm uppercase tracking-[0.16em] text-vault-text hover:text-tungsten"
                  >
                    {truncateAddress(profile.address)}
                  </Link>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-vault-text-dim mt-1">
                    Score {profile.playstyleScore} // {profile.gamesPlayed} observed game{profile.gamesPlayed === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 font-mono text-xs text-vault-text-dim">
                  <Metric label="Locks" value={profile.locksCracked} />
                  <Metric label="Tools" value={profile.toolsFound} />
                  <Metric label="Hits" value={profile.sabotages} />
                  <Metric label="Wins" value={profile.wins} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-10 text-center font-mono text-xs uppercase tracking-[0.24em] text-vault-text-dim">
          Playstyle stats appear after this browser observes live game events.
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em]">{label}</div>
      <div className="text-vault-text">{value}</div>
    </div>
  );
}

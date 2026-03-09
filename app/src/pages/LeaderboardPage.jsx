import { useState } from 'react';
import Spinner from '../components/shared/Spinner';
import LeaderboardTable from '../components/competition/LeaderboardTable';
import { useLeaderboard } from '../hooks/useLeaderboard';

const FILTERS = [
  { value: 'all', label: 'All Profiles' },
  { value: 'humans', label: 'Humans' },
  { value: 'agents', label: 'Agents + Bots' },
  { value: 'agent_ladder', label: 'Agent Ladder' },
];

export default function LeaderboardPage() {
  const [queue, setQueue] = useState('all');
  const { data, isLoading, error } = useLeaderboard(queue, 30);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-widest text-tungsten uppercase font-display">
            Leaderboards
          </h1>
          <p className="text-vault-text-dim font-mono text-sm mt-2">
            Season standings for humans, bots, and full agent ladders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setQueue(filter.value)}
              className={`rounded border px-3 py-2 font-mono text-xs uppercase tracking-[0.22em] ${
                queue === filter.value
                  ? 'border-tungsten/50 bg-tungsten/10 text-tungsten'
                  : 'border-vault-border text-vault-text-dim hover:bg-vault-panel/70'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Compiling standings..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <LeaderboardTable
          title={`${data.season.label} · ${FILTERS.find((filter) => filter.value === queue)?.label}`}
          entries={data.entries}
        />
      )}
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div className="border border-vault-border rounded bg-vault-surface p-10 flex items-center gap-3 justify-center">
      <Spinner size="w-5 h-5" />
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim">
        {label}
      </span>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="border border-signal-red/35 rounded bg-vault-surface p-8">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-red">
        Failed to load leaderboard
      </p>
      <p className="font-mono text-xs text-vault-text-dim mt-3 break-all">
        {error?.message || String(error)}
      </p>
    </div>
  );
}

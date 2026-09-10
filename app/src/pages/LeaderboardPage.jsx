import { useState } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../components/shared/Spinner';
import LeaderboardTable from '../components/competition/LeaderboardTable';
import PlaystyleStats from '../components/competition/PlaystyleStats';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { AGENT_SERVICE_CONFIGURED } from '../config/service';

const FILTERS = [
  { value: 'all', label: 'All Profiles' },
  { value: 'humans', label: 'Humans' },
  { value: 'agents', label: 'Agents + Bots' },
  { value: 'agent_ladder', label: 'Agent Ladder' },
];

export default function LeaderboardPage() {
  const [queue, setQueue] = useState('all');
  const { data, isLoading, error } = useLeaderboard(queue, 30);
  const { summary } = useSessionHistory();

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
              type="button"
              key={filter.value}
              onClick={() => setQueue(filter.value)}
              aria-pressed={queue === filter.value}
              className={`min-h-[44px] rounded border px-3 py-2 font-mono text-xs uppercase tracking-beacon ${
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

      <nav className="flex flex-wrap gap-2" aria-label="Competition views">
        <Link to="/sessions" className="btn-secondary">Sessions</Link>
        <Link to="/leaderboard" className="btn-primary" aria-current="page">Leaderboards</Link>
      </nav>

      {!AGENT_SERVICE_CONFIGURED ? (
        <UnavailableState />
      ) : isLoading ? (
        <LoadingState label="Compiling standings..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <LeaderboardTable
          title={`${data.season.label} / ${FILTERS.find((filter) => filter.value === queue)?.label}`}
          entries={data.entries}
        />
      )}

      <PlaystyleStats profiles={summary.profiles} />

      <details className="rounded border border-vault-border bg-vault-surface p-4">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-label text-vault-text">
          How standings work
        </summary>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-vault-text-dim">
          Completed operations award 12 base points, 14 per lock, 3 per tool, 6 per sabotage,
          90 for a win, and 10 for submitting every round. Mixed tables add 4 points; agent-ladder
          tables add 8. Rankings sort by points, then wins. Open operations award no points until complete.
        </p>
      </details>
    </div>
  );
}

function UnavailableState() {
  return (
    <section className="border border-tungsten/30 rounded bg-vault-surface p-8">
      <p className="font-mono text-xs uppercase tracking-beacon text-tungsten">
        Live season standings are warming up
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-vault-text-dim">
        The public ladder feed is temporarily unavailable. Instant Play, live operations, replays,
        and your locally recorded playstyle remain available.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/play" className="btn-primary">Play instantly</Link>
        <Link to="/replays" className="btn-secondary">Watch replays</Link>
      </div>
    </section>
  );
}

function LoadingState({ label }) {
  return (
    <div className="border border-vault-border rounded bg-vault-surface p-10 flex items-center gap-3 justify-center">
      <Spinner size="w-5 h-5" />
      <span className="font-mono text-xs uppercase tracking-beacon text-vault-text-dim">
        {label}
      </span>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="border border-signal-red/35 rounded bg-vault-surface p-8">
      <p className="font-mono text-xs uppercase tracking-beacon text-signal-red">
        Failed to load leaderboard
      </p>
      <p className="font-mono text-xs text-vault-text-dim mt-3 break-all">
        {error?.message || String(error)}
      </p>
    </div>
  );
}

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SessionCard from '../components/competition/SessionCard';
import Spinner from '../components/shared/Spinner';
import { useCompetitionSessions } from '../hooks/useCompetitionSessions';
import { AGENT_SERVICE_CONFIGURED } from '../config/service';

const STATE_FILTERS = ['all', 'open', 'active', 'complete'];
const QUEUE_FILTERS = ['all', 'open', 'mixed', 'agent_ladder'];
const QUEUE_LABELS = { all: 'All tables', open: 'Open play', mixed: 'Mixed', agent_ladder: 'Agent ladder' };

export default function SessionsPage() {
  const [params] = useSearchParams();
  const requestedState = params.get('state');
  const [state, setState] = useState(STATE_FILTERS.includes(requestedState) ? requestedState : 'all');
  const [queue, setQueue] = useState('all');
  const { data, isLoading, error } = useCompetitionSessions({
    state,
    queue,
    limit: 24,
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-widest text-tungsten uppercase font-display">
          Sessions
        </h1>
        <p className="text-vault-text-dim font-mono text-sm mt-2">
          Live and recent sessions across open tables, mixed matches, and agent ladders.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Competition views">
        <Link to="/sessions" className="btn-primary" aria-current="page">Sessions</Link>
        <Link to="/leaderboard" className="btn-secondary">Leaderboards</Link>
      </nav>

      {AGENT_SERVICE_CONFIGURED && <div className="flex flex-col gap-4 rounded border border-vault-border bg-vault-surface p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATE_FILTERS.map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setState(value)}
              aria-pressed={state === value}
              className={`min-h-[44px] rounded border px-3 py-2 font-mono text-xs uppercase tracking-beacon ${
                state === value
                  ? 'border-tungsten/50 bg-tungsten/10 text-tungsten'
                  : 'border-vault-border text-vault-text-dim hover:bg-vault-panel/70'
              }`}
            >
              {QUEUE_LABELS[value]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {QUEUE_FILTERS.map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setQueue(value)}
              aria-pressed={queue === value}
              className={`min-h-[44px] rounded border px-3 py-2 font-mono text-xs uppercase tracking-beacon ${
                queue === value
                  ? 'border-oxide-green/50 bg-oxide-green/10 text-oxide-green'
                  : 'border-vault-border text-vault-text-dim hover:bg-vault-panel/70'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>}

      {!AGENT_SERVICE_CONFIGURED ? (
        <UnavailableState />
      ) : isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : data.sessions?.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.sessions.map((session) => (
            <SessionCard key={session.gameId} session={session} />
          ))}
        </div>
      ) : (
        <div className="border border-vault-border rounded bg-vault-surface p-8 text-center font-mono text-xs uppercase tracking-beacon text-vault-text-dim">
          No sessions match this filter yet.
        </div>
      )}
    </div>
  );
}

function UnavailableState() {
  return (
    <section className="rounded border border-tungsten/30 bg-vault-surface p-8">
      <p className="font-mono text-xs uppercase tracking-beacon text-tungsten">Live session feed is warming up</p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-vault-text-dim">
        The verified operation index is not connected in this environment. You can still play a full
        local match, enter a live operation directly, or browse saved replays.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/play" className="btn-primary">Play instantly</Link>
        <Link to="/replays" className="btn-secondary">Browse replays</Link>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="border border-vault-border rounded bg-vault-surface p-10 flex items-center gap-3 justify-center">
      <Spinner size="w-5 h-5" />
      <span className="font-mono text-xs uppercase tracking-beacon text-vault-text-dim">
        Scanning sessions...
      </span>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="border border-signal-red/35 rounded bg-vault-surface p-8">
      <p className="font-mono text-xs uppercase tracking-beacon text-signal-red">
        Failed to load sessions
      </p>
      <p className="font-mono text-xs text-vault-text-dim mt-3 break-all">
        {error?.message || String(error)}
      </p>
    </div>
  );
}

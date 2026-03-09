import { useState } from 'react';
import SessionCard from '../components/competition/SessionCard';
import Spinner from '../components/shared/Spinner';
import { useCompetitionSessions } from '../hooks/useCompetitionSessions';

const STATE_FILTERS = ['all', 'open', 'active', 'complete'];
const QUEUE_FILTERS = ['all', 'open', 'mixed', 'agent_ladder'];

export default function SessionsPage() {
  const [state, setState] = useState('all');
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

      <div className="flex flex-col gap-4 rounded border border-vault-border bg-vault-surface p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATE_FILTERS.map((value) => (
            <button
              key={value}
              onClick={() => setState(value)}
              className={`rounded border px-3 py-2 font-mono text-xs uppercase tracking-[0.22em] ${
                state === value
                  ? 'border-tungsten/50 bg-tungsten/10 text-tungsten'
                  : 'border-vault-border text-vault-text-dim hover:bg-vault-panel/70'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {QUEUE_FILTERS.map((value) => (
            <button
              key={value}
              onClick={() => setQueue(value)}
              className={`rounded border px-3 py-2 font-mono text-xs uppercase tracking-[0.22em] ${
                queue === value
                  ? 'border-oxide-green/50 bg-oxide-green/10 text-oxide-green'
                  : 'border-vault-border text-vault-text-dim hover:bg-vault-panel/70'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
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
        <div className="border border-vault-border rounded bg-vault-surface p-8 text-center font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim">
          No sessions match this filter yet.
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="border border-vault-border rounded bg-vault-surface p-10 flex items-center gap-3 justify-center">
      <Spinner size="w-5 h-5" />
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim">
        Scanning sessions...
      </span>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="border border-signal-red/35 rounded bg-vault-surface p-8">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-red">
        Failed to load sessions
      </p>
      <p className="font-mono text-xs text-vault-text-dim mt-3 break-all">
        {error?.message || String(error)}
      </p>
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AGENT_SERVICE_CONFIGURED } from '../../config/service';
import {
  createManagedOperation,
  ensureManagedPlayer,
  listManagedOperations,
} from '../../lib/managedService';
import { ACTION_STAGE_PRESETS, ActionButtonContent, ActionWaitPanel } from '../shared/ActionFeedback';
import { trackJourneyStep, trackProductEvent } from '../../lib/analytics';

const STATE_TONE = {
  OPEN: 'border-oxide-green/35 bg-oxide-green/5 text-oxide-green',
  ACTIVE: 'border-tungsten/40 bg-tungsten/5 text-tungsten-bright',
  COMPLETE: 'border-vault-border bg-vault-dark/40 text-vault-text-dim',
};

export default function ManagedOperations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pace, setPace] = useState(90);
  const player = useQuery({
    queryKey: ['managed-player'],
    queryFn: ensureManagedPlayer,
    enabled: AGENT_SERVICE_CONFIGURED,
    staleTime: Infinity,
    retry: 1,
  });
  const catalog = useQuery({
    queryKey: ['managed-operations'],
    queryFn: listManagedOperations,
    enabled: player.isSuccess,
    refetchInterval: 12_000,
  });
  const create = useMutation({
    mutationFn: () => createManagedOperation(pace),
    onSuccess: (operation) => {
      trackProductEvent('Live Operation Created', { mode: 'live', pace });
      trackJourneyStep('mode-started', { mode: 'live', pace, surface: 'player-hub' });
      queryClient.invalidateQueries({ queryKey: ['managed-operations'] });
      navigate(`/game/${operation.id}`);
    },
  });

  const operations = catalog.data || [];
  const live = operations.filter((operation) => operation.state !== 'COMPLETE');

  return (
    <section className="border border-vault-border bg-vault-surface" aria-labelledby="live-operations-heading">
      <div className="grid gap-5 border-b border-vault-border p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:p-6">
        <div>
          <p className="font-mono text-micro uppercase tracking-brand text-oxide-green">Live operations</p>
          <h2 id="live-operations-heading" className="mt-2 font-display text-3xl uppercase text-vault-text">Choose a table or open your own</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-vault-text-dim">The game service handles setup and saves every move. You choose the tactics; Plundrix handles the machinery.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 font-mono text-micro uppercase tracking-label text-vault-text-dim">
            Round pace
            <select value={pace} onChange={(event) => setPace(Number(event.target.value))} className="min-h-[44px] border border-vault-border bg-vault-dark px-3 text-xs text-vault-text">
              <option value={45}>Fast / 45 sec</option>
              <option value={90}>Tactical / 90 sec</option>
              <option value={300}>Relaxed / 5 min</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              trackProductEvent('Live Operation Create Started', { mode: 'live', pace });
              create.mutate();
            }}
            disabled={!player.isSuccess || create.isPending}
            aria-busy={create.isPending}
            className="min-h-[44px] border border-tungsten/50 bg-tungsten/10 px-5 font-mono text-xs uppercase tracking-label text-tungsten disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ActionButtonContent active={create.isPending} idle="Create operation" stages={ACTION_STAGE_PRESETS.create} />
          </button>
        </div>
      </div>

      {!AGENT_SERVICE_CONFIGURED && (
        <div className="m-5 border border-tungsten/30 bg-tungsten/5 p-5">
          <p className="font-display text-2xl uppercase text-vault-text">Live tables are warming up</p>
          <p className="mt-2 text-sm leading-6 text-vault-text-dim">Instant Play and Vault Run remain fully available while the hosted table service is connected.</p>
        </div>
      )}

      {AGENT_SERVICE_CONFIGURED && (player.isLoading || catalog.isLoading) && (
        <ActionWaitPanel eyebrow="Opening operations desk" stages={ACTION_STAGE_PRESETS.join} detail="Loading your operator record and available live tables." className="m-5" />
      )}

      {create.isPending && <ActionWaitPanel eyebrow="Creating live operation" stages={ACTION_STAGE_PRESETS.create} detail="Your table is being prepared. You will enter it automatically when it is ready." compact className="m-5" />}

      {(player.error || catalog.error || create.error) && (
        <div className="m-5 flex flex-wrap items-center justify-between gap-3 border border-signal-red/35 bg-signal-red/5 p-4" role="alert">
          <div><p className="font-display text-lg uppercase text-vault-text">Live desk lost contact</p><p className="mt-1 text-sm text-vault-text-dim">{(create.error || catalog.error || player.error)?.message || 'Live operations are temporarily unavailable.'}</p></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { trackProductEvent('Recovery Attempted', { mode: 'live', surface: 'operations-desk' }); player.refetch(); catalog.refetch(); }} className="min-h-[44px] border border-signal-red/45 px-4 font-mono text-xs uppercase text-signal-red">Retry</button>
            <button type="button" onClick={() => window.location.reload()} className="min-h-[44px] border border-vault-border px-4 font-mono text-xs uppercase text-vault-text">Reload</button>
          </div>
        </div>
      )}

      {catalog.isSuccess && (
        <div className="p-5 lg:p-6">
          {live.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {live.map((operation) => (
                <button
                  key={operation.id}
                  type="button"
                  onClick={() => {
                    trackJourneyStep('table-opened', { mode: 'live', state: operation.state.toLowerCase(), surface: 'operations-desk' });
                    navigate(`/game/${operation.id}`);
                  }}
                  className="alive-game-card border border-vault-border bg-vault-dark/45 p-5 text-left transition hover:border-tungsten/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm uppercase tracking-label text-tungsten">OP-{String(operation.id).padStart(3, '0')}</span>
                    <span className={`border px-2 py-1 font-mono text-micro uppercase tracking-label ${STATE_TONE[operation.state] || STATE_TONE.COMPLETE}`}>{operation.state}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div><p className="font-mono text-micro uppercase text-vault-text-dim">Operators</p><p className="mt-1 font-display text-2xl text-vault-text">{operation.playerCount} / 4</p></div>
                    <div><p className="font-mono text-micro uppercase text-vault-text-dim">Round</p><p className="mt-1 font-display text-2xl text-vault-text">{operation.currentRound || '-'}</p></div>
                  </div>
                  <span className="mt-5 block font-mono text-micro uppercase tracking-label text-oxide-green">Enter operation -&gt;</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="border border-oxide-green/25 bg-oxide-green/5 px-5 py-9 text-center">
              <p className="font-display text-2xl uppercase text-vault-text">The first table is yours</p>
              <p className="mt-2 text-sm text-vault-text-dim">Choose a pace and create an operation. Plundrix handles the rest.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

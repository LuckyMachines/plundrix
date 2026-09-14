import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Spinner from '../components/shared/Spinner';
import { AGENT_SERVICE_CONFIGURED } from '../config/service';
import { commandManagedOperation, getManagedOperation } from '../lib/managedService';

const ACTION_COPY = {
  pick: ['Pick', 'Press a lock with your tools and timing.'],
  search: ['Search', 'Trade tempo for more tools.'],
  sabotage: ['Sabotage', 'Stun a rival and disrupt their route.'],
};

export default function ManagedGamePage() {
  const { gameId } = useParams();
  const validId = /^\d+$/.test(gameId || '') && Number(gameId) > 0;
  const queryClient = useQueryClient();
  const [targetSeat, setTargetSeat] = useState('');
  const [notice, setNotice] = useState('');
  const operation = useQuery({
    queryKey: ['managed-operation', gameId],
    queryFn: () => getManagedOperation(gameId),
    enabled: AGENT_SERVICE_CONFIGURED && validId,
    refetchInterval: 4_000,
    retry: 1,
  });
  const command = useMutation({
    mutationFn: ({ name, body }) => commandManagedOperation(gameId, name, body),
    onSuccess: (next, variables) => {
      queryClient.setQueryData(['managed-operation', gameId], next);
      const ownPlayer = next.players?.find((player) => player.you);
      setNotice(variables.name !== 'actions'
        ? 'Operation updated.'
        : next.state === 'COMPLETE'
          ? 'Vault breached. Final result confirmed.'
          : !ownPlayer?.actionSubmitted && !next.resolutionPending
            ? 'Round resolved. Choose your next move.'
            : 'Action locked. Waiting for the rest of the table.');
    },
  });

  const data = operation.data;
  const self = data?.players.find((player) => player.you);
  const opponents = data?.players.filter((player) => !player.you) || [];
  const submitAction = (action) => {
    if (action === 'sabotage' && !targetSeat) {
      setNotice('Choose a sabotage target first.');
      return;
    }
    setNotice('Locking your action...');
    command.mutate({ name: 'actions', body: { action, targetSeat: action === 'sabotage' ? Number(targetSeat) : undefined } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Seo title={`Operation ${gameId || ''} | Plundrix`} description="Play a live Plundrix vault operation." path={`/game/${gameId || ''}`} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-mono text-micro uppercase tracking-label text-oxide-green">Live operation</p><h1 className="mt-2 font-display text-4xl uppercase text-vault-text">Operation {gameId}</h1></div>
        <Link to="/#live-operations" className="inline-flex min-h-[44px] items-center border border-vault-border px-4 font-mono text-xs uppercase text-vault-text-dim">Back to tables</Link>
      </div>

      {(!validId || !AGENT_SERVICE_CONFIGURED) && (
        <div className="border border-signal-red/35 bg-vault-surface p-8 text-center"><p className="font-display text-2xl uppercase text-vault-text">This operation is unavailable</p><p className="mt-2 text-sm text-vault-text-dim">Return to the hub and choose another table.</p></div>
      )}
      {operation.isLoading && <div className="flex items-center justify-center gap-3 border border-vault-border bg-vault-surface p-14"><Spinner size="w-5 h-5" /><span className="font-mono text-xs uppercase tracking-label text-vault-text-dim">Loading operation...</span></div>}
      {(operation.error || command.error) && <p className="border border-signal-red/35 bg-signal-red/5 p-4 text-sm text-vault-text-dim" role="alert">{(command.error || operation.error)?.message}</p>}

      {data && (
        <div className="grid gap-5">
          <section className="border border-vault-border bg-vault-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-vault-border px-5 py-4">
              <div><p className="font-mono text-micro uppercase tracking-label text-vault-text-dim">Status</p><p className="mt-1 font-display text-2xl uppercase text-tungsten-bright">{data.state}</p></div>
              <div className="text-right"><p className="font-mono text-micro uppercase tracking-label text-vault-text-dim">Round</p><p className="mt-1 font-display text-2xl text-vault-text">{data.currentRound || '-'}</p></div>
            </div>
            <div className="grid gap-px bg-vault-border sm:grid-cols-2 lg:grid-cols-4">
              {data.players.map((player) => (
                <article key={player.seat} className={`bg-vault-dark p-4 ${player.you ? 'outline outline-1 outline-inset outline-tungsten/55' : ''}`}>
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-micro uppercase text-vault-text-dim">Seat {player.seat}</span>{player.you && <span className="font-mono text-micro uppercase text-tungsten">You</span>}</div>
                  <h2 className="mt-2 font-display text-xl uppercase text-vault-text">{player.label}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><span className="text-vault-text-dim">Locks <strong className="text-vault-text">{player.locksCracked}/5</strong></span><span className="text-vault-text-dim">Tools <strong className="text-vault-text">{player.tools}</strong></span></div>
                  <p className={`mt-3 font-mono text-micro uppercase ${player.actionSubmitted ? 'text-oxide-green' : 'text-vault-text-dim'}`}>{player.actionSubmitted ? 'Action locked' : 'Choosing action'}</p>
                </article>
              ))}
              {Array.from({ length: Math.max(0, 4 - data.players.length) }, (_, index) => <div key={`open-${index}`} className="grid min-h-[148px] place-items-center bg-vault-dark/75 font-mono text-micro uppercase tracking-label text-vault-text-dim">Open seat</div>)}
            </div>
          </section>

          {data.state === 'OPEN' && (
            <section className="border border-vault-border bg-vault-surface p-6 text-center">
              <h2 className="font-display text-3xl uppercase text-vault-text">Assemble the crew</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-vault-text-dim">Two to four operators can join. Share this page, then start when the table is ready.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {data.canJoin && <button type="button" onClick={() => command.mutate({ name: 'join', body: {} })} disabled={command.isPending} className="min-h-[48px] bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-label text-vault-dark disabled:opacity-45">{command.isPending ? 'Joining...' : 'Join operation'}</button>}
                {data.canStart && <button type="button" onClick={() => command.mutate({ name: 'start', body: {} })} disabled={command.isPending} className="min-h-[48px] border border-oxide-green/55 bg-oxide-green/10 px-6 font-mono text-xs uppercase tracking-label text-oxide-green disabled:opacity-45">{command.isPending ? 'Starting...' : 'Start operation'}</button>}
                {data.participant && !data.canStart && <p className="self-center font-mono text-xs uppercase text-vault-text-dim">Waiting for one more operator...</p>}
              </div>
            </section>
          )}

          {data.state === 'ACTIVE' && (
            <section className="border border-vault-border bg-vault-surface p-5 sm:p-7">
              <div><p className="font-mono text-micro uppercase tracking-label text-tungsten">Your move</p><h2 className="mt-2 font-display text-4xl uppercase text-vault-text">Choose the pressure</h2></div>
              {!data.participant ? <p className="mt-5 border border-vault-border p-4 text-sm text-vault-text-dim">This operation is already active. You can watch the table resolve.</p> : (
                <>
                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {Object.entries(ACTION_COPY).map(([id, [label, copy]]) => (
                      <article key={id} className="border border-vault-border bg-vault-dark/45 p-4">
                        <h3 className="font-display text-2xl uppercase text-vault-text">{label}</h3><p className="mt-2 min-h-10 text-sm text-vault-text-dim">{copy}</p>
                        {id === 'sabotage' && <select aria-label="Sabotage target" value={targetSeat} onChange={(event) => setTargetSeat(event.target.value)} className="mt-4 min-h-[44px] w-full border border-vault-border bg-vault-dark px-3 text-sm text-vault-text"><option value="">Choose target</option>{opponents.map((player) => <option key={player.seat} value={player.seat}>{player.label}</option>)}</select>}
                        <button type="button" onClick={() => submitAction(id)} disabled={command.isPending || self?.actionSubmitted} className="mt-4 min-h-[46px] w-full border border-tungsten/45 bg-tungsten/8 font-mono text-xs uppercase tracking-label text-tungsten disabled:opacity-40">Choose {label}</button>
                      </article>
                    ))}
                  </div>
                  {self?.actionSubmitted && <p className="mt-5 border-l-2 border-oxide-green bg-oxide-green/5 px-4 py-3 text-sm text-vault-text-dim">Your choice is locked. The round resolves when the rest of the table commits.</p>}
                </>
              )}
            </section>
          )}

          {data.state === 'COMPLETE' && (
            <section className="border border-tungsten/45 bg-[radial-gradient(circle_at_top,rgba(196,149,106,0.16),transparent_55%)] p-8 text-center">
              <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Operation complete</p><h2 className="mt-3 font-display text-5xl uppercase text-vault-text">Seat {data.winnerSeat} breached the vault</h2><Link to="/#live-operations" className="mt-6 inline-flex min-h-[48px] items-center bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase text-vault-dark">Find another table</Link>
            </section>
          )}

          {notice && <p className="font-mono text-xs uppercase tracking-label text-oxide-green" role="status">{notice}</p>}
        </div>
      )}
    </div>
  );
}

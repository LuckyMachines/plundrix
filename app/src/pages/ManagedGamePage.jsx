import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { CrewReadinessRail, MissionStatusPanel, OperationFile } from '../components/gameplay/HeistConsolePanels';
import UnifiedActionDeck from '../components/gameplay/UnifiedActionDeck';
import VaultMechanism from '../components/gameplay/VaultMechanism';
import CausalOutcomeSummary from '../components/gameplay/CausalOutcomeSummary';
import { completeFirstMoveCoach } from '../components/gameplay/FirstMoveCoach';
import LobbyContinuityRail from '../components/game/LobbyContinuityRail';
import Seo from '../components/seo/Seo';
import { ACTION_STAGE_PRESETS, ActionButtonContent, ActionWaitPanel } from '../components/shared/ActionFeedback';
import { AGENT_SERVICE_CONFIGURED } from '../config/service';
import { commandManagedOperation, getManagedOperation } from '../lib/managedService';
import { trackJourneyStep, trackProductEvent } from '../lib/analytics';
import { copyText } from '../lib/clipboard';
import { rememberOperation } from '../lib/operationContinuity';

const ACTION_COPY = {
  pick: ['Pick', 'Crack the next lock', 'Press a lock with your tools and timing.'],
  search: ['Search', 'Build tool advantage', 'Trade tempo for more tools and stronger future Pick odds.'],
  sabotage: ['Sabotage', 'Disrupt one rival', 'Stun a rival and interrupt their route.'],
};

function commandStages(commandName) {
  if (commandName === 'join') return ACTION_STAGE_PRESETS.join;
  if (commandName === 'actions') return ACTION_STAGE_PRESETS.reveal;
  return ACTION_STAGE_PRESETS.start;
}

export default function ManagedGamePage() {
  const { gameId } = useParams();
  const validId = /^\d+$/.test(gameId || '') && Number(gameId) > 0;
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState('pick');
  const [targetSeat, setTargetSeat] = useState('');
  const [notice, setNotice] = useState('');
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const lastError = useRef('');
  const operation = useQuery({
    queryKey: ['managed-operation', gameId],
    queryFn: () => getManagedOperation(gameId),
    enabled: AGENT_SERVICE_CONFIGURED && validId,
    refetchInterval: 4_000,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
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
      if (variables.name === 'join') {
        trackProductEvent('Live Operation Joined', { mode: 'live' });
        trackJourneyStep('table-joined', { mode: 'live' });
      } else if (variables.name === 'start') {
        trackProductEvent('Live Operation Started', { mode: 'live' });
        trackJourneyStep('mode-started', { mode: 'live' });
      } else if (variables.name === 'actions') {
        trackProductEvent('Live Action Committed', { mode: 'live', action: variables.body?.action || 'unknown' });
        const key = `plundrix-live-first-action:${gameId}`;
        if (!window.sessionStorage.getItem(key)) {
          window.sessionStorage.setItem(key, 'true');
          trackJourneyStep('first-action', { mode: 'live', action: variables.body?.action || 'unknown' });
        }
      }
    },
  });
  const data = operation.data;
  const self = data?.players.find((player) => player.you);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  useEffect(() => {
    const message = operation.error?.message || command.error?.message || '';
    if (!message || message === lastError.current) return;
    lastError.current = message;
    trackProductEvent('Journey Error', { mode: 'live', surface: 'operation', state: online ? 'service' : 'offline' });
  }, [command.error, online, operation.error]);

  useEffect(() => {
    if (data?.state !== 'COMPLETE') return;
    const key = `plundrix-live-complete:${gameId}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, 'true');
    trackJourneyStep('match-completed', { mode: 'live', result: data.winnerSeat === self?.seat ? 'win' : 'loss' });
  }, [data?.state, data?.winnerSeat, gameId, self?.seat]);

  useEffect(() => {
    if (data?.participant) rememberOperation(data);
  }, [data]);

  const opponents = data?.players.filter((player) => !player.you) || [];
  const uiPlayers = useMemo(() => (data?.players || []).map((player) => ({
    ...player,
    id: player.you ? 'player-1' : `seat-${player.seat}`,
    name: player.label,
    stunned: false,
  })), [data?.players]);
  const uiSelf = uiPlayers.find((player) => player.id === 'player-1') || uiPlayers[0];
  const leader = uiPlayers.reduce((current, candidate) => candidate.locksCracked > current.locksCracked ? candidate : current, uiPlayers[0]);
  const totalLocks = 5;
  const maxTools = Math.max(4, ...uiPlayers.map((player) => player.tools || 0));
  const leaderLocks = Math.max(0, ...uiPlayers.map((player) => player.locksCracked || 0));
  const leaders = uiPlayers.filter((player) => player.locksCracked === leaderLocks);
  const tablePosition = !leaderLocks || leaders.length > 1 ? 'Table even' : leader?.id === uiSelf?.id ? 'You lead' : `${Math.max(0, leaderLocks - (uiSelf?.locksCracked || 0))} locks behind`;
  const pressurePercent = Math.round((leaderLocks / totalLocks) * 100);
  const actionChoices = Object.entries(ACTION_COPY).map(([id, [label, metric, detail]]) => ({ id, identity: id, label, metric, detail }));
  const selectedChoice = actionChoices.find((action) => action.id === selectedAction) || actionChoices[0];
  const actionBusy = command.isPending && command.variables?.name === 'actions';
  const waitingForTable = actionBusy || Boolean(self?.actionSubmitted) || Boolean(data?.resolutionPending);

  const submitAction = () => {
    if (selectedAction === 'sabotage' && !targetSeat) {
      setNotice('Choose a sabotage target first.');
      return;
    }
    completeFirstMoveCoach();
    setNotice('Your move is being sealed.');
    command.mutate({ name: 'actions', body: { action: selectedAction, targetSeat: selectedAction === 'sabotage' ? Number(targetSeat) : undefined } });
  };

  const shareOperation = async () => {
    const url = window.location.href;
    const text = `Join my Plundrix operation ${gameId}.`;
    try {
      if (navigator.share) await navigator.share({ title: `Plundrix operation ${gameId}`, text, url });
      else await copyText(url);
      setNotice('Invitation ready. This table stays saved while the other operator joins.');
      trackProductEvent('Live Operation Shared', { mode: 'live', state: data?.state?.toLowerCase() || 'open' });
      trackJourneyStep('shared', { mode: 'live', state: data?.state?.toLowerCase() || 'open', destination: 'share' });
    } catch (error) {
      if (error?.name !== 'AbortError') setNotice('The invitation could not be copied. You can still share this page address.');
    }
  };

  const retryOperation = async () => {
    setNotice('Reconnecting to the saved table...');
    command.reset();
    const result = await operation.refetch();
    if (!result.error) {
      setNotice('Reconnected. Your latest table state is restored.');
      trackProductEvent('Recovery Completed', { mode: 'live', surface: 'operation', recovery: 'manual' });
      trackJourneyStep('operation-recovered', { mode: 'live', recovery: 'manual' });
    }
  };

  return (
    <div className="caper-operation caper-workbench instant-play-active mx-auto max-w-7xl px-4 py-6 sm:px-6" data-match-state={data?.state === 'ACTIVE' ? 'live-active' : data?.state?.toLowerCase() || 'loading'} data-presentation-phase={actionBusy ? 'sealed' : 'planning'} data-active-route={selectedAction}>
      <Seo title={`Operation ${gameId || ''} | Plundrix`} description="Play a live Plundrix vault operation." path={`/game/${gameId || ''}`} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-mono text-micro uppercase tracking-label text-oxide-green">Live operation {operation.isFetching && data ? '/ syncing' : ''}</p><h1 className="mt-2 font-display text-4xl uppercase text-vault-text">Operation {gameId}</h1></div>
        <div className="flex flex-wrap gap-2">{data?.state !== 'OPEN' && <button type="button" onClick={shareOperation} className="inline-flex min-h-[44px] items-center border border-oxide-green/45 px-4 font-mono text-xs uppercase text-oxide-green">Invite crew</button>}<Link to="/#live-operations" className="inline-flex min-h-[44px] items-center border border-vault-border px-4 font-mono text-xs uppercase text-vault-text-dim">Back to tables</Link></div>
      </div>

      {(!validId || !AGENT_SERVICE_CONFIGURED) && <div className="border border-signal-red/35 bg-vault-surface p-8 text-center"><p className="font-display text-2xl uppercase text-vault-text">This operation is unavailable</p><p className="mt-2 text-sm text-vault-text-dim">Return to the hub and choose another table.</p></div>}
      {operation.isLoading && <ActionWaitPanel eyebrow="Opening live operation" stages={ACTION_STAGE_PRESETS.join} detail="Loading the crew, round, and saved table state." />}
      {(!online || operation.error || command.error) && <div className="flex flex-wrap items-center justify-between gap-4 border border-signal-red/35 bg-signal-red/5 p-4" role="alert"><div><p className="font-display text-xl uppercase text-vault-text">{online ? 'The table lost contact' : 'You are offline'}</p><p className="mt-1 text-sm text-vault-text-dim">{online ? (command.error || operation.error)?.message : 'Your saved seat is safe. Reconnect, then restore the latest table state.'}</p></div><div className="flex gap-2"><button type="button" onClick={retryOperation} disabled={!online || operation.isFetching} className="min-h-[44px] border border-signal-red/45 px-4 font-mono text-xs uppercase text-signal-red disabled:opacity-45">Retry table</button><Link to="/play" className="inline-flex min-h-[44px] items-center border border-vault-border px-4 font-mono text-xs uppercase text-vault-text">Practice instead</Link></div></div>}

      {data?.state === 'OPEN' && (
        <div className="grid gap-5">
          <LobbyContinuityRail steps={[{ label: 'Open table', done: true }, { label: 'Claim your seat', done: Boolean(data.participant) }, { label: 'Bring a second operator', done: data.playerCount >= 2 }, { label: 'Start together', done: Boolean(data.canStart) }]} count={data.playerCount} isRegistered={data.participant} />
          <CrewReadinessRail players={uiPlayers} totalLocks={totalLocks} />
          <section className="border border-vault-border bg-vault-surface p-6 text-center">
            <h2 className="font-display text-3xl uppercase text-vault-text">Assemble the crew</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-vault-text-dim">Two to four operators can join. You can leave and reopen this link in the same browser; your seat and table resume.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {data.canJoin && <button type="button" onClick={() => command.mutate({ name: 'join', body: {} })} disabled={command.isPending} aria-busy={command.isPending} className="min-h-[50px] min-w-[190px] bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-label text-vault-dark disabled:cursor-wait disabled:opacity-75"><ActionButtonContent active={command.isPending} idle="Join operation" stages={ACTION_STAGE_PRESETS.join} /></button>}
              {data.canStart && <button type="button" onClick={() => command.mutate({ name: 'start', body: {} })} disabled={command.isPending} aria-busy={command.isPending} className="min-h-[50px] min-w-[190px] border border-oxide-green/55 bg-oxide-green/10 px-6 font-mono text-xs uppercase tracking-label text-oxide-green disabled:cursor-wait disabled:opacity-75"><ActionButtonContent active={command.isPending} idle="Start operation" stages={ACTION_STAGE_PRESETS.start} /></button>}
              {data.participant && !data.canStart && <p className="self-center font-mono text-xs uppercase text-vault-text-dim">Waiting for one more operator. Your seat is saved.</p>}
              <button type="button" onClick={shareOperation} className="min-h-[50px] border border-vault-border px-6 font-mono text-xs uppercase tracking-label text-vault-text">Copy invite</button>
              {data.participant && !data.canStart && <Link to="/play" onClick={() => trackJourneyStep('continued', { mode: 'live', destination: 'instant-wait-fallback' })} className="inline-flex min-h-[50px] items-center border border-oxide-green/45 px-6 font-mono text-xs uppercase tracking-label text-oxide-green">Practice with agents -&gt;</Link>}
            </div>
            {command.isPending && <ActionWaitPanel active stages={commandStages(command.variables?.name)} eyebrow={command.variables?.name === 'join' ? 'Joining live operation' : 'Starting live operation'} detail="Your request was received. The table will open automatically when it is ready." compact className="mx-auto mt-5 max-w-2xl text-left" />}
          </section>
        </div>
      )}

      {data?.state === 'ACTIVE' && uiSelf && (
        <div className="space-y-5">
          {data.latestOutcomes?.length > 0 && <CausalOutcomeSummary outcomes={data.latestOutcomes} players={uiPlayers} totalLocks={totalLocks} headingId="live-resolution-heading" />}
          <section className={`instant-round-board instant-heist-console caper-layer ${actionBusy ? 'instant-resolving' : ''}`} aria-live="polite">
            <header className="instant-round-header flex flex-wrap items-center justify-between gap-3 border-b border-vault-border px-5 py-4">
              <div><p className="font-mono text-micro uppercase tracking-brand text-oxide-green">Active operation / R{data.currentRound} / {uiSelf.locksCracked} of {totalLocks} locks / {tablePosition}</p><p className="mt-1 font-display text-2xl uppercase text-vault-text">Nightfall vault</p></div>
              <dl className="instant-operation-metrics" aria-label="Live operation status"><div><dt>Operator</dt><dd>{uiSelf.name}</dd></div><div><dt>Table</dt><dd>OP-{String(gameId).padStart(3, '0')}</dd></div><div><dt>Tools</dt><dd>{uiSelf.tools}/{maxTools}</dd></div></dl>
            </header>
            {notice && <p className="border-b border-vault-border bg-oxide-green/5 px-5 py-2 font-mono text-xs text-oxide-green" role="status">{notice}</p>}
            <div className="instant-heist-grid">
              <div className="instant-heist-left">
                <MissionStatusPanel round={data.currentRound} modeLabel="Live" objectives={[{ label: 'Crack all five vault locks', complete: uiSelf.locksCracked >= totalLocks }, { label: 'Build a tool advantage', complete: uiSelf.tools > Math.max(0, ...opponents.map((player) => player.tools)) }, { label: 'Move ahead of every rival', complete: uiSelf.locksCracked > Math.max(0, ...opponents.map((player) => player.locksCracked)) }]} pressurePercent={pressurePercent} pressureValue={leaderLocks} pressureMax={totalLocks} pressureLabel={tablePosition} pressureDetail={!leaderLocks ? 'No locks cracked yet' : `${leader.name} sets the pace / ${leaderLocks} of ${totalLocks}`} />
                <CrewReadinessRail players={uiPlayers} totalLocks={totalLocks} />
              </div>
              <div className="instant-vault-column"><VaultMechanism cracked={uiSelf.locksCracked} total={totalLocks} resolving={waitingForTable} selectedAction={selectedAction} actions={actionChoices} players={uiPlayers} round={data.currentRound} onSelectAction={setSelectedAction} label="Nightfall vault" /></div>
              <OperationFile player={uiSelf} leader={leader} tablePosition={tablePosition} totalLocks={totalLocks} maxTools={maxTools} selectedActionLabel={selectedChoice.label} selectedActionMetric={selectedChoice.metric} selectedActionPreview={selectedChoice.detail} round={data.currentRound} />
            </div>
          </section>

          {data.participant ? <UnifiedActionDeck id="live-table-actions" modeLabel="Live table" round={data.currentRound} actions={actionChoices} selectedAction={selectedAction} busy={waitingForTable} onSelect={setSelectedAction} onCommit={submitAction} commitLabel={`Commit ${selectedChoice.label}`} targets={opponents.map((player) => ({ id: String(player.seat), name: player.label, locksCracked: player.locksCracked }))} selectedTarget={targetSeat} onTarget={setTargetSeat} preview={selectedChoice.detail} firstMoveCoach={data.currentRound === 1} guidance="Pick races now. Search improves future Pick odds. Sabotage disrupts a rival. Everyone reveals together." /> : <p className="border border-vault-border bg-vault-surface p-5 text-sm text-vault-text-dim">This operation is already active. You can watch the table resolve.</p>}
        </div>
      )}

      {data?.state === 'COMPLETE' && <section className="border border-tungsten/45 bg-[radial-gradient(circle_at_top,rgba(196,149,106,0.16),transparent_55%)] p-8 text-center"><p className="font-mono text-micro uppercase tracking-brand text-tungsten">Operation complete</p><h2 className="mt-3 font-display text-5xl uppercase text-vault-text">Seat {data.winnerSeat} breached the vault</h2>{data.latestOutcomes?.length > 0 && <div className="mx-auto mt-6 max-w-3xl text-left"><CausalOutcomeSummary outcomes={data.latestOutcomes} players={uiPlayers} totalLocks={totalLocks} headingId="live-final-resolution-heading" label="Final resolution" /></div>}<div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/play" onClick={() => trackJourneyStep('rematch-started', { mode: 'instant', source: 'live-result', destination: 'rematch' })} className="inline-flex min-h-[48px] items-center bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase text-vault-dark">Play an instant rematch</Link><Link to="/#live-operations" onClick={() => trackJourneyStep('continued', { mode: 'live', destination: 'live-table' })} className="inline-flex min-h-[48px] items-center border border-vault-border px-6 font-mono text-xs uppercase text-vault-text">Find another live table</Link><button type="button" onClick={shareOperation} className="min-h-[48px] border border-oxide-green/45 px-6 font-mono text-xs uppercase text-oxide-green">Share result</button></div></section>}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { CrewReadinessRail, MissionStatusPanel, OperationFile } from '../components/gameplay/HeistConsolePanels';
import UnifiedActionDeck from '../components/gameplay/UnifiedActionDeck';
import VaultMechanism from '../components/gameplay/VaultMechanism';
import Seo from '../components/seo/Seo';
import { ACTION_STAGE_PRESETS, ActionButtonContent, ActionWaitPanel } from '../components/shared/ActionFeedback';
import { AGENT_SERVICE_CONFIGURED } from '../config/service';
import { commandManagedOperation, getManagedOperation } from '../lib/managedService';

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
    setNotice('Your move is being sealed.');
    command.mutate({ name: 'actions', body: { action: selectedAction, targetSeat: selectedAction === 'sabotage' ? Number(targetSeat) : undefined } });
  };

  return (
    <div className="caper-operation caper-workbench instant-play-active mx-auto max-w-7xl px-4 py-6 sm:px-6" data-match-state={data?.state === 'ACTIVE' ? 'live-active' : data?.state?.toLowerCase() || 'loading'} data-presentation-phase={actionBusy ? 'sealed' : 'planning'} data-active-route={selectedAction}>
      <Seo title={`Operation ${gameId || ''} | Plundrix`} description="Play a live Plundrix vault operation." path={`/game/${gameId || ''}`} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-mono text-micro uppercase tracking-label text-oxide-green">Live operation</p><h1 className="mt-2 font-display text-4xl uppercase text-vault-text">Operation {gameId}</h1></div>
        <Link to="/#live-operations" className="inline-flex min-h-[44px] items-center border border-vault-border px-4 font-mono text-xs uppercase text-vault-text-dim">Back to tables</Link>
      </div>

      {(!validId || !AGENT_SERVICE_CONFIGURED) && <div className="border border-signal-red/35 bg-vault-surface p-8 text-center"><p className="font-display text-2xl uppercase text-vault-text">This operation is unavailable</p><p className="mt-2 text-sm text-vault-text-dim">Return to the hub and choose another table.</p></div>}
      {operation.isLoading && <ActionWaitPanel eyebrow="Opening live operation" stages={ACTION_STAGE_PRESETS.join} detail="Loading the crew, round, and saved table state." />}
      {(operation.error || command.error) && <p className="border border-signal-red/35 bg-signal-red/5 p-4 text-sm text-vault-text-dim" role="alert">{(command.error || operation.error)?.message}</p>}

      {data?.state === 'OPEN' && (
        <div className="grid gap-5">
          <CrewReadinessRail players={uiPlayers} totalLocks={totalLocks} />
          <section className="border border-vault-border bg-vault-surface p-6 text-center">
            <h2 className="font-display text-3xl uppercase text-vault-text">Assemble the crew</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-vault-text-dim">Two to four operators can join. Share this page, then start when the table is ready.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {data.canJoin && <button type="button" onClick={() => command.mutate({ name: 'join', body: {} })} disabled={command.isPending} aria-busy={command.isPending} className="min-h-[50px] min-w-[190px] bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-label text-vault-dark disabled:cursor-wait disabled:opacity-75"><ActionButtonContent active={command.isPending} idle="Join operation" stages={ACTION_STAGE_PRESETS.join} /></button>}
              {data.canStart && <button type="button" onClick={() => command.mutate({ name: 'start', body: {} })} disabled={command.isPending} aria-busy={command.isPending} className="min-h-[50px] min-w-[190px] border border-oxide-green/55 bg-oxide-green/10 px-6 font-mono text-xs uppercase tracking-label text-oxide-green disabled:cursor-wait disabled:opacity-75"><ActionButtonContent active={command.isPending} idle="Start operation" stages={ACTION_STAGE_PRESETS.start} /></button>}
              {data.participant && !data.canStart && <p className="self-center font-mono text-xs uppercase text-vault-text-dim">Waiting for one more operator...</p>}
            </div>
            {command.isPending && <ActionWaitPanel active stages={commandStages(command.variables?.name)} eyebrow={command.variables?.name === 'join' ? 'Joining live operation' : 'Starting live operation'} detail="Your request was received. The table will open automatically when it is ready." compact className="mx-auto mt-5 max-w-2xl text-left" />}
          </section>
        </div>
      )}

      {data?.state === 'ACTIVE' && uiSelf && (
        <div className="space-y-5">
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

          {data.participant ? <UnifiedActionDeck id="live-table-actions" kicker="Live table / choose one concealed action" actions={actionChoices} selectedAction={selectedAction} busy={waitingForTable} onSelect={setSelectedAction} onCommit={submitAction} commitLabel={`Commit ${selectedChoice.label}`} targets={opponents.map((player) => ({ id: String(player.seat), name: player.label, locksCracked: player.locksCracked }))} selectedTarget={targetSeat} onTarget={setTargetSeat} preview={selectedChoice.detail} guidance="Pick races now. Search improves future Pick odds. Sabotage disrupts a rival. Everyone reveals together." /> : <p className="border border-vault-border bg-vault-surface p-5 text-sm text-vault-text-dim">This operation is already active. You can watch the table resolve.</p>}
        </div>
      )}

      {data?.state === 'COMPLETE' && <section className="border border-tungsten/45 bg-[radial-gradient(circle_at_top,rgba(196,149,106,0.16),transparent_55%)] p-8 text-center"><p className="font-mono text-micro uppercase tracking-brand text-tungsten">Operation complete</p><h2 className="mt-3 font-display text-5xl uppercase text-vault-text">Seat {data.winnerSeat} breached the vault</h2><Link to="/#live-operations" className="mt-6 inline-flex min-h-[48px] items-center bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase text-vault-dark">Find another table</Link></section>}
    </div>
  );
}

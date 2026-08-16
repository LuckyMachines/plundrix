import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { decodeEventLog } from 'viem';
import { useGameInfo } from '../../hooks/useGameInfo';
import { useGamePlayers } from '../../hooks/useGamePlayers';
import { usePlayerState } from '../../hooks/usePlayerState';
import { useAllActionsSubmitted } from '../../hooks/useAllActionsSubmitted';
import { useGameActions } from '../../hooks/useGameActions';
import { useTxToast } from '../../hooks/useTxToast';
import { useTxCueBridge } from '../../hooks/useTxCueBridge';
import { useGameEvents } from '../../hooks/useGameEvents';
import { useIntegratedSession } from '../../hooks/useIntegratedSession';
import { useSessionCommandLayer } from '../../hooks/useSessionCommandLayer';
import { ROUND_TIMEOUT } from '../../lib/constants';
import { deriveTableMood, deriveVaultReaction, getActionIdentity } from '../../lib/funSystems';
import LockRack from './LockRack';
import RoundConsole from './RoundConsole';
import PlayerDossier from '../../components/player/PlayerDossier';
import ActionPanel from '../../components/actions/ActionPanel';
import ResolveSequence from '../../components/resolution/ResolveSequence';
import ReplayTimeline from '../../components/resolution/ReplayTimeline';
import EventLog from '../shared/EventLog';
import TxStatus from '../shared/TxStatus';
import Spinner from '../shared/Spinner';
import MissionCoach from './MissionCoach';
import TurnAlertButton from '../game/TurnAlertButton';
import SessionIntegrationRail from './SessionIntegrationRail';
import CommandStrip from './CommandStrip';
import RoundSummaryCard from './RoundSummaryCard';
import IntegrationDebugTrace from './IntegrationDebugTrace';
import { useSessionHistoryRecorder } from '../../hooks/useSessionHistory';
import { GameShell, QuietPanel } from '../gameplay/GameShell';
import { LatestEventSurface, MatchStatusStrip, OpponentRail } from '../gameplay/ActiveMatchReadout';
import { NEXT_RULES_ENABLED, PLUNDRIX_ABI, PLUNDRIX_ADDRESS } from '../../config/contract';

export default function VaultBench({ gameId }) {
  const { address } = useAccount();
  const { state, currentRound, playerCount, roundStartTime, isLoading: gameLoading } = useGameInfo(gameId);
  const { players, isLoading: playersLoading } = useGamePlayers(gameId, playerCount);
  const { locksCracked, tools, stunned, registered, actionSubmitted } = usePlayerState(gameId, address);
  const { allSubmitted } = useAllActionsSubmitted(gameId);
  const { data: configuredRoundTimeout } = useReadContract({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'roundTimeoutFor',
    args: [BigInt(gameId)],
    query: { enabled: NEXT_RULES_ENABLED && Boolean(gameId) },
  });
  const roundTimeout = configuredRoundTimeout ? Number(configuredRoundTimeout) : ROUND_TIMEOUT;
  const {
    resolveRound,
    hash: resolveHash,
    receipt: resolveReceipt,
    isPending: resolvePending,
    isConfirming: resolveConfirming,
    isSuccess: resolveSuccess,
    error: resolveError,
    isConfigured,
    configError,
  } = useGameActions();
  useTxToast({ hash: resolveHash, isPending: resolvePending, isConfirming: resolveConfirming, isSuccess: resolveSuccess, error: resolveError }, 'Round resolution');
  useTxCueBridge({
    gameId,
    label: 'Round resolution',
    isPending: resolvePending,
    isConfirming: resolveConfirming,
    isSuccess: resolveSuccess,
    error: resolveError,
  });
  const { events, latestRoundEvents, roundHistory } = useGameEvents(gameId);
  const receiptRoundEvents = useMemo(() => {
    if (!resolveReceipt?.logs) return [];
    return resolveReceipt.logs.flatMap((log) => {
      try {
        const decoded = decodeEventLog({ abi: PLUNDRIX_ABI, data: log.data, topics: log.topics });
        if (decoded.args?.gameID !== BigInt(gameId)) return [];
        return [{
          name: decoded.eventName,
          args: decoded.args,
          blockNumber: resolveReceipt.blockNumber,
          transactionHash: resolveReceipt.transactionHash,
          timestamp: Date.now(),
        }];
      } catch {
        return [];
      }
    });
  }, [gameId, resolveReceipt]);
  const resolutionEvents = receiptRoundEvents.length > 0 ? receiptRoundEvents : latestRoundEvents;

  // Resolution sequence visibility
  const [showResolve, setShowResolve] = useState(false);
  const [actionIntent, setActionIntent] = useState('idle');
  const [targetAddress, setTargetAddress] = useState('');
  const [selectedReplayRound, setSelectedReplayRound] = useState(null);
  useEffect(() => {
    if (resolutionEvents && resolutionEvents.length > 0) {
      setShowResolve(true);
    }
  }, [resolutionEvents]);

  // Timeout tracking
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!roundStartTime) return;
    function check() {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - Number(roundStartTime);
      setTimedOut(elapsed >= roundTimeout);
    }
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [roundStartTime, roundTimeout]);

  const canResolve = allSubmitted || timedOut;
  const isLoading = gameLoading || playersLoading;
  const session = useIntegratedSession({
    gameId,
    gameState: state,
    currentRound,
    playerCount,
    roundStartTime,
    roundTimeout,
    allSubmitted,
    timedOut,
    canResolve,
    events,
    latestRoundEvents,
    roundHistory,
    currentAddress: address,
    connected: !!address,
    registered,
    actionSubmitted,
    stunned,
    locksCracked,
    tools,
    targetAddress,
    actionIntent,
    isConfigured,
    pending: resolvePending,
    confirming: resolveConfirming,
  });
  useSessionHistoryRecorder(session);

  const handleResolve = useCallback(() => {
    resolveRound(gameId);
  }, [gameId, resolveRound]);

  useSessionCommandLayer({
    session,
    players,
    currentAddress: address,
    targetAddress,
    onResolve: handleResolve,
    onTargetChange: setTargetAddress,
    resolveDisabled: resolvePending || resolveConfirming || !isConfigured,
  });

  const latestEvent = events[events.length - 1];
  const tableMood = useMemo(
    () => deriveTableMood({
      session,
      currentRound,
      canResolve,
      events,
      latestRoundEvents,
      state: {
        state,
        currentRound,
        players: [{ locksCracked: Number(locksCracked || 0) }],
      },
    }),
    [canResolve, currentRound, events, latestRoundEvents, locksCracked, session, state],
  );
  const vaultReaction = useMemo(
    () => deriveVaultReaction({
      state: { state },
      locksCracked: Number(locksCracked || 0),
      latestEvent,
      actionIntent,
    }),
    [actionIntent, latestEvent, locksCracked, state],
  );
  const actionIdentity = useMemo(
    () => getActionIdentity(actionSubmitted ? 'committed' : actionIntent),
    [actionIntent, actionSubmitted],
  );

  if (isLoading) {
    return (
      <div className="border border-vault-border rounded bg-vault-panel p-12 flex items-center justify-center gap-3">
        <Spinner size="w-5 h-5" />
        <span className="font-mono text-xs text-vault-text-dim tracking-wider uppercase">
          Loading vault bench...
        </span>
      </div>
    );
  }

  return (
    <div
      className="fun-game-state"
      data-table-mood={tableMood.id}
      data-vault-reaction={vaultReaction.id}
      data-action-identity={actionIdentity.id}
    >
    <GameShell
      status={(
        <MatchStatusStrip
          gameId={gameId}
          currentRound={currentRound}
          playerCount={playerCount}
          allSubmitted={allSubmitted}
          canResolve={canResolve}
          session={session}
          resolveBusy={resolvePending || resolveConfirming}
        />
      )}
      stage={(
        <div className="grid w-full max-w-5xl gap-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
            <div className="flex min-h-[220px] items-center justify-center">
              <LockRack
                locksCracked={locksCracked}
                session={session}
                vaultReaction={vaultReaction}
                actionIdentity={actionIdentity}
              />
            </div>
            <QuietPanel className="flex justify-center">
              <RoundConsole
                currentRound={currentRound}
                roundStartTime={roundStartTime}
                roundTimeout={roundTimeout}
                allSubmitted={allSubmitted}
                gameState={state}
                canResolve={canResolve}
                session={session}
              />
            </QuietPanel>
          </div>
          <OpponentRail
            gameId={gameId}
            players={players}
            currentAddress={address}
            targetAddress={targetAddress}
            latestCue={session.latestCue}
            session={session}
          />
          <LatestEventSurface event={events[events.length - 1]} />
        </div>
      )}
      action={(
        <div className="grid gap-4">
          <MissionCoach
            connected={!!address}
            registered={registered}
            actionSubmitted={actionSubmitted}
            stunned={stunned}
            tools={tools}
            canResolve={canResolve}
            allSubmitted={allSubmitted}
            session={session}
          />
          <TurnAlertButton
            currentRound={currentRound}
            gameState={state}
            actionSubmitted={actionSubmitted}
          />
          <ActionPanel
            gameId={gameId}
            isConfigured={isConfigured}
            configError={configError}
            stunned={stunned}
            registered={registered}
            actionSubmitted={actionSubmitted}
            tools={tools}
            players={players}
            currentAddress={address}
            session={session}
            onIntentChange={setActionIntent}
            onTargetChange={setTargetAddress}
            quiet
          />
          {canResolve && (
            <QuietPanel className="border-oxide-green/35">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-mono text-xs text-oxide-green uppercase tracking-wider">
                    {allSubmitted ? 'All actions submitted' : 'Round timeout reached'}
                  </h4>
                  <p className="font-mono text-xs text-vault-text-dim mt-1">
                    Resolve to advance.
                  </p>
                </div>
                <button
                  onClick={handleResolve}
                  disabled={!isConfigured || resolvePending || resolveConfirming}
                  className={`
                    min-h-[44px] rounded px-5 py-2 font-mono text-xs uppercase tracking-[0.16em]
                    border transition-all duration-200
                    ${resolvePending || resolveConfirming
                      ? 'border-vault-border bg-vault-dark/40 text-vault-text-dim cursor-not-allowed'
                      : 'border-oxide-green/50 bg-oxide-green/10 text-oxide-green hover:bg-oxide-green/20'
                    }
                  `}
                >
                  {resolvePending || resolveConfirming ? 'Resolving' : 'Resolve'}
                </button>
              </div>
              <TxStatus
                hash={resolveHash}
                isPending={resolvePending}
                isConfirming={resolveConfirming}
                isSuccess={resolveSuccess}
                error={resolveError}
              />
              {!isConfigured && (
                <p className="font-mono text-xs text-signal-red mt-2">
                  {configError}
                </p>
              )}
            </QuietPanel>
          )}
        </div>
      )}
      details={(
        <div className="grid gap-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)]">
            <div className="grid gap-5">
              <SessionIntegrationRail session={session} />
              <CommandStrip
                session={session}
                onHelp={() => window.dispatchEvent(new CustomEvent('plundrix:open-help', { detail: { tab: 'actions' } }))}
              />
              <RoundSummaryCard session={session} />
              <ReplayTimeline
                roundHistory={roundHistory}
                currentAddress={address}
                session={session}
                selectedRound={selectedReplayRound}
                onSelectedRoundChange={setSelectedReplayRound}
              />
              <EventLog events={events} cues={session.eventCues} focusRound={selectedReplayRound} />
              <IntegrationDebugTrace session={session} />
            </div>
            <div className="grid gap-3 content-start">
              <h3 className="text-xs tracking-[0.18em] text-vault-text-dim uppercase font-display">
                Full player details
              </h3>
              {players.map((addr) => (
                <PlayerDossier
                  key={addr}
                  gameId={gameId}
                  address={addr}
                  isCurrentUser={addr?.toLowerCase() === address?.toLowerCase()}
                  targeted={addr?.toLowerCase() === targetAddress?.toLowerCase()}
                  latestCue={session.latestCue}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      footer={showResolve && resolutionEvents && resolutionEvents.length > 0 ? (
        <ResolveSequence
          roundEvents={resolutionEvents}
          currentAddress={address}
          onComplete={() => setShowResolve(false)}
        />
      ) : null}
    />
    </div>
  );
}


import { useCallback, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
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
import SessionIntegrationRail from './SessionIntegrationRail';
import CommandStrip from './CommandStrip';
import RoundSummaryCard from './RoundSummaryCard';
import IntegrationDebugTrace from './IntegrationDebugTrace';
import { useSessionHistoryRecorder } from '../../hooks/useSessionHistory';

export default function VaultBench({ gameId }) {
  const { address } = useAccount();
  const { state, currentRound, playerCount, roundStartTime, isLoading: gameLoading } = useGameInfo(gameId);
  const { players, isLoading: playersLoading } = useGamePlayers(gameId, playerCount);
  const { locksCracked, tools, stunned, registered, actionSubmitted } = usePlayerState(gameId, address);
  const { allSubmitted } = useAllActionsSubmitted(gameId);
  const {
    resolveRound,
    hash: resolveHash,
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

  // Resolution sequence visibility
  const [showResolve, setShowResolve] = useState(false);
  const [actionIntent, setActionIntent] = useState('idle');
  const [targetAddress, setTargetAddress] = useState('');
  const [selectedReplayRound, setSelectedReplayRound] = useState(null);
  useEffect(() => {
    if (latestRoundEvents && latestRoundEvents.length > 0) {
      setShowResolve(true);
    }
  }, [latestRoundEvents]);

  // Timeout tracking
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!roundStartTime) return;
    function check() {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - Number(roundStartTime);
      setTimedOut(elapsed >= ROUND_TIMEOUT);
    }
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [roundStartTime]);

  const canResolve = allSubmitted || timedOut;
  const isLoading = gameLoading || playersLoading;
  const session = useIntegratedSession({
    gameId,
    gameState: state,
    currentRound,
    playerCount,
    roundStartTime,
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
    <div className="space-y-6">
      <SessionIntegrationRail session={session} />
      <CommandStrip
        session={session}
        onHelp={() => window.dispatchEvent(new CustomEvent('plundrix:open-help', { detail: { tab: 'actions' } }))}
      />

      {/* ---- Top instrument panel: 3 columns ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Left: Lock Rack */}
        <div className="border border-vault-border rounded bg-vault-panel p-4 flex items-center justify-center overflow-hidden">
          <LockRack locksCracked={locksCracked} session={session} />
        </div>

        {/* Center: Round Console */}
        <div className="border border-vault-border rounded bg-vault-panel p-4 flex items-center justify-center">
          <RoundConsole
            currentRound={currentRound}
            roundStartTime={roundStartTime}
            allSubmitted={allSubmitted}
            gameState={state}
            canResolve={canResolve}
            session={session}
          />
        </div>

        {/* Right: Player Dossiers */}
        <div className="border border-vault-border rounded bg-vault-panel p-4">
          <h3 className="text-xs tracking-[0.35em] text-vault-text-dim uppercase font-display mb-3">
            Field Operatives
          </h3>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
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

      {/* ---- Action Panel ---- */}
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

      <div className="border border-vault-border rounded bg-vault-panel p-4">
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
        />
      </div>

      {/* ---- Resolve Round ---- */}
      {canResolve && (
        <div className="border border-oxide-green/30 rounded bg-vault-panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-mono text-xs text-oxide-green uppercase tracking-wider">
                {allSubmitted ? 'All actions submitted' : 'Round timeout reached'}
              </h4>
              <p className="font-mono text-xs text-vault-text-dim mt-1">
                Resolve to advance to the next round.
              </p>
            </div>
            <button
              onClick={() => resolveRound(gameId)}
              disabled={!isConfigured || resolvePending || resolveConfirming}
              className={`
                py-2 px-6 rounded font-mono text-xs uppercase tracking-[0.2em]
                border transition-all duration-200
                ${resolvePending || resolveConfirming
                  ? 'border-vault-border bg-vault-dark/40 text-vault-text-dim cursor-not-allowed'
                  : 'border-oxide-green/50 bg-oxide-green/10 text-oxide-green hover:bg-oxide-green/20 hover:shadow-[0_0_12px_rgba(64,160,128,0.15)] active:bg-oxide-green/25'
                }
              `}
            >
              {resolvePending || resolveConfirming
                ? 'Resolving...'
                : timedOut && !allSubmitted
                  ? 'Resolve (AFK players will auto-PICK)'
                  : 'Resolve Round'}
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
        </div>
      )}

      {/* ---- Resolution Sequence ---- */}
      {showResolve && latestRoundEvents && latestRoundEvents.length > 0 && (
        <ResolveSequence
          roundEvents={latestRoundEvents}
          currentAddress={address}
          onComplete={() => setShowResolve(false)}
        />
      )}

      <RoundSummaryCard session={session} />

      <ReplayTimeline
        roundHistory={roundHistory}
        currentAddress={address}
        session={session}
        selectedRound={selectedReplayRound}
        onSelectedRoundChange={setSelectedReplayRound}
      />

      {/* ---- Event Log ---- */}
      <EventLog events={events} cues={session.eventCues} focusRound={selectedReplayRound} />

      <IntegrationDebugTrace session={session} />
    </div>
  );
}


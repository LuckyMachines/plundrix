import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useGameInfo } from '../../hooks/useGameInfo';
import { useGamePlayers } from '../../hooks/useGamePlayers';
import { usePlayerState } from '../../hooks/usePlayerState';
import { useAllActionsSubmitted } from '../../hooks/useAllActionsSubmitted';
import { useGameActions } from '../../hooks/useGameActions';
import { useTxToast } from '../../hooks/useTxToast';
import { useGameEvents } from '../../hooks/useGameEvents';
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
  const { events, latestRoundEvents, roundHistory } = useGameEvents(gameId);

  // Resolution sequence visibility
  const [showResolve, setShowResolve] = useState(false);
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

  useEffect(() => {
    if (!canResolve) return;

    const onKeyDown = (e) => {
      if (e.key.toLowerCase() !== 'r') return;
      if (resolvePending || resolveConfirming || !isConfigured) return;
      const tag = e.target?.tagName?.toLowerCase();
      const isTypingContext =
        tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
      if (isTypingContext) return;
      e.preventDefault();
      resolveRound(gameId);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canResolve, resolvePending, resolveConfirming, isConfigured, resolveRound, gameId]);

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
      {/* ---- Top instrument panel: 3 columns ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Lock Rack */}
        <div className="border border-vault-border rounded bg-vault-panel p-4 flex items-center justify-center overflow-hidden">
          <LockRack locksCracked={locksCracked} />
        </div>

        {/* Center: Round Console */}
        <div className="border border-vault-border rounded bg-vault-panel p-4 flex items-center justify-center">
          <RoundConsole
            currentRound={currentRound}
            roundStartTime={roundStartTime}
            allSubmitted={allSubmitted}
            gameState={state}
            canResolve={canResolve}
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

      <ReplayTimeline roundHistory={roundHistory} currentAddress={address} />

      {/* ---- Event Log ---- */}
      <EventLog events={events} />
    </div>
  );
}


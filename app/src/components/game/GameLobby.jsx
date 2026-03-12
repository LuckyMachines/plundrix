import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useGameInfo } from '../../hooks/useGameInfo';
import { useGamePlayers } from '../../hooks/useGamePlayers';
import { usePlayerState } from '../../hooks/usePlayerState';
import { useHasRole } from '../../hooks/useHasRole';
import { useGameActions } from '../../hooks/useGameActions';
import { useTxToast } from '../../hooks/useTxToast';
import { PLUNDRIX_ABI, PLUNDRIX_ADDRESS, IS_CONTRACT_CONFIGURED } from '../../config/contract';
import { truncateAddress } from '../../lib/formatting';
import TxStatus from '../shared/TxStatus';
import Spinner from '../shared/Spinner';

export default function GameLobby({ gameId }) {
  const { address } = useAccount();

  // --- read contract data (using shared hooks with polling) ---
  const { playerCount, isLoading: loadingInfo } = useGameInfo(gameId);
  const count = Number(playerCount || 0);
  const { players, isLoading: loadingPlayers } = useGamePlayers(gameId, count);
  const { registered: isRegistered, isLoading: loadingPlayer } = usePlayerState(gameId, address);
  const { hasRole: isGameMaster } = useHasRole(address);

  // Read game mode info
  const { data: gameModeData } = useReadContract({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'getGameMode',
    args: [gameId],
    query: { enabled: IS_CONTRACT_CONFIGURED },
  });
  const [mode, entryFee, pot] = gameModeData || [0, 0n, 0n];
  const isStakes = Number(mode) === 1;

  const canStart = !!address && (isGameMaster || isRegistered);
  const steps = [
    { label: 'Connect wallet', done: !!address },
    { label: 'Join operation', done: !!isRegistered },
    { label: 'Minimum 2 crew', done: count >= 2 },
    { label: 'Start operation', done: count >= 2 && canStart },
  ];

  // --- write actions ---
  const {
    registerPlayer,
    startGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isConfigured,
    configError,
  } = useGameActions();
  useTxToast({ hash, isPending, isConfirming, isSuccess, error }, 'Lobby');

  if (loadingInfo) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="border border-vault-border rounded bg-vault-panel">
      {/* Header stamp */}
      <div className="border-b border-vault-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-[0.25em] text-tungsten uppercase font-display">
            Operation Briefing
          </h2>
          <span className="font-mono text-xs text-vault-text-dim bg-vault-dark/50 border border-vault-border rounded px-2 py-0.5">
            #{gameId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isStakes && (
            <span className="font-mono text-xs tracking-widest uppercase text-signal-red border border-signal-red/30 rounded px-2 py-0.5 bg-signal-red/5">
              Stakes
            </span>
          )}
          <span className="font-mono text-xs tracking-widest uppercase text-tungsten-bright border border-tungsten/30 rounded px-2 py-0.5 bg-tungsten/5">
            Open
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {/* Stakes info */}
        {isStakes && (
          <div className="border border-signal-red/30 bg-signal-red/5 rounded p-3 space-y-1">
            <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-signal-red">
              Stakes Mode
            </h3>
            <p className="font-mono text-xs text-vault-text">
              Entry Fee: <span className="text-tungsten-bright">{formatEther(entryFee)} ETH</span>
            </p>
            <p className="font-mono text-xs text-vault-text">
              Current Pot: <span className="text-tungsten-bright">{formatEther(pot)} ETH</span>
            </p>
          </div>
        )}

        {!isStakes && (
          <div className="border border-vault-border/70 bg-vault-dark/30 rounded p-3">
            <p className="font-mono text-xs text-vault-text-dim italic">
              Free-play mode -- game may stall if players go AFK.
            </p>
          </div>
        )}

        <div className="border border-vault-border/70 bg-vault-dark/40 rounded p-3">
          <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-vault-text-dim mb-2">
            Launch Checklist
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {steps.map((step) => (
              <div
                key={step.label}
                className={`font-mono text-xs px-2 py-1 rounded border ${
                  step.done
                    ? 'text-oxide-green border-oxide-green/30 bg-oxide-green/10'
                    : 'text-vault-text-dim border-vault-border bg-vault-panel'
                }`}
              >
                {step.done ? 'DONE' : 'PENDING'} // {step.label}
              </div>
            ))}
          </div>
        </div>

        {/* Crew manifest */}
        <div>
          <h3 className="font-mono text-xs tracking-[0.3em] text-vault-text-dim uppercase mb-3">
            Crew Manifest ({count} enrolled)
          </h3>

          {loadingPlayers ? (
            <div className="flex items-center gap-2 text-vault-text-dim text-xs">
              <Spinner size="w-3.5 h-3.5" />
              <span>Loading roster...</span>
            </div>
          ) : players.length === 0 ? (
            <p className="font-mono text-xs text-vault-text-dim italic">
              No operatives registered yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {players.map((addr, i) => (
                <li key={addr} className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-vault-text-dim w-4 text-right">{i + 1}.</span>
                  <span className={`${addr?.toLowerCase() === address?.toLowerCase() ? 'text-tungsten-bright' : 'text-vault-text'}`}>
                    {truncateAddress(addr)}
                  </span>
                  {addr?.toLowerCase() === address?.toLowerCase() && (
                    <span className="text-xs text-tungsten/70 uppercase tracking-wider">(you)</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-vault-border/50">
          {!address && (
            <p className="self-center font-mono text-xs text-vault-text-dim italic">
              Connect a wallet to join or start this operation.
            </p>
          )}

          {!isRegistered && address && (
            <button
              onClick={() => registerPlayer(gameId, isStakes ? entryFee : undefined)}
              disabled={!isConfigured || isPending || isConfirming}
              className="px-4 py-2 bg-tungsten/10 border border-tungsten/40 rounded text-tungsten text-xs font-mono tracking-widest uppercase
                         hover:bg-tungsten/20 hover:border-tungsten/60 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending || isConfirming ? (
                <span className="flex items-center gap-2">
                  <Spinner size="w-3 h-3" /> Processing...
                </span>
              ) : (
                'Join Operation'
              )}
            </button>
          )}

          {canStart && (
            <button
              onClick={() => startGame(gameId)}
              disabled={!isConfigured || loadingPlayer || isPending || isConfirming || count < 2}
              className="px-4 py-2 bg-oxide-green/10 border border-oxide-green/40 rounded text-oxide-green text-xs font-mono tracking-widest uppercase
                         hover:bg-oxide-green/20 hover:border-oxide-green/60 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending || isConfirming ? (
                <span className="flex items-center gap-2">
                  <Spinner size="w-3 h-3" /> Processing...
                </span>
              ) : (
                'Start Operation'
              )}
            </button>
          )}

          {canStart && count < 2 && (
            <p className="self-center font-mono text-xs text-vault-text-dim italic">
              Minimum 2 operatives required to begin.
            </p>
          )}

          {!canStart && address && (
            <p className="self-center font-mono text-xs text-vault-text-dim italic">
              Join the crew to unlock start authority.
            </p>
          )}

          {!isConfigured && (
            <p className="self-center font-mono text-xs text-signal-red">
              {configError}
            </p>
          )}
        </div>

        {/* Transaction status readout */}
        <TxStatus
          hash={hash}
          isPending={isPending}
          isConfirming={isConfirming}
          isSuccess={isSuccess}
          error={error}
        />
      </div>
    </div>
  );
}


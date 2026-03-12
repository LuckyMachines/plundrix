import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useGameInfo } from '../../hooks/useGameInfo';
import { useGamePlayers } from '../../hooks/useGamePlayers';
import { usePlayerState } from '../../hooks/usePlayerState';
import { useGameActions } from '../../hooks/useGameActions';
import { PLUNDRIX_ABI, PLUNDRIX_ADDRESS, IS_CONTRACT_CONFIGURED } from '../../config/contract';
import { truncateAddress, formatBigInt } from '../../lib/formatting';
import { TOTAL_LOCKS } from '../../lib/constants';
import Spinner from '../shared/Spinner';
import TxStatus from '../shared/TxStatus';

function PlayerRow({ gameId, playerAddr, winner }) {
  const { locksCracked, tools, isLoading } = usePlayerState(gameId, playerAddr);
  const isWinner = winner?.toLowerCase() === playerAddr?.toLowerCase();

  if (isLoading) {
    return (
      <tr className="border-b border-vault-border/50">
        <td colSpan={4} className="px-4 py-3">
          <Spinner size="w-3 h-3" />
        </td>
      </tr>
    );
  }

  return (
    <tr className={`border-b border-vault-border/50 ${isWinner ? 'bg-tungsten/5' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-vault-text">
            {truncateAddress(playerAddr)}
          </span>
          {isWinner && (
            <span className="font-display text-xs tracking-widest uppercase text-tungsten-bright border border-tungsten/30 rounded px-1.5 py-0.5 bg-tungsten/5">
              WINNER
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-mono text-xs text-tungsten tabular-nums">
          {formatBigInt(locksCracked)}
        </span>
        <span className="font-mono text-xs text-vault-text-dim">
          /{TOTAL_LOCKS}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-mono text-xs text-oxide-green tabular-nums">
          {formatBigInt(tools)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {isWinner ? (
          <span className="font-display text-xs tracking-widest uppercase text-tungsten-bright">
            VAULT BREACHED
          </span>
        ) : (
          <span className="font-display text-xs tracking-widest uppercase text-vault-text-dim">
            LOCKED OUT
          </span>
        )}
      </td>
    </tr>
  );
}

export default function GameOver({ gameId }) {
  const { address } = useAccount();
  const { winner, currentRound, playerCount, isLoading, error } = useGameInfo(gameId);
  const { players } = useGamePlayers(gameId, playerCount);
  const { withdraw, hash: withdrawHash, isPending: withdrawPending, isConfirming: withdrawConfirming, isSuccess: withdrawSuccess, error: withdrawError } = useGameActions();

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

  // Read withdrawable balance for connected address
  const { data: withdrawable } = useReadContract({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'withdrawableBalance',
    args: [address],
    query: { enabled: !!address && IS_CONTRACT_CONFIGURED },
  });

  const isCurrentUserWinner = winner?.toLowerCase() === address?.toLowerCase();

  if (isLoading) {
    return (
      <div className="border border-vault-border rounded bg-vault-panel p-12 flex items-center justify-center gap-3">
        <Spinner size="w-5 h-5" />
        <span className="font-mono text-xs text-vault-text-dim tracking-wider uppercase">
          Loading final report...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-signal-red/30 rounded bg-vault-panel p-8 text-center">
        <p className="font-mono text-xs text-signal-red tracking-wider uppercase">
          Failed to load game results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Final Briefing Header */}
      <div className="border border-vault-border rounded bg-vault-panel overflow-hidden">
        {/* Top classification bar */}
        <div className="bg-vault-dark border-b border-vault-border px-4 py-2 flex items-center justify-between">
          <span className="font-display text-xs tracking-[0.3em] text-vault-text-dim uppercase">
            Final Briefing
          </span>
          <span className="font-mono text-xs text-vault-text-dim">
            Operation #{gameId}
          </span>
        </div>

        {/* Winner display */}
        <div className="relative p-8 text-center overflow-hidden">
          {/* Subtle radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(218,165,32,0.08) 0%, transparent 60%)',
            }}
          />

          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl font-display font-bold tracking-[0.3em] text-tungsten-bright uppercase">
              Vault Breached
            </h2>

            {isCurrentUserWinner && (
              <div className="inline-block border-2 border-tungsten-bright/50 rounded px-5 py-1.5 rotate-[-2deg]">
                <span className="font-display text-lg tracking-[0.4em] text-tungsten-bright uppercase font-bold">
                  You Win
                </span>
              </div>
            )}

            <div className="space-y-1">
              <p className="font-display text-xs tracking-widest text-vault-text-dim uppercase">
                Victor
              </p>
              <p className="font-mono text-sm text-tungsten">
                {truncateAddress(winner)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-8">
              <div className="space-y-1">
                <p className="font-display text-xs tracking-widest text-vault-text-dim uppercase">
                  Rounds
                </p>
                <p className="font-mono text-lg text-tungsten-bright tabular-nums">
                  {formatBigInt(currentRound)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-xs tracking-widest text-vault-text-dim uppercase">
                  Operators
                </p>
                <p className="font-mono text-lg text-vault-text tabular-nums">
                  {formatBigInt(playerCount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats table */}
      <div className="border border-vault-border rounded bg-vault-panel overflow-hidden">
        <div className="bg-vault-dark border-b border-vault-border px-4 py-2">
          <span className="font-display text-xs tracking-[0.3em] text-vault-text-dim uppercase">
            Operator Report
          </span>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-vault-border bg-vault-dark/50">
              <th className="px-4 py-2 text-left font-display text-xs tracking-widest text-vault-text-dim uppercase">
                Operator
              </th>
              <th className="px-4 py-2 text-center font-display text-xs tracking-widest text-vault-text-dim uppercase">
                Locks
              </th>
              <th className="px-4 py-2 text-center font-display text-xs tracking-widest text-vault-text-dim uppercase">
                Tools
              </th>
              <th className="px-4 py-2 text-right font-display text-xs tracking-widest text-vault-text-dim uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((playerAddr) => (
              <PlayerRow
                key={playerAddr}
                gameId={gameId}
                playerAddr={playerAddr}
                winner={winner}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Stakes prize breakdown */}
      {isStakes && (
        <div className="border border-vault-border rounded bg-vault-panel overflow-hidden">
          <div className="bg-vault-dark border-b border-vault-border px-4 py-2">
            <span className="font-display text-xs tracking-[0.3em] text-vault-text-dim uppercase">
              Prize Breakdown
            </span>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-vault-text-dim uppercase tracking-wider">Entry Fee</span>
              <span className="text-vault-text">{formatEther(entryFee)} ETH</span>
            </div>
            <div className="flex justify-between font-mono text-xs">
              <span className="text-vault-text-dim uppercase tracking-wider">Total Pot</span>
              <span className="text-tungsten-bright">{formatEther(pot)} ETH</span>
            </div>
            {isCurrentUserWinner && withdrawable && withdrawable > 0n && (
              <>
                <div className="border-t border-vault-border pt-3 flex justify-between font-mono text-xs">
                  <span className="text-vault-text-dim uppercase tracking-wider">Your Prize</span>
                  <span className="text-oxide-green">{formatEther(withdrawable)} ETH</span>
                </div>
                <button
                  onClick={() => withdraw()}
                  disabled={withdrawPending || withdrawConfirming}
                  className="w-full mt-2 py-2 rounded font-mono text-xs uppercase tracking-widest border border-oxide-green/40 bg-oxide-green/10 text-oxide-green hover:bg-oxide-green/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {withdrawPending || withdrawConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="w-3 h-3" /> Claiming...
                    </span>
                  ) : (
                    'Claim Prize'
                  )}
                </button>
                <TxStatus
                  hash={withdrawHash}
                  isPending={withdrawPending}
                  isConfirming={withdrawConfirming}
                  isSuccess={withdrawSuccess}
                  error={withdrawError}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <Link
          to="/"
          className="font-display text-xs tracking-widest uppercase text-vault-text-dim hover:text-vault-text border border-vault-border rounded px-4 py-2 bg-vault-panel hover:bg-vault-dark transition-colors"
        >
          Return to Console
        </Link>
        <Link
          to="/"
          className="font-display text-xs tracking-widest uppercase text-tungsten hover:text-tungsten-bright border border-tungsten/30 hover:border-tungsten/50 rounded px-4 py-2 bg-tungsten/5 hover:bg-tungsten/10 transition-colors"
        >
          Create New Game
        </Link>
      </div>

      {/* Bottom classification */}
      <div className="flex items-center justify-center gap-2">
        <div className="h-px w-12 bg-vault-border" />
        <span className="font-display text-xs tracking-[0.4em] text-vault-text-dim uppercase">
          End of Report
        </span>
        <div className="h-px w-12 bg-vault-border" />
      </div>
    </div>
  );
}


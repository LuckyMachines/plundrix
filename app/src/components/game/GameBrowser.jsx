import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useTotalGames } from '../../hooks/useTotalGames';
import { useGameActions } from '../../hooks/useGameActions';
import { useTxToast } from '../../hooks/useTxToast';
import { GameMode } from '../../lib/constants';
import GameCard from './GameCard';
import Spinner from '../shared/Spinner';
import TxStatus from '../shared/TxStatus';

export default function GameBrowser() {
  const { address } = useAccount();
  const { totalGames, isLoading, error } = useTotalGames();
  const {
    createGame,
    createStakesGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: txError,
    isConfigured,
    configError,
  } = useGameActions();
  useTxToast({ hash, isPending, isConfirming, isSuccess, error: txError }, 'Game creation');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState(GameMode.FREE);
  const [entryFeeInput, setEntryFeeInput] = useState('0.01');

  const count = totalGames !== undefined ? Number(totalGames) : 0;

  // Build array from totalGames down to 1 (most recent first)
  const gameIds = Array.from({ length: count }, (_, i) => count - i);

  return (
    <div className="border border-vault-border rounded bg-vault-surface">
      {/* Header bar */}
      <div className="border-b border-vault-border px-6 py-4 flex items-center justify-between">
        <h2 className="font-mono text-xs tracking-[0.3em] text-vault-text-dim uppercase">
          Active Operations
        </h2>

        {address && (
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!isConfigured || isPending || isConfirming}
            className="px-4 py-2 bg-tungsten/10 border border-tungsten/40 rounded text-tungsten text-xs font-mono tracking-widest uppercase
                       hover:bg-tungsten/20 hover:border-tungsten/60 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending || isConfirming ? (
              <span className="flex items-center gap-2">
                <Spinner size="w-3 h-3" /> Creating...
              </span>
            ) : (
              'Create Game'
            )}
          </button>
        )}
      </div>

      {/* Transaction feedback */}
      {(hash || isPending || txError) && (
        <div className="px-6 pt-4">
          <TxStatus
            hash={hash}
            isPending={isPending}
            isConfirming={isConfirming}
            isSuccess={isSuccess}
            error={txError}
          />
        </div>
      )}

      {!isConfigured && (
        <div className="px-6 pt-4">
          <p className="font-mono text-xs text-signal-red tracking-wider uppercase">
            {configError}
          </p>
        </div>
      )}

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="border border-vault-border rounded bg-vault-panel p-6 w-full max-w-sm space-y-4">
            <h3 className="font-mono text-xs tracking-[0.3em] text-tungsten uppercase">
              New Operation
            </h3>

            {/* Mode toggle */}
            <div className="flex gap-2">
              {[GameMode.FREE, GameMode.STAKES].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCreateMode(mode)}
                  className={`flex-1 py-2 rounded font-mono text-xs uppercase tracking-widest border transition-colors ${
                    createMode === mode
                      ? 'border-tungsten/60 bg-tungsten/20 text-tungsten-bright'
                      : 'border-vault-border bg-vault-dark/40 text-vault-text-dim hover:text-vault-text'
                  }`}
                >
                  {mode === GameMode.FREE ? 'Free' : 'Stakes'}
                </button>
              ))}
            </div>

            {/* Entry fee input (STAKES only) */}
            {createMode === GameMode.STAKES && (
              <div className="space-y-1">
                <label className="font-mono text-xs text-vault-text-dim uppercase tracking-wider">
                  Entry Fee (ETH)
                </label>
                <input
                  type="text"
                  value={entryFeeInput}
                  onChange={(e) => setEntryFeeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-vault-border bg-vault-dark text-tungsten font-mono text-sm focus:outline-none focus:border-tungsten/50"
                  placeholder="0.01"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 rounded font-mono text-xs uppercase tracking-widest border border-vault-border bg-vault-dark/40 text-vault-text-dim hover:text-vault-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (createMode === GameMode.STAKES) {
                    createStakesGame(parseEther(entryFeeInput));
                  } else {
                    createGame();
                  }
                  setShowCreateModal(false);
                }}
                disabled={!isConfigured || isPending || isConfirming}
                className="flex-1 py-2 rounded font-mono text-xs uppercase tracking-widest border border-tungsten/40 bg-tungsten/10 text-tungsten hover:bg-tungsten/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game list */}
      <div className="px-6 py-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <Spinner size="w-5 h-5" />
            <span className="font-mono text-xs text-vault-text-dim tracking-wider uppercase">
              Scanning operations...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-2">
            <p className="font-mono text-xs text-signal-red tracking-wider uppercase">
              Failed to load operations
            </p>
            <p className="font-mono text-xs text-vault-text-dim break-all max-w-lg mx-auto">
              {error?.shortMessage || error?.message || String(error)}
            </p>
          </div>
        ) : count === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-xs text-vault-text-dim italic">
              No operations found. Create one to begin.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gameIds.map((id) => (
              <GameCard key={id} gameId={id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


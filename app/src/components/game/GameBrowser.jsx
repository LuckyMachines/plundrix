import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useTotalGames } from '../../hooks/useTotalGames';
import { useGameCatalog } from '../../hooks/useGameCatalog';
import { useGameActions } from '../../hooks/useGameActions';
import { useTxToast } from '../../hooks/useTxToast';
import { GameMode } from '../../lib/constants';
import GameCard from './GameCard';
import Spinner from '../shared/Spinner';
import TxStatus from '../shared/TxStatus';
import Modal from '../shared/Modal';
import { trackProductEvent } from '../../lib/analytics';

const ENABLE_STAKES = import.meta.env.VITE_ENABLE_STAKES === 'true';
const FALLBACK_CARD_LIMIT = 12;
const ARCHIVE_PREVIEW_LIMIT = 6;

export default function GameBrowser() {
  const { address } = useAccount();
  const { totalGames, isLoading, error, refetch } = useTotalGames();
  const catalog = useGameCatalog(24);
  const {
    createGame,
    createGameWithPace,
    createStakesGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: txError,
    isConfigured,
    configError,
    nextRulesEnabled,
  } = useGameActions();
  useTxToast({ hash, isPending, isConfirming, isSuccess, error: txError }, 'Operation creation');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState(GameMode.FREE);
  const [entryFeeInput, setEntryFeeInput] = useState('0.01');
  const [roundPace, setRoundPace] = useState(300);

  useEffect(() => {
    if (isSuccess) {
      refetch();
      catalog.refetch();
    }
  }, [isSuccess, refetch, catalog.refetch]);

  const count = totalGames !== undefined ? Number(totalGames) : 0;

  const catalogGames = catalog.data?.games || [];
  const liveGames = catalogGames.filter((game) => game.state !== 'COMPLETE');
  const completedGames = catalogGames
    .filter((game) => game.state === 'COMPLETE')
    .slice(0, ARCHIVE_PREVIEW_LIMIT);
  const fallbackIds = Array.from(
    { length: Math.min(count, FALLBACK_CARD_LIMIT) },
    (_, index) => count - index,
  );
  const usingCatalog = catalogGames.length > 0;

  return (
    <div className="border border-vault-border rounded bg-vault-surface">
      {/* Header bar */}
      <div className="border-b border-vault-border px-6 py-4 flex items-center justify-between">
        <h3 className="font-mono text-xs tracking-[0.3em] text-vault-text-dim uppercase">
          Available now
        </h3>

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
              'Create Operation'
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
        <div className="mx-5 mt-5 border border-vault-border bg-vault-dark/55 p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-tungsten">
            Live table unavailable in this build
          </p>
          <p className="mt-2 text-sm leading-6 text-vault-text-dim">
            You can still learn the game and run a complete match in the practice table.
          </p>
          {import.meta.env.DEV && (
            <p className="mt-2 font-mono text-[10px] text-vault-text-dim">{configError}</p>
          )}
        </div>
      )}

      {/* Create Game Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} ariaLabel="Create a live operation">
          <div className="border border-vault-border rounded bg-vault-panel p-6 w-full space-y-4">
            <h3 className="font-mono text-xs tracking-[0.3em] text-tungsten uppercase">
              New Operation
            </h3>

            {/* Mode toggle */}
            <div className="flex gap-2">
              {(ENABLE_STAKES ? [GameMode.FREE, GameMode.STAKES] : [GameMode.FREE]).map((mode) => (
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

            {!ENABLE_STAKES && (
              <p className="font-mono text-xs leading-5 text-vault-text-dim">
                The public beta is free to play. Paid competition modes are not enabled.
              </p>
            )}

            {nextRulesEnabled && createMode === GameMode.FREE && (
              <label className="grid gap-2">
                <span className="font-mono text-xs text-vault-text-dim uppercase tracking-wider">Round pace</span>
                <select value={roundPace} onChange={(event) => setRoundPace(Number(event.target.value))} className="min-h-[44px] rounded border border-vault-border bg-vault-dark px-3 font-mono text-xs text-vault-text">
                  <option value={45}>Live / 45 seconds</option>
                  <option value={90}>Tactical / 90 seconds</option>
                  <option value={300}>Async / 5 minutes</option>
                </select>
              </label>
            )}

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
                  trackProductEvent('Live Operation Create Started', { mode: createMode === GameMode.STAKES ? 'stakes' : 'free' });
                  if (createMode === GameMode.STAKES) {
                    createStakesGame(parseEther(entryFeeInput));
                  } else if (nextRulesEnabled && roundPace !== 300) {
                    createGameWithPace(roundPace);
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
      </Modal>

      {/* Game list */}
      {isConfigured ? (
      <div className="px-6 py-5">
        {isLoading || (catalog.isLoading && !catalog.isError) ? (
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
          <div className="border border-oxide-green/25 bg-oxide-green/5 px-5 py-9 text-center">
            <p className="font-display text-2xl uppercase text-vault-text">The first table is yours</p>
            <p className="mt-2 text-sm text-vault-text-dim">Create a free live operation above, or learn the vault in Instant Play.</p>
            <Link to="/play" className="mt-4 inline-flex min-h-[44px] items-center border border-tungsten/45 px-4 font-mono text-xs uppercase tracking-[0.14em] text-tungsten">Play instantly</Link>
          </div>
        ) : usingCatalog ? (
          <div className="space-y-6">
            {liveGames.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {liveGames.map((game) => (
                  <GameCard key={game.gameId} gameId={game.gameId} summary={game} loadPlayers={false} />
                ))}
              </div>
            ) : (
              <div className="border border-oxide-green/25 bg-oxide-green/5 px-5 py-7 text-center">
                <p className="font-display text-2xl uppercase text-vault-text">No live tables right now</p>
                <p className="mt-2 text-sm text-vault-text-dim">Create a free table or warm up instantly while the vault is quiet.</p>
                <Link to="/play" className="mt-4 inline-flex min-h-[44px] items-center border border-tungsten/45 px-4 font-mono text-xs uppercase tracking-[0.14em] text-tungsten">Play instantly</Link>
              </div>
            )}
            {completedGames.length > 0 && (
              <details className="border-t border-vault-border pt-5">
                <summary className="min-h-[44px] cursor-pointer font-mono text-xs uppercase tracking-[0.16em] text-vault-text-dim hover:text-vault-text">
                  Recent completed operations ({completedGames.length} shown)
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {completedGames.map((game) => (
                    <GameCard key={game.gameId} gameId={game.gameId} summary={game} loadPlayers={false} />
                  ))}
                </div>
                <Link to="/sessions?state=complete" className="mt-4 inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.14em] text-tungsten">Browse operation history -&gt;</Link>
              </details>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {catalog.isError && (
              <p className="border border-vault-border bg-vault-dark/50 p-3 text-xs text-vault-text-dim">
                Live index unavailable. Showing the {fallbackIds.length} newest operations with reduced polling.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackIds.map((id) => (
                <GameCard key={id} gameId={id} loadPlayers={false} />
              ))}
            </div>
          </div>
        )}
      </div>
      ) : (
        <div className="px-5 py-5">
          <Link to="/play" className="inline-flex min-h-[44px] items-center border border-tungsten/45 px-4 font-mono text-xs uppercase tracking-[0.14em] text-tungsten hover:bg-tungsten/10">
            Play instantly
          </Link>
        </div>
      )}
    </div>
  );
}


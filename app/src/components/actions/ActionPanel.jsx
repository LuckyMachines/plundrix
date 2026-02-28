import { useEffect } from 'react';
import { Action } from '../../lib/constants';
import { useGameActions } from '../../hooks/useGameActions';
import TxStatus from '../shared/TxStatus';
import PickControl from './PickControl';
import SearchControl from './SearchControl';
import SabotageControl from './SabotageControl';

export default function ActionPanel({
  gameId,
  isConfigured,
  configError,
  registered,
  stunned,
  actionSubmitted,
  tools,
  players,
  currentAddress,
}) {
  const { submitAction, hash, isPending, isConfirming, isSuccess, error } = useGameActions();

  const spectator = !!currentAddress && !registered;
  const disconnected = !currentAddress;
  const disabled = !isConfigured || disconnected || spectator || actionSubmitted || isPending || isConfirming;
  const sabotageTargets = players.filter(
    (addr) => addr?.toLowerCase() !== currentAddress?.toLowerCase()
  );

  const handlePick = () => {
    submitAction(gameId, Action.PICK);
  };

  const handleSearch = () => {
    submitAction(gameId, Action.SEARCH);
  };

  const handleSabotage = (targetAddress) => {
    submitAction(gameId, Action.SABOTAGE, targetAddress);
  };

  useEffect(() => {
    if (disabled) return;

    const onKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const isTypingContext =
        tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
      if (isTypingContext) return;

      if (e.key === '1') {
        e.preventDefault();
        handlePick();
        return;
      }

      if (e.key === '2') {
        e.preventDefault();
        handleSearch();
        return;
      }

      if (e.key === '3') {
        e.preventDefault();
        if (sabotageTargets.length === 1) {
          handleSabotage(sabotageTargets[0]);
          return;
        }
        const targetSelect = document.getElementById('sabotage-target-select');
        targetSelect?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, sabotageTargets, handlePick, handleSearch, handleSabotage]);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xs tracking-[0.35em] text-vault-text-dim uppercase font-display">
          Action Console
        </h3>
        {actionSubmitted && (
          <span className="font-mono text-[11px] text-blueprint uppercase tracking-wider border border-blueprint/30 rounded px-2 py-0.5 bg-blueprint/5">
            Submitted
          </span>
        )}
      </div>

      <p className="font-mono text-xs text-vault-text-dim mb-3">
        Hotkeys: <span className="text-vault-text">1</span> pick,{' '}
        <span className="text-vault-text">2</span> search,{' '}
        <span className="text-vault-text">3</span> sabotage target.
      </p>

      {!isConfigured && (
        <p className="font-mono text-xs text-signal-red mb-3">{configError}</p>
      )}

      {disconnected && (
        <p className="font-mono text-xs text-vault-text-dim mb-3">
          Connect your wallet to submit round actions.
        </p>
      )}

      {spectator && (
        <p className="font-mono text-xs text-vault-text-dim mb-3">
          You are spectating this operation. Join during OPEN state to play.
        </p>
      )}

      {/* 3-column action controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <PickControl
          onSubmit={handlePick}
          disabled={disabled}
          stunned={stunned}
          tools={tools}
        />
        <SearchControl
          onSubmit={handleSearch}
          disabled={disabled}
          stunned={stunned}
          tools={tools}
        />
        <SabotageControl
          onSubmit={handleSabotage}
          disabled={disabled}
          stunned={stunned}
          players={players}
          currentAddress={currentAddress}
          selectId="sabotage-target-select"
        />
      </div>

      {/* Transaction status */}
      <TxStatus
        hash={hash}
        isPending={isPending}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={error}
      />
    </div>
  );
}


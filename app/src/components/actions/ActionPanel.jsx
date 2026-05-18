import { useCallback, useEffect, useMemo, useState } from 'react';
import { Action } from '../../lib/constants';
import { useGameActions } from '../../hooks/useGameActions';
import { useTxToast } from '../../hooks/useTxToast';
import { useTxCueBridge } from '../../hooks/useTxCueBridge';
import TxStatus from '../shared/TxStatus';
import PickControl from './PickControl';
import SearchControl from './SearchControl';
import SabotageControl from './SabotageControl';
import ActionPresenceField from './ActionPresenceField';
import TargetCycler from './TargetCycler';

const KEY_ACTIONS = {
  1: 'pick',
  2: 'search',
  3: 'sabotage',
};

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
  session,
  onIntentChange,
  onTargetChange,
  quiet = false,
}) {
  const { submitAction, hash, isPending, isConfirming, isSuccess, error } = useGameActions();
  useTxToast({ hash, isPending, isConfirming, isSuccess, error }, 'Action');
  useTxCueBridge({ gameId, label: 'Action', isPending, isConfirming, isSuccess, error });
  const [intent, setIntent] = useState('idle');
  const [pressedAction, setPressedAction] = useState(null);
  const [invalidCount, setInvalidCount] = useState(0);
  const [targetIntent, setTargetIntent] = useState('');

  const spectator = !!currentAddress && !registered;
  const disconnected = !currentAddress;
  const disabled = !isConfigured || disconnected || spectator || actionSubmitted || isPending || isConfirming;
  const sabotageTargets = players.filter(
    (addr) => addr?.toLowerCase() !== currentAddress?.toLowerCase()
  );
  const activeIntent = useMemo(
    () => pressedAction || intent || session?.recommendedIntent || (actionSubmitted ? 'committed' : 'idle'),
    [pressedAction, intent, session?.recommendedIntent, actionSubmitted]
  );
  const commandAvailability = session?.commandAvailability;
  const pickDisabled = disabled || commandAvailability?.pick === false;
  const searchDisabled = disabled || commandAvailability?.search === false;
  const sabotageDisabled = disabled || commandAvailability?.sabotage === false;
  const blockedReason = commandAvailability?.blockedReason;

  useEffect(
    () => {
      onIntentChange?.(activeIntent);
    },
    [activeIntent, onIntentChange]
  );

  useEffect(() => {
    onTargetChange?.(targetIntent);
  }, [targetIntent, onTargetChange]);

  useEffect(() => {
    if (session?.targetAddress !== undefined && session.targetAddress !== targetIntent) {
      setTargetIntent(session.targetAddress || '');
    }
  }, [session?.targetAddress, targetIntent]);

  const pulseAction = useCallback((action) => {
    setPressedAction(action);
    window.setTimeout(() => {
      setPressedAction((current) => (current === action ? null : current));
    }, 260);
  }, []);

  const markInvalid = useCallback((action = 'idle') => {
    setIntent(action);
    setInvalidCount((count) => count + 1);
    window.setTimeout(() => {
      setInvalidCount((count) => Math.max(0, count - 1));
    }, 520);
  }, []);

  const handleIntentStart = useCallback((action) => {
    setIntent(action);
  }, []);

  const handleIntentEnd = useCallback((action) => {
    setIntent((current) => (current === action ? 'idle' : current));
  }, []);

  const handlePick = useCallback(() => {
    pulseAction('pick');
    submitAction(gameId, Action.PICK);
  }, [gameId, pulseAction, submitAction]);

  const handleSearch = useCallback(() => {
    pulseAction('search');
    submitAction(gameId, Action.SEARCH);
  }, [gameId, pulseAction, submitAction]);

  const handleSabotage = useCallback((targetAddress) => {
    if (!targetAddress) {
      markInvalid('sabotage');
      return;
    }
    pulseAction('sabotage');
    submitAction(gameId, Action.SABOTAGE, targetAddress);
  }, [gameId, markInvalid, pulseAction, submitAction]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const isTypingContext =
        tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
      if (isTypingContext) return;

      const keyAction = KEY_ACTIONS[e.key];
      if (!keyAction) return;

      setIntent(keyAction);
      if (!e.repeat) setPressedAction(keyAction);

      const keyBlocked =
        (keyAction === 'pick' && pickDisabled) ||
        (keyAction === 'search' && searchDisabled) ||
        (keyAction === 'sabotage' && sabotageDisabled);

      if (keyBlocked || (keyAction === 'pick' && stunned)) {
        e.preventDefault();
        markInvalid(keyAction);
        return;
      }

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

    const onKeyUp = (e) => {
      const keyAction = KEY_ACTIONS[e.key];
      if (!keyAction) return;
      setPressedAction((current) => (current === keyAction ? null : current));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [pickDisabled, searchDisabled, sabotageDisabled, stunned, sabotageTargets, handlePick, handleSearch, handleSabotage, markInvalid]);

  return (
    <div>
      {!quiet && (
        <>
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
        </>
      )}

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

      {blockedReason && !spectator && !disconnected && (
        <p className="font-mono text-xs text-vault-text-dim mb-3">
          Command layer: <span className="text-vault-text uppercase">{blockedReason}</span>
        </p>
      )}

      <div className="mb-4">
        <ActionPresenceField
          intent={activeIntent}
          committed={actionSubmitted}
          stunned={stunned}
          disabled={disabled || !!blockedReason}
          invalidCount={invalidCount}
          targetLocked={targetIntent !== ''}
          tools={tools}
          players={players}
          recommendedIntent={session?.recommendedIntent}
        />
      </div>

      {(!quiet || activeIntent === 'sabotage' || targetIntent) && (
        <TargetCycler
          players={players}
          currentAddress={currentAddress}
          targetAddress={targetIntent}
          onTargetChange={setTargetIntent}
          disabled={sabotageDisabled}
        />
      )}

      {/* 3-column action controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <PickControl
          onSubmit={handlePick}
          disabled={pickDisabled}
          stunned={stunned}
          tools={tools}
          active={activeIntent === 'pick'}
          pressed={pressedAction === 'pick'}
          invalidCount={invalidCount}
          onIntentStart={handleIntentStart}
          onIntentEnd={handleIntentEnd}
          onInvalidIntent={markInvalid}
        />
        <SearchControl
          onSubmit={handleSearch}
          disabled={searchDisabled}
          stunned={stunned}
          tools={tools}
          active={activeIntent === 'search'}
          pressed={pressedAction === 'search'}
          invalidCount={invalidCount}
          onIntentStart={handleIntentStart}
          onIntentEnd={handleIntentEnd}
          onInvalidIntent={markInvalid}
        />
        <SabotageControl
          onSubmit={handleSabotage}
          disabled={sabotageDisabled}
          stunned={stunned}
          players={players}
          currentAddress={currentAddress}
          selectId="sabotage-target-select"
          active={activeIntent === 'sabotage'}
          pressed={pressedAction === 'sabotage'}
          invalidCount={invalidCount}
          onIntentStart={handleIntentStart}
          onIntentEnd={handleIntentEnd}
          onInvalidIntent={markInvalid}
          onTargetIntentChange={setTargetIntent}
          externalTarget={targetIntent}
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


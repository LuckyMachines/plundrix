import { useState } from 'react';
import DecisionPlate from './DecisionPlate';
import FirstMoveCoach, { completeFirstMoveCoach } from './FirstMoveCoach';
import { ACTION_STAGE_PRESETS, ActionButtonContent, ActionWaitPanel } from '../shared/ActionFeedback';
import Modal from '../shared/Modal';

export const GAMEPLAY_ACTION_ART = Object.freeze({
  pick: '/images/parts/pick-tool.webp',
  search: '/images/parts/search-kit.webp',
  sabotage: '/images/parts/sabotage-cable.webp',
});

export function MobileActionCommand({
  actions,
  selectedAction,
  busy = false,
  busyStages = ACTION_STAGE_PRESETS.reveal,
  onSelect,
  onCommit,
  commitLabel = 'Confirm move',
  autoLabel = 'Auto-play this round',
  onAuto,
  targets = [],
  selectedTarget,
  onTarget,
}) {
  const [open, setOpen] = useState(false);
  const selectedChoice = actions.find((action) => action.id === selectedAction) || actions[0];
  const selectedIdentity = selectedChoice?.identity || selectedChoice?.id;
  const commit = () => {
    setOpen(false);
    onCommit();
  };

  return (
    <>
      <div className={`instant-mobile-command ${onAuto ? '' : 'instant-mobile-command--primary-only'}`} role="region" aria-label="Round action command">
        <button type="button" className="instant-mobile-command__selection" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <span>{selectedChoice?.metric}</span>
          <strong>{selectedChoice?.label} / change</strong>
        </button>
        <button type="button" disabled={busy} onClick={commit} aria-label={commitLabel} aria-busy={busy} className="instant-mobile-command__commit">
          <ActionButtonContent active={busy} idle={commitLabel} stages={busyStages} />
        </button>
        {onAuto && (
          <button type="button" disabled={busy} onClick={onAuto} title="The game chooses a recommended move for you this round." aria-label={autoLabel} className="instant-mobile-command__auto">
            Auto
          </button>
        )}
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} ariaLabel="Choose the next move">
        <div className="mobile-action-sheet">
          <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Round command</p>
          <h2 className="mt-2 font-display text-3xl uppercase text-vault-text">Choose the next move</h2>
          <p className="mt-2 text-sm leading-6 text-vault-text-dim">Compare the tradeoffs, then seal one move. Everyone reveals together.</p>
          <div className="mobile-action-sheet__choices" role="radiogroup" aria-label="Round action">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                role="radio"
                aria-checked={selectedAction === action.id}
                disabled={busy}
                data-selected={selectedAction === action.id}
                data-action={action.identity || action.id}
                onClick={() => onSelect(action.id)}
              >
                <img src={action.image || GAMEPLAY_ACTION_ART[action.identity || action.id]} alt="" width="96" height="96" />
                <span><strong>{action.label}</strong><small>{action.metric}</small></span>
                <em>{action.shortDetail || action.detail}</em>
              </button>
            ))}
          </div>
          {selectedIdentity === 'sabotage' && targets.length > 0 && (
            <fieldset className="mobile-action-sheet__targets">
              <legend>Choose sabotage target</legend>
              <div>
                {targets.map((candidate) => (
                  <button key={candidate.id} type="button" disabled={busy} onClick={() => onTarget(candidate.id)} aria-pressed={selectedTarget === candidate.id}>
                    {candidate.name} / {candidate.locksCracked} locks
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <button type="button" disabled={busy} onClick={commit} aria-busy={busy} className="mobile-action-sheet__commit">
            <ActionButtonContent active={busy} idle={commitLabel} stages={busyStages} />
          </button>
        </div>
      </Modal>
    </>
  );
}

export default function UnifiedActionDeck({
  id = 'gameplay-actions',
  modeLabel = 'Operation',
  round,
  kicker,
  heading = 'Make the next move.',
  guidance,
  actions,
  selectedAction,
  busy = false,
  busyStages = ACTION_STAGE_PRESETS.reveal,
  onSelect,
  onCommit,
  commitLabel = 'Confirm move',
  autoLabel,
  onAuto,
  targets = [],
  selectedTarget,
  onTarget,
  preview,
  firstMoveCoach = false,
  children,
}) {
  const resolvedKicker = kicker || `${modeLabel}${round ? ` / R${round}` : ''} / concealed move`;
  const [coachRetired, setCoachRetired] = useState(false);
  const selectedChoice = actions.find((action) => action.id === selectedAction);
  const selectedIdentity = selectedChoice?.identity || selectedChoice?.id;
  const retireCoach = () => {
    if (firstMoveCoach && !coachRetired) {
      completeFirstMoveCoach();
      setCoachRetired(true);
    }
  };
  const commit = () => {
    retireCoach();
    onCommit();
  };

  return (
    <section id={id} className="instant-decision-board caper-layer caper-layer-control p-5 sm:p-7" aria-labelledby={`${id}-heading`} aria-busy={busy} data-gameplay-interface="unified" data-gameplay-mode={modeLabel.toLowerCase().replaceAll(' ', '-')}>
      <p className="font-mono text-micro uppercase tracking-brand text-tungsten">{resolvedKicker}</p>
      <h2 id={`${id}-heading`} className="instant-decision-heading">{heading}</h2>
      {firstMoveCoach && !coachRetired ? (
        <FirstMoveCoach action={selectedIdentity} needsTarget={selectedIdentity === 'sabotage'} hasTarget={Boolean(selectedTarget)} onComplete={() => setCoachRetired(true)} />
      ) : guidance ? (
        <p className="instant-first-move mt-3 border-l-2 border-oxide-green bg-oxide-green/10 px-4 py-3 text-sm leading-6 text-vault-text">{guidance}</p>
      ) : null}

      <div className="instant-action-row">
        <div className="instant-action-options mt-4 grid gap-3 md:grid-cols-3">
          {actions.map((action, index) => (
            <DecisionPlate
              key={action.id}
              action={action.id}
              identity={action.identity || action.id}
              label={action.label}
              metric={action.metric}
              detail={action.detail}
              image={action.image || GAMEPLAY_ACTION_ART[action.identity || action.id]}
              index={index}
              selected={selectedAction === action.id}
              committed={busy && selectedAction === action.id}
              disabled={busy}
              onSelect={() => onSelect(action.id)}
            />
          ))}
        </div>

        <div className="instant-action-commit">
          <button type="button" disabled={busy} onClick={commit} aria-label={commitLabel} aria-busy={busy} className="min-h-[52px] flex-1 bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-label text-vault-dark disabled:cursor-wait disabled:opacity-75">
            <ActionButtonContent active={busy} idle={commitLabel} stages={busyStages} />
          </button>
          {onAuto && <button type="button" disabled={busy} onClick={onAuto} title="The game chooses a recommended move for you this round." aria-label={autoLabel || 'Auto-play this round'} className="min-h-[52px] border border-vault-border px-4 font-mono text-xs uppercase tracking-label text-vault-text-dim disabled:opacity-50"><span className="hidden sm:inline">{autoLabel || 'Auto-play this round'}</span><span className="sm:hidden">Auto</span></button>}
        </div>
      </div>

      {selectedAction === 'sabotage' && targets.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose sabotage target">
          {targets.map((candidate) => (
            <button key={candidate.id} type="button" disabled={busy} onClick={() => onTarget(candidate.id)} aria-pressed={selectedTarget === candidate.id} className={`min-h-[44px] border px-4 font-mono text-xs uppercase disabled:cursor-wait disabled:opacity-50 ${selectedTarget === candidate.id ? 'border-signal-red bg-signal-red/10 text-signal-red' : 'border-vault-border text-vault-text'}`}>{candidate.name} / {candidate.locksCracked} locks</button>
          ))}
        </div>
      )}

      {children}

      {busy ? (
        <ActionWaitPanel active stages={busyStages} eyebrow="Move committed" detail="The table is resolving. You can stay right here - the next round will appear automatically." compact className="mt-5" />
      ) : preview ? (
        <div className="mt-5 border-l-2 border-tungsten bg-vault-dark/50 p-4" aria-live="polite">
          <p className="font-mono text-micro uppercase tracking-label text-tungsten">Tactical preview</p>
          <p className="mt-2 text-sm leading-6 text-vault-text">{preview}</p>
        </div>
      ) : null}
    </section>
  );
}

import { useState } from 'react';

export const FIRST_MOVE_COACH_KEY = 'plundrix-first-move-coach-complete-v1';

export function completeFirstMoveCoach(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  try {
    storage?.setItem(FIRST_MOVE_COACH_KEY, 'true');
  } catch {
    // The coach can still retire for the current render when storage is unavailable.
  }
}

function alreadyCompleted() {
  try {
    return window.localStorage.getItem(FIRST_MOVE_COACH_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function FirstMoveCoach({ action, needsTarget = false, hasTarget = true, onComplete }) {
  const [visible, setVisible] = useState(() => !alreadyCompleted());
  if (!visible) return null;

  const guidance = needsTarget && !hasTarget
    ? 'Choose the rival you want to stun, then seal the move.'
    : action === 'search'
      ? 'Search spends this round building better Pick odds for later.'
      : action === 'sabotage'
        ? 'Sabotage costs a rival their next Pick and may steal a tool.'
        : 'Pick is the direct race: success opens the next lock now.';

  const complete = () => {
    completeFirstMoveCoach();
    setVisible(false);
    onComplete?.();
  };

  return (
    <div className="instant-first-move mt-3 flex flex-wrap items-center justify-between gap-3 border-l-2 border-blueprint bg-blueprint/10 px-4 py-3" data-first-move-coach="visible">
      <div className="min-w-0">
        <p className="font-mono text-micro uppercase tracking-label text-blueprint">{'First move / choose -> read -> commit'}</p>
        <p className="mt-1 text-sm leading-5 text-vault-text">{guidance} The result will explain exactly what changed.</p>
      </div>
      <button type="button" onClick={complete} className="min-h-[44px] shrink-0 border border-blueprint/45 px-3 font-mono text-micro uppercase tracking-label text-blueprint">Hide tips</button>
    </div>
  );
}

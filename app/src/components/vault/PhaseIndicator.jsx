import { GameState } from '../../lib/constants';

const PHASES = [
  { key: 'submit', label: 'SUBMIT' },
  { key: 'resolve', label: 'RESOLVE' },
  { key: 'next', label: 'NEXT', accessibleLabel: 'NEXT ROUND' },
  { key: 'winner', label: 'WINNER' },
];

function getActivePhase(gameState, allSubmitted) {
  const state = Number(gameState);
  if (state === GameState.COMPLETE) return 'winner';
  if (state === GameState.ACTIVE) {
    return allSubmitted ? 'resolve' : 'submit';
  }
  return null;
}

export default function PhaseIndicator({ gameState, allSubmitted }) {
  const activeKey = getActivePhase(gameState, allSubmitted);

  return (
    <div className="flex w-full items-center justify-center gap-0.5" aria-label="Operation phase">
      {PHASES.map((phase, i) => {
        const isActive = phase.key === activeKey;
        return (
          <div key={phase.key} className="flex min-w-0 items-center">
            <div
              aria-label={phase.accessibleLabel || phase.label}
              className={`
                whitespace-nowrap px-1.5 py-1 text-micro font-mono uppercase tracking-normal sm:px-2 sm:text-xs sm:tracking-wider
                border transition-all duration-300
                ${isActive
                  ? 'border-tungsten/60 bg-tungsten/15 text-tungsten-bright shadow-[0_0_8px_rgba(196,149,106,0.15)]'
                  : 'border-vault-border bg-vault-dark/40 text-vault-text-dim'
                }
              `}
            >
              {phase.label}
            </div>
            {i < PHASES.length - 1 && (
              <svg className="w-3 h-3 text-vault-text-dim shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="4,2 8,6 4,10" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}


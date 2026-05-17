import { TOTAL_LOCKS } from '../../lib/constants';
import LockModule from './LockModule';

export default function LockRack({ locksCracked = 0, session }) {
  const cracked = Number(locksCracked);
  const cueTotal = session?.latestCue?.type === 'lock.crack' ? session.latestCue.total : null;

  return (
    <div className="alive-lock-rack flex flex-col items-center" data-mode={session?.mode || 'steady'}>
      {/* Section label */}
      <h3 className="text-xs tracking-[0.35em] text-vault-text-dim uppercase font-display mb-3">
        Vault Face
      </h3>

      {/* Lock row */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 w-full">
        {Array.from({ length: TOTAL_LOCKS }, (_, i) => (
          <LockModule
            key={i}
            index={i}
            cracked={i < cracked}
            cued={cueTotal !== null && i === Number(cueTotal) - 1}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full max-w-[280px]">
        <div className="h-1 bg-vault-border rounded-full overflow-hidden">
          <div
            className="h-full bg-tungsten rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(cracked / TOTAL_LOCKS) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-mono text-[11px] text-vault-text-dim uppercase">
            {cracked} / {TOTAL_LOCKS}
          </span>
          {cracked >= TOTAL_LOCKS && (
            <span className="font-mono text-[11px] text-tungsten-bright uppercase tracking-wider animate-pulse">
              Vault Open
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


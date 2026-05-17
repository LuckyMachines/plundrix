import { truncateAddress } from '../../lib/formatting';

export default function TargetCycler({
  players = [],
  currentAddress,
  targetAddress,
  onTargetChange,
  disabled = false,
}) {
  const targets = players.filter(
    (addr) => addr?.toLowerCase() !== currentAddress?.toLowerCase()
  );
  const targetIndex = targets.findIndex(
    (addr) => addr?.toLowerCase() === targetAddress?.toLowerCase()
  );
  const activeTarget = targets[targetIndex] || '';

  const cycle = (direction) => {
    if (disabled || targets.length === 0) return;
    const base = targetIndex < 0 ? 0 : targetIndex;
    const next = targets[(base + direction + targets.length) % targets.length];
    onTargetChange?.(next);
  };

  if (targets.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded border border-vault-border bg-vault-dark/40 px-3 py-2">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-vault-text-dim">
          Target Link
        </p>
        <p className="font-mono text-xs text-vault-text">
          {activeTarget ? truncateAddress(activeTarget) : 'No target selected'}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cycle(-1)}
          disabled={disabled}
          className="min-w-9 rounded border border-vault-border px-2 py-1 font-mono text-xs text-vault-text-dim hover:text-vault-text disabled:opacity-40"
          aria-label="Previous target"
        >
          &lt;
        </button>
        <button
          type="button"
          onClick={() => cycle(1)}
          disabled={disabled}
          className="min-w-9 rounded border border-vault-border px-2 py-1 font-mono text-xs text-vault-text-dim hover:text-vault-text disabled:opacity-40"
          aria-label="Next target"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

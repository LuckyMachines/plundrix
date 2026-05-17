export default function HighlightRail({ highlights = [], activeRound, onJump }) {
  return (
    <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label">Highlights</p>
        <span className="font-mono text-xs text-vault-text-dim">{highlights.length}</span>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {highlights.slice(0, 12).map((highlight, index) => (
          <button
            key={highlight.id}
            type="button"
            onClick={() => onJump?.(highlight.round)}
            aria-label={`Jump to ${highlight.replayLabel}`}
            className={`min-w-[180px] rounded border px-3 py-2 text-left transition-colors ${
              activeRound === highlight.round
                ? 'border-tungsten bg-tungsten/10'
                : 'border-vault-border bg-vault-panel/55 hover:bg-vault-panel'
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-oxide-green">
              {index + 1} / R{highlight.round}
            </span>
            <span className="mt-1 block text-sm text-vault-text">{highlight.replayLabel}</span>
            <span className="mt-1 block line-clamp-2 text-xs text-vault-text-dim">{highlight.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

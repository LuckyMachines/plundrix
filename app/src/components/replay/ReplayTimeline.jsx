export default function ReplayTimeline({ timeline = [], activeRound, onJump, analysisMode }) {
  const rounds = [...new Set(timeline.map((item) => item.round))];

  return (
    <div className="rounded border border-vault-border bg-vault-surface/75 p-4">
      <p className="label">Timeline</p>
      <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
        {rounds.map((round) => {
          const items = timeline.filter((item) => item.round === round);
          return (
            <section
              key={round}
              className={`rounded border p-3 ${
                activeRound === round
                  ? 'border-tungsten bg-tungsten/10'
                  : 'border-vault-border bg-vault-panel/45'
              }`}
            >
              <button
                type="button"
                onClick={() => onJump?.(round)}
                className="flex w-full items-center justify-between gap-3 text-left"
                aria-label={`Jump to round ${round}`}
              >
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-vault-text">
                  Round {round}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
                  {items[0]?.snapshot?.tensionLabel || 'quiet'}
                </span>
              </button>
              <div className="mt-2 space-y-2">
                {items.map((item) => (
                  <div key={`${item.type}-${item.playerId}-${item.round}-${item.text}`} className="rounded bg-vault-dark/75 px-3 py-2">
                    <p className="text-sm text-vault-text">{item.text}</p>
                    {analysisMode && (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-vault-text-dim">
                        {item.actionLabel}
                        {item.roll !== null ? ` / roll ${item.roll}/${item.chance}` : ''}
                        {item.reason ? ` / ${item.reason}` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

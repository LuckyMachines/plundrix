import { useEffect, useMemo, useState } from 'react';
import { describeActionOutcome } from '../../lib/outcomes';
import { truncateAddress } from '../../lib/formatting';

export default function ReplayTimeline({
  roundHistory = [],
  currentAddress,
  session,
  selectedRound: controlledRound,
  onSelectedRoundChange,
}) {
  const [internalSelectedRound, setInternalSelectedRound] = useState(null);
  const selectedRound = controlledRound ?? internalSelectedRound;
  const setSelectedRound = (valueOrUpdater) => {
    const next =
      typeof valueOrUpdater === 'function'
        ? valueOrUpdater(selectedRound)
        : valueOrUpdater;
    setInternalSelectedRound(next);
    onSelectedRoundChange?.(next);
  };

  useEffect(() => {
    if (roundHistory.length === 0) return;
    setSelectedRound((current) => current ?? roundHistory[roundHistory.length - 1].round);
  }, [roundHistory]);

  const selected = useMemo(
    () => roundHistory.find((entry) => entry.round === selectedRound),
    [roundHistory, selectedRound]
  );
  const selectedSummary = useMemo(
    () => session?.roundHistorySummary?.find((entry) => entry.round === selectedRound),
    [session?.roundHistorySummary, selectedRound]
  );

  useEffect(() => {
    if (roundHistory.length === 0) return;

    const onKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const isTypingContext =
        tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
      if (isTypingContext) return;
      if (e.key !== '[' && e.key !== ']') return;

      e.preventDefault();
      setSelectedRound((current) => {
        const index = Math.max(0, roundHistory.findIndex((entry) => entry.round === current));
        const nextIndex = e.key === '['
          ? Math.max(0, index - 1)
          : Math.min(roundHistory.length - 1, index + 1);
        return roundHistory[nextIndex]?.round ?? current;
      });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [roundHistory]);

  if (roundHistory.length === 0) {
    return (
      <div className="border border-vault-border rounded bg-vault-panel p-4">
        <h3 className="font-display text-xs tracking-[0.3em] uppercase text-vault-text-dim mb-2">
          Replay Timeline
        </h3>
        <p className="font-mono text-xs text-vault-text-dim italic">
          Round history appears after the first resolution.
        </p>
      </div>
    );
  }

  const outcomeEvents = (selected?.events || []).filter((e) => e.name === 'ActionOutcome');
  const winnerEvent = (selected?.events || []).find((e) => e.name === 'GameWon');

  return (
    <div className="border border-vault-border rounded bg-vault-panel p-4 space-y-4">
      <h3 className="font-display text-xs tracking-[0.3em] uppercase text-vault-text-dim">
        Replay Timeline
      </h3>

      <div className="flex flex-wrap gap-2">
        {roundHistory.map((entry) => (
          <button
            key={entry.round}
            type="button"
            onClick={() => setSelectedRound(entry.round)}
            className={`px-2.5 py-1 rounded border font-mono text-xs uppercase tracking-wider ${
              selectedRound === entry.round
                ? 'border-blueprint/50 bg-blueprint/15 text-blueprint'
                : 'border-vault-border bg-vault-dark/40 text-vault-text-dim hover:text-vault-text'
            }`}
          >
            Round {entry.round}
          </button>
        ))}
      </div>

      {selectedSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['Commits', selectedSummary.commits],
            ['Locks', selectedSummary.locks],
            ['Tools', selectedSummary.tools],
            ['Hits', selectedSummary.sabotages],
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-vault-border bg-vault-dark/30 px-3 py-2">
              <p className="font-mono text-[11px] uppercase tracking-wider text-vault-text-dim">
                {label}
              </p>
              <p className="font-mono text-sm text-vault-text tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {outcomeEvents.length === 0 && (
          <p className="font-mono text-xs text-vault-text-dim italic">
            No outcomes recorded for this round.
          </p>
        )}
        {outcomeEvents.map((event, index) => (
          <div
            key={`${event.transactionHash}-${index}`}
            className="font-mono text-xs text-vault-text border border-vault-border rounded px-3 py-2 bg-vault-dark/30"
          >
            {describeActionOutcome(event.args, currentAddress)}
          </div>
        ))}
      </div>

      {winnerEvent && (
        <div className="font-mono text-xs text-tungsten border border-tungsten/30 rounded px-3 py-2 bg-tungsten/5">
          Winner declared: {truncateAddress(winnerEvent.args?.winner)}
        </div>
      )}
    </div>
  );
}

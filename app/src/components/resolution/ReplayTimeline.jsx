import { useEffect, useMemo, useState } from 'react';
import { describeActionOutcome } from '../../lib/outcomes';
import { truncateAddress } from '../../lib/formatting';

export default function ReplayTimeline({ roundHistory = [], currentAddress }) {
  const [selectedRound, setSelectedRound] = useState(null);

  useEffect(() => {
    if (roundHistory.length === 0) return;
    setSelectedRound((current) => current ?? roundHistory[roundHistory.length - 1].round);
  }, [roundHistory]);

  const selected = useMemo(
    () => roundHistory.find((entry) => entry.round === selectedRound),
    [roundHistory, selectedRound]
  );

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

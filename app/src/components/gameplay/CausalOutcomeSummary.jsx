import { buildOutcomeNarrative } from '../../lib/outcomeNarrative';

export default function CausalOutcomeSummary({
  outcomes = [],
  players = [],
  playerId = 'player-1',
  totalLocks = 5,
  headingId = 'causal-outcome-heading',
  label = 'Last resolution',
}) {
  const playerOutcome = outcomes.find((event) => event.actor === playerId || event.you) || outcomes[0];
  const narrative = buildOutcomeNarrative(playerOutcome, { players, playerId, totalLocks });
  if (!narrative) return null;

  const otherOutcomes = outcomes
    .filter((event) => event !== playerOutcome)
    .map((event) => ({ event, narrative: buildOutcomeNarrative(event, { players, playerId, totalLocks }) }))
    .filter((entry) => entry.narrative);

  return (
    <section
      className={`instant-resolution-summary border-l-2 p-4 ${narrative.successful ? 'border-oxide-green bg-oxide-green/10' : 'border-signal-red bg-signal-red/5'}`}
      data-route={narrative.action}
      data-success={narrative.successful}
      aria-labelledby={headingId}
      aria-live="polite"
    >
      <p className="instant-resolution-summary__label font-mono text-micro uppercase tracking-brand text-vault-text-dim">{label} <span>/ {narrative.action}</span></p>
      <h2 id={headingId} className="instant-resolution-summary__headline mt-2 font-display text-3xl uppercase text-vault-text">{narrative.headline}</h2>
      <p className={`instant-resolution-summary__cause mt-1 text-sm ${narrative.successful ? 'text-oxide-green' : 'text-signal-red'}`}>{narrative.cause}</p>
      <p className="instant-resolution-summary__consequence mt-2 font-mono text-xs uppercase tracking-interface text-vault-text">Because of that: {narrative.consequence}</p>
      {otherOutcomes.length > 0 && (
        <div className="instant-resolution-summary__rivals mt-3 grid gap-2 sm:grid-cols-3" aria-label="Rival outcomes">
          {otherOutcomes.map(({ event, narrative: rival }) => (
            <p key={event.id || `${event.actor}-${event.round}`} className="border-t border-vault-border pt-2 text-xs text-vault-text-dim">
              <strong className="font-normal text-vault-text-dim">{rival.headline}</strong>
              <span className="sr-only"> {rival.consequence}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

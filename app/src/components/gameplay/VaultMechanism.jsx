const OPERATOR_TONES = ['coral', 'cyan', 'green', 'gold'];

function tumblerPosition(index, total) {
  const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / total);
  return {
    left: `${50 + (46 * Math.cos(angle))}%`,
    top: `${50 + (46 * Math.sin(angle))}%`,
  };
}

export default function VaultMechanism({
  cracked = 0,
  total = 5,
  resolving = false,
  label = 'Nightfall vault',
  selectedAction,
  actions = [],
  players = [],
  latestOutcome = null,
  onSelectAction,
}) {
  const remaining = Math.max(0, total - cracked);
  const selected = actions.find((action) => action.id === selectedAction) || actions[0];
  const leaderLocks = Math.max(0, ...players.map((candidate) => candidate.locksCracked));
  const outcomeState = latestOutcome ? (latestOutcome.success ? 'success' : 'failed') : 'idle';
  const statusCopy = resolving
    ? 'Moves sealed. The whole table is revealing.'
    : latestOutcome ? `Last reveal: ${latestOutcome.message}` : selected?.detail || `Crack ${remaining} more ${remaining === 1 ? 'lock' : 'locks'} before the table.`;

  return (
    <section
      id="instant-vault-actions"
      className="instant-vault-core caper-layer caper-layer-planning relative overflow-hidden text-center"
      data-route={selected?.identity || 'pick'}
      data-outcome={outcomeState}
      aria-labelledby="instant-vault-heading"
    >
      <div className="caper-conflict-map" aria-hidden="true">
        <svg viewBox="0 0 760 500" preserveAspectRatio="none" focusable="false">
          <path className="caper-conflict-map__frame" d="M30 72h145l28 26h354l28-26h145M30 428h145l28-26h354l28 26h145" />
          <path className="caper-conflict-map__circuit" d="M45 128h118l34 34h70m226 0h70l34-34h118M45 370h112l48-42h70m210 0h70l48 42h112" />
          <path className="caper-conflict-map__line caper-conflict-map__line-pick" d="M104 430 C 160 392, 205 330, 326 284" />
          <path className="caper-conflict-map__line caper-conflict-map__line-search" d="M380 430 C 380 372, 380 330, 380 286" />
          <path className="caper-conflict-map__line caper-conflict-map__line-sabotage" d="M656 430 C 600 392, 555 330, 434 284" />
          <circle cx="104" cy="430" r="7" />
          <circle cx="380" cy="430" r="7" />
          <circle cx="656" cy="430" r="7" />
        </svg>
      </div>

      <div className="instant-vault-title">
        <div>
          <p id="instant-vault-heading" className="caper-kicker font-mono text-xs uppercase tracking-brand text-tungsten">{label}</p>
          <small>Live lock race / simultaneous reveal</small>
        </div>
        <span>{remaining === 0 ? 'Breach open' : `${cracked}/${total} cracked`}</span>
      </div>

      <div className="instant-vault-operators" aria-label="Live table positions">
        {players.map((candidate, index) => {
          const initials = candidate.name.slice(0, 2).toUpperCase();
          const isLeader = candidate.locksCracked === leaderLocks && leaderLocks > 0;
          return (
            <div
              key={candidate.id}
              className="instant-vault-operator"
              data-tone={OPERATOR_TONES[index]}
              data-current={candidate.id === 'player-1'}
              data-stunned={candidate.stunned}
              data-leader={isLeader}
              aria-label={`${candidate.name}: ${candidate.locksCracked} of ${total} locks, ${candidate.tools} tools${candidate.stunned ? ', stunned' : ''}`}
            >
              <span aria-hidden="true">{initials}</span>
              <strong>{candidate.name}</strong>
              <small>{candidate.locksCracked}/{total} locks</small>
            </div>
          );
        })}
      </div>

      <div className="instant-vault-machine">
        <div className="instant-vault-heart" role="img" aria-label={`${cracked} of ${total} vault tumblers opened`}>
          <i /><i /><i />
          <div className="instant-vault-tumblers" aria-hidden="true">
            {Array.from({ length: total }, (_, index) => {
              const open = index < cracked;
              return <span key={index} data-state={open ? 'open' : 'sealed'} style={tumblerPosition(index, total)}>{index + 1}</span>;
            })}
          </div>
          <div className="instant-vault-count" aria-hidden="true">
            <strong>{cracked}/{total}</strong>
            <span>Locks</span>
          </div>
        </div>
      </div>

      <div className="instant-vault-conduits" role="group" aria-label="Choose an action">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            data-action={action.identity}
            data-selected={selectedAction === action.id}
            aria-pressed={selectedAction === action.id}
            aria-label={`Select ${action.label}: ${action.metric}. ${action.shortDetail}`}
            disabled={resolving}
            onClick={() => onSelectAction?.(action.id)}
          >
            <span>{action.label}</span>
            <strong>{action.metric}</strong>
            <small>{action.shortDetail}</small>
          </button>
        ))}
      </div>

      <p className="instant-vault-copy text-sm text-vault-text-dim" aria-live="polite">
        <span data-state={outcomeState} aria-hidden="true" />
        {statusCopy}
      </p>
    </section>
  );
}

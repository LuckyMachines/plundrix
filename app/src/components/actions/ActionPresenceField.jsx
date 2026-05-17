const ACTION_TONE = {
  idle: {
    label: 'Awaiting command',
    tint: 'text-vault-text-dim',
    ring: 'border-vault-border',
  },
  pick: {
    label: 'Setting tension',
    tint: 'text-tungsten-bright',
    ring: 'border-tungsten/40',
  },
  search: {
    label: 'Sweeping compartment',
    tint: 'text-oxide-green',
    ring: 'border-oxide-green/40',
  },
  sabotage: {
    label: 'Tracking target',
    tint: 'text-signal-red',
    ring: 'border-signal-red/40',
  },
  committed: {
    label: 'Action committed',
    tint: 'text-blueprint',
    ring: 'border-blueprint/40',
  },
  invalid: {
    label: 'Blocked input',
    tint: 'text-signal-red',
    ring: 'border-signal-red/40',
  },
};

const BOARD_TILES = [
  'dim', 'dim', 'path', 'dim', 'threat',
  'dim', 'path', 'path', 'watch', 'dim',
  'path', 'path', 'operative', 'path', 'target',
  'dim', 'watch', 'path', 'path', 'dim',
  'supply', 'dim', 'path', 'dim', 'dim',
];

function getTileClass(tile, intent, targetLocked) {
  if (tile === 'operative') return 'alive-board-tile alive-board-operative';
  if (tile === 'path') return `alive-board-tile alive-board-path alive-board-path-${intent}`;
  if (tile === 'target') {
    return `alive-board-tile ${intent === 'sabotage' || targetLocked ? 'alive-board-target' : 'alive-board-watch'}`;
  }
  if (tile === 'threat') return 'alive-board-tile alive-board-threat';
  if (tile === 'supply') return 'alive-board-tile alive-board-supply';
  if (tile === 'watch') return 'alive-board-tile alive-board-watch';
  return 'alive-board-tile';
}

export default function ActionPresenceField({
  intent = 'idle',
  committed = false,
  stunned = false,
  disabled = false,
  invalidCount = 0,
  targetLocked = false,
  tools = 0,
  players = [],
  recommendedIntent = 'idle',
}) {
  const activeIntent = invalidCount > 0 ? 'invalid' : committed ? 'committed' : intent || 'idle';
  const tone = ACTION_TONE[activeIntent] || ACTION_TONE.idle;
  const rivalCount = Math.max(0, players.length - 1);

  return (
    <div
      className={`
        alive-presence-field relative overflow-hidden rounded border bg-vault-dark/60 p-4
        ${tone.ring}
        ${stunned ? 'alive-presence-stunned' : ''}
        ${disabled ? 'alive-presence-muted' : ''}
      `}
      data-intent={activeIntent}
      data-invalid={invalidCount}
    >
      <div className="alive-presence-scan" />

      <div className="relative grid grid-cols-1 md:grid-cols-[minmax(160px,220px)_1fr] gap-4 items-center">
        <div className="alive-agent-stage" aria-hidden="true">
          <div className="alive-agent-shadow" />
          <div className="alive-agent" data-intent={activeIntent}>
            <div className="alive-agent-gaze" />
            <div className="alive-agent-head" />
            <div className="alive-agent-body">
              <span className="alive-agent-core" />
              <span className="alive-agent-gear alive-agent-gear-a" />
              <span className="alive-agent-gear alive-agent-gear-b" />
            </div>
            <span className="alive-agent-arm alive-agent-arm-left" />
            <span className="alive-agent-arm alive-agent-arm-right" />
            <span className="alive-agent-leg alive-agent-leg-left" />
            <span className="alive-agent-leg alive-agent-leg-right" />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className={`font-display text-sm uppercase tracking-[0.25em] ${tone.tint}`}>
                {tone.label}
              </p>
              <p className="font-mono text-xs text-vault-text-dim mt-1">
                {stunned
                  ? 'Posture compromised'
                  : committed
                    ? 'Holding until round resolution'
                    : `${Number(tools || 0)} tool${Number(tools || 0) === 1 ? '' : 's'} ready`}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 font-mono text-[11px] uppercase tracking-wider text-vault-text-dim">
              {recommendedIntent !== 'idle' && (
                <span className="rounded border border-blueprint/30 bg-blueprint/5 px-2 py-0.5 text-blueprint">
                  {recommendedIntent}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <span className="alive-status-dot" />
                <span>{rivalCount} rival{rivalCount === 1 ? '' : 's'}</span>
              </span>
            </div>
          </div>

          <div className="alive-board" aria-hidden="true">
            {BOARD_TILES.map((tile, index) => (
              <span
                key={`${tile}-${index}`}
                className={getTileClass(tile, activeIntent, targetLocked)}
                style={{ '--alive-tile-delay': `${index * 28}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

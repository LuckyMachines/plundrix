import { TOTAL_LOCKS } from '../../lib/constants';
import { formatBigInt, truncateAddress } from '../../lib/formatting';
import { usePlayerState } from '../../hooks/usePlayerState';
import { StatusPill } from './GameShell';

function pressureTone(stage) {
  if (stage === 'critical' || stage === 'timeout') return 'danger';
  if (stage === 'urgent') return 'warn';
  return 'neutral';
}

export function MatchStatusStrip({
  gameId,
  currentRound,
  playerCount,
  allSubmitted,
  canResolve,
  session,
  resolveBusy,
}) {
  const pressure = session?.pressure;
  return (
    <div className="game-status-content">
      <StatusPill label="Operation" value={`#${gameId}`} />
      <StatusPill label="Round" value={formatBigInt(currentRound)} />
      <StatusPill label="Players" value={formatBigInt(playerCount)} />
      <StatusPill
        label="Pressure"
        value={pressure?.label || 'Steady'}
        tone={pressureTone(pressure?.stage)}
      />
      <StatusPill
        label="State"
        value={resolveBusy ? 'Resolving' : canResolve ? 'Resolve ready' : allSubmitted ? 'All in' : 'Acting'}
        tone={resolveBusy ? 'info' : canResolve ? 'good' : allSubmitted ? 'good' : 'neutral'}
      />
    </div>
  );
}

export function OpponentRail({ gameId, players, currentAddress, targetAddress, latestCue }) {
  return (
    <div className="game-opponent-rail" aria-label="Player threat summary">
      {players.map((address) => (
        <OpponentChip
          key={address}
          gameId={gameId}
          address={address}
          currentAddress={currentAddress}
          targeted={address?.toLowerCase() === targetAddress?.toLowerCase()}
          latestCue={latestCue}
        />
      ))}
    </div>
  );
}

function matchesCue(address, cue) {
  if (!address || !cue) return false;
  const lower = address.toLowerCase();
  return cue.actor?.toLowerCase?.() === lower || cue.target?.toLowerCase?.() === lower;
}

function OpponentChip({ gameId, address, currentAddress, targeted, latestCue }) {
  const {
    locksCracked,
    tools,
    stunned,
    actionSubmitted,
    isLoading,
  } = usePlayerState(gameId, address);
  const isCurrent = address?.toLowerCase() === currentAddress?.toLowerCase();
  const cracked = Number(locksCracked || 0);
  const nearWin = cracked >= TOTAL_LOCKS - 1;
  const cueActive = matchesCue(address, latestCue);

  return (
    <div
      className={`game-opponent-chip ${isCurrent ? 'game-opponent-chip-current' : ''} ${targeted ? 'game-opponent-chip-targeted' : ''} ${nearWin ? 'game-opponent-chip-threat' : ''} ${cueActive ? 'game-opponent-chip-cued' : ''}`}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate font-mono text-xs text-vault-text">
          {isCurrent ? 'You' : truncateAddress(address)}
        </span>
        {stunned && <span className="font-mono text-[10px] uppercase text-signal-red">Stun</span>}
        {targeted && <span className="font-mono text-[10px] uppercase text-tungsten">Target</span>}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {Array.from({ length: TOTAL_LOCKS }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index < cracked ? 'bg-tungsten' : 'bg-vault-border'}`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-vault-text-dim">
        <span>{isLoading ? 'Sync' : `${cracked}/${TOTAL_LOCKS}`}</span>
        <span>{Number(tools || 0)} tools</span>
        <span>{actionSubmitted ? 'In' : 'Open'}</span>
      </div>
    </div>
  );
}

export function LatestEventSurface({ event }) {
  if (!event) {
    return (
      <div className="game-latest-event">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
          Latest
        </span>
        <p className="mt-1 text-sm text-vault-text-dim">No table events yet.</p>
      </div>
    );
  }

  return (
    <div className="game-latest-event">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text-dim">
        Latest
      </span>
      <p className="mt-1 text-sm text-vault-text">
        {eventLabel(event)}
      </p>
    </div>
  );
}

function eventLabel(event) {
  const name = event.name || 'Event';
  const args = event.args || {};
  if (name === 'PlayerSabotaged') return `${truncateAddress(args.attacker)} sabotaged ${truncateAddress(args.victim)}`;
  if (name === 'LockCracked') return `${truncateAddress(args.player)} cracked lock ${args.totalCracked?.toString?.() || ''}`;
  if (name === 'ToolFound') return `${truncateAddress(args.player)} found a tool`;
  if (name === 'ActionSubmitted') return `${truncateAddress(args.player)} committed an action`;
  if (name === 'RoundResolved') return `Round ${args.round?.toString?.() || ''} resolved`;
  if (name === 'GameWon') return `${truncateAddress(args.winner)} breached the vault`;
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
}

import { usePlayerState } from '../../hooks/usePlayerState';
import { TOTAL_LOCKS } from '../../lib/constants';
import { truncateAddress, formatBigInt } from '../../lib/formatting';
import { deriveOperatorReaction } from '../../lib/funSystems';
import ToolTray from './ToolTray';
import StunStamp from './StunStamp';
import ActionSeal from './ActionSeal';
import Spinner from '../shared/Spinner';

function matchesCue(address, cue) {
  if (!address || !cue) return false;
  const lower = address.toLowerCase();
  return cue.actor?.toLowerCase?.() === lower || cue.target?.toLowerCase?.() === lower;
}

export default function PlayerDossier({
  gameId,
  address,
  isCurrentUser = false,
  targeted = false,
  latestCue,
}) {
  const {
    locksCracked,
    tools,
    stunned,
    actionSubmitted,
    isLoading,
  } = usePlayerState(gameId, address);

  const cracked = Number(locksCracked || 0);
  const toolCount = Number(tools || 0);
  const cueActive = matchesCue(address, latestCue);
  const reaction = deriveOperatorReaction({
    operator: { locksCracked: cracked, tools: toolCount, stunned, actionSubmitted },
    state: { rules: { totalLocks: TOTAL_LOCKS } },
    targeted,
  });

  if (isLoading) {
    return (
      <div className="border border-vault-border rounded bg-vault-panel p-4 flex items-center justify-center min-h-[140px]">
        <Spinner size="w-4 h-4" />
      </div>
    );
  }

  return (
    <div
      className={`
        alive-dossier relative border rounded bg-vault-panel p-3 overflow-hidden
        transition-colors duration-300
        ${isCurrentUser ? 'border-tungsten/40' : 'border-vault-border'}
        ${stunned ? 'alive-dossier-stunned' : ''}
        ${actionSubmitted ? 'alive-dossier-committed' : ''}
        ${targeted ? 'alive-dossier-targeted' : ''}
        ${cueActive ? 'alive-dossier-cued' : ''}
      `}
      data-current={isCurrentUser}
      data-stunned={stunned}
      data-submitted={actionSubmitted}
      data-targeted={targeted}
      data-cue={latestCue?.type || ''}
      data-reaction={reaction.id}
    >
      <div className="alive-dossier-presence" aria-hidden="true">
        <span />
      </div>

      {/* Stun overlay */}
      <StunStamp visible={stunned} />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`
              font-mono text-xs tracking-wide
              ${isCurrentUser ? 'text-tungsten-bright' : 'text-vault-text'}
            `}
          >
            {truncateAddress(address)}
          </span>
          {isCurrentUser && (
            <span className="font-mono text-[8px] text-tungsten uppercase tracking-widest border border-tungsten/30 rounded px-1 py-px bg-tungsten/5">
              You
            </span>
          )}
          {targeted && (
            <span className="font-mono text-[8px] text-signal-red uppercase tracking-widest border border-signal-red/30 rounded px-1 py-px bg-signal-red/5">
              Target
            </span>
          )}
        </div>

        {stunned && (
          <span className="font-mono text-[11px] text-signal-red uppercase tracking-wider">
            Stunned
          </span>
        )}
      </div>

      {/* Lock progress dots */}
      <div className="flex items-center gap-1 mb-2">
        <span className="font-mono text-[11px] text-vault-text-dim uppercase tracking-wider mr-1.5">
          Locks
        </span>
        {Array.from({ length: TOTAL_LOCKS }, (_, i) => (
          <div
            key={i}
            className={`
              w-2 h-2 rounded-full border transition-all duration-300
              ${i < cracked
                ? 'bg-tungsten border-tungsten shadow-[0_0_4px_rgba(196,149,106,0.3)]'
                : 'bg-vault-dark border-vault-border'
              }
            `}
          />
        ))}
        <span className="font-mono text-[11px] text-vault-text-dim ml-1.5">
          {cracked}/{TOTAL_LOCKS}
        </span>
      </div>

      {/* Tool tray */}
      <div className="mb-2">
        <span className="font-mono text-[11px] text-vault-text-dim uppercase tracking-wider block mb-1">
          Tools ({formatBigInt(tools)})
        </span>
        <ToolTray toolCount={toolCount} />
      </div>

      {/* Action seal */}
      <ActionSeal visible={actionSubmitted} />
    </div>
  );
}


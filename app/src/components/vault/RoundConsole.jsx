import PhaseIndicator from './PhaseIndicator';
import TimeoutDial from './TimeoutDial';
import { formatBigInt } from '../../lib/formatting';

export default function RoundConsole({ currentRound, roundStartTime, allSubmitted, gameState, canResolve }) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Round number */}
      <div className="text-center">
        <span className="text-xs font-mono text-vault-text-dim uppercase tracking-[0.3em]">
          Round
        </span>
        <h2 className="text-4xl font-display font-bold tracking-wider text-vault-text leading-none">
          {formatBigInt(currentRound)}
        </h2>
      </div>

      {/* Phase strip */}
      <PhaseIndicator gameState={gameState} allSubmitted={allSubmitted} />

      {/* Timeout dial */}
      <TimeoutDial roundStartTime={roundStartTime} />

      {/* All actions badge */}
      {allSubmitted && (
        <div className="flex items-center gap-2 px-3 py-1.5 border border-oxide-green/40 bg-oxide-green/10 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-oxide-green animate-pulse" />
          <span className="font-mono text-xs text-oxide-green uppercase tracking-wider">
            All Actions In
          </span>
        </div>
      )}

      {canResolve && (
        <div className="flex items-center gap-2 px-3 py-1.5 border border-blueprint/40 bg-blueprint/10 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-blueprint animate-pulse" />
          <span className="font-mono text-xs text-blueprint uppercase tracking-wider">
            Resolve Ready
          </span>
        </div>
      )}
    </div>
  );
}


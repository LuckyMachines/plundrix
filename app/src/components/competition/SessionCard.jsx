import { Link } from 'react-router-dom';
import { formatTimestamp } from '../../lib/formatting';
import QueuePill from './QueuePill';
import TypePill from './TypePill';

export default function SessionCard({ session }) {
  return (
    <article className="border border-vault-border rounded bg-vault-panel/70 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            to={`/game/${session.gameId}`}
            className="font-display text-xl tracking-[0.14em] uppercase text-vault-text hover:text-tungsten"
          >
            Session #{session.gameId}
          </Link>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vault-text-dim mt-1">
            {session.state} · {session.rounds} rounds · {session.playerCount} players
          </p>
        </div>
        <QueuePill queue={session.queue} />
      </div>

      <div className="grid gap-2 font-mono text-sm text-vault-text-dim">
        <div>Started: {formatTimestamp(session.startedAt || session.createdAt)}</div>
        <div>Finished: {formatTimestamp(session.completedAt)}</div>
        <div>
          Winner:{' '}
          {session.winner && session.winner !== '0x0000000000000000000000000000000000000000'
            ? session.players.find((player) => player.address === session.winner)?.displayName ||
              session.winner
            : 'Pending'}
        </div>
      </div>

      <div className="grid gap-2">
        {session.players.map((player) => (
          <div
            key={player.address}
            className="flex items-center justify-between gap-3 rounded border border-vault-border/70 bg-vault-surface/70 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to={`/profile/${player.address}`}
                  className="truncate font-mono text-sm uppercase tracking-[0.14em] text-vault-text hover:text-tungsten"
                >
                  {player.displayName}
                </Link>
                <TypePill type={player.type} />
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-vault-text-dim mt-1">
                {player.result} · {player.points} pts
              </div>
            </div>
            <div className="text-right font-mono text-xs uppercase tracking-[0.18em] text-vault-text-dim">
              <div>{player.locksCracked} locks</div>
              <div>{player.sabotages} sabotage</div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

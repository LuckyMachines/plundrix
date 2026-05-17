import { truncateAddress } from '../../lib/formatting';

const MODE_LABELS = {
  loading: 'Syncing',
  lobby: 'Lobby',
  steady: 'Steady',
  pressing: 'Pressing',
  urgent: 'Urgent',
  critical: 'Critical',
  timeout: 'Timeout',
  'resolve-ready': 'Resolve Ready',
  complete: 'Complete',
};

const MODE_COLORS = {
  loading: 'text-vault-text-dim border-vault-border bg-vault-dark/40',
  lobby: 'text-oxide-green border-oxide-green/30 bg-oxide-green/5',
  steady: 'text-tungsten border-tungsten/30 bg-tungsten/5',
  pressing: 'text-tungsten-bright border-tungsten/40 bg-tungsten/10',
  urgent: 'text-tungsten-bright border-tungsten/50 bg-tungsten/15',
  critical: 'text-signal-red border-signal-red/40 bg-signal-red/10',
  timeout: 'text-signal-red border-signal-red/50 bg-signal-red/15',
  'resolve-ready': 'text-blueprint border-blueprint/40 bg-blueprint/10',
  complete: 'text-tungsten-bright border-tungsten/50 bg-tungsten/10',
};

function formatTime(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function SessionIntegrationRail({ session }) {
  if (!session) return null;

  const cue = session.latestCue;
  const status = session.playerStatus;
  const modeColor = MODE_COLORS[session.mode] || MODE_COLORS.loading;

  return (
    <div className="alive-session-rail border border-vault-border rounded bg-vault-panel p-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-vault-text-dim">
            State
          </p>
          <span className={`inline-flex mt-1 rounded border px-2 py-0.5 font-mono text-xs uppercase tracking-wider ${modeColor}`}>
            {MODE_LABELS[session.mode] || session.mode}
          </span>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-vault-text-dim">
            Timer
          </p>
          <p className="font-mono text-sm text-vault-text tabular-nums mt-1">
            {formatTime(session.pressure.remaining)}
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-vault-text-dim">
            Operative
          </p>
          <p className="font-mono text-sm text-vault-text mt-1 capitalize">
            {status.posture}
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-vault-text-dim">
            Latest Cue
          </p>
          <p className="font-mono text-sm text-vault-text mt-1 truncate">
            {cue?.actor ? `${cue.type} ${truncateAddress(cue.actor)}` : cue?.type || 'Listening'}
          </p>
        </div>
      </div>
    </div>
  );
}

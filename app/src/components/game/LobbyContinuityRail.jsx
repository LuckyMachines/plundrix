export default function LobbyContinuityRail({ steps = [], count = 0, isRegistered = false }) {
  const done = steps.filter((step) => step.done).length;
  const progress = steps.length ? (done / steps.length) * 100 : 0;

  return (
    <div className="alive-lobby-rail rounded border border-vault-border bg-vault-dark/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-micro uppercase tracking-wider text-vault-text-dim">
            Launch progress
          </p>
          <p className="font-mono text-sm text-vault-text">
            {count} player{count === 1 ? '' : 's'} joined. {isRegistered ? 'You are in the crew.' : 'You have not joined yet.'}
          </p>
        </div>
        <span className="font-mono text-xs uppercase tracking-wider text-tungsten">
          {done}/{steps.length} steps complete
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-vault-border">
        <div
          className="h-full rounded-full bg-tungsten transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

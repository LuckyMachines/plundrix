import { truncateAddress } from '../../lib/formatting';

export default function PickResult({ player, totalCracked, success, detail }) {
  return (
    <div className="bg-vault-dark border border-vault-border rounded px-4 py-3 space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded border flex items-center justify-center transition-all duration-500 ${
              success
                ? 'border-tungsten/50 bg-tungsten/10 text-tungsten rotate-12 scale-110'
                : 'border-vault-border bg-vault-panel text-vault-text-dim'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              {success ? (
                <>
                  <rect x="3" y="8" width="10" height="7" rx="1" />
                  <path d="M5 8V5a3 3 0 016 0" />
                </>
              ) : (
                <>
                  <rect x="3" y="8" width="10" height="7" rx="1" />
                  <path d="M5 8V5a3 3 0 016 0V8" />
                </>
              )}
            </svg>
          </div>
          <span className="font-mono text-xs text-vault-text">
            {truncateAddress(player)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="font-mono text-xs text-vault-text-dim tabular-nums">
              {totalCracked?.toString()}/5
            </span>
          )}
          <span
            className={`font-display text-xs tracking-widest uppercase px-2 py-0.5 rounded border ${
              success
                ? 'text-tungsten border-tungsten/30 bg-tungsten/5'
                : 'text-vault-text-dim border-vault-border bg-vault-panel'
            }`}
          >
            {success ? 'LOCK CRACKED' : 'NO JOY'}
          </span>
        </div>
      </div>
      {detail && (
        <p className="font-mono text-xs text-vault-text-dim">{detail}</p>
      )}
    </div>
  );
}

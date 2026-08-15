import { truncateAddress } from '../../lib/formatting';
import OutcomeBadge from '../shared/OutcomeBadge';

export default function SearchResult({ player, totalTools, success, detail }) {
  return (
    <div className="bg-vault-dark border border-vault-border rounded px-4 py-3 space-y-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded border flex items-center justify-center transition-all duration-500 ${
              success
                ? 'border-oxide-green/50 bg-oxide-green/10 text-oxide-green'
                : 'border-vault-border bg-vault-panel text-vault-text-dim'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="4" />
              <line x1="10" y1="10" x2="14" y2="14" />
            </svg>
          </div>

          <span className="font-mono text-xs text-vault-text">
            {truncateAddress(player)}
          </span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {success && (
            <span className="font-mono text-xs text-vault-text-dim tabular-nums">
              {totalTools?.toString()} tools
            </span>
          )}
          <OutcomeBadge tone={success ? 'oxide' : 'neutral'}>
            {success ? 'TOOL FOUND' : 'NOTHING'}
          </OutcomeBadge>
        </div>
      </div>
      {detail && <p className="font-mono text-xs text-vault-text-dim">{detail}</p>}
    </div>
  );
}

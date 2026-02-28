import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

export default function QuickStartPanel() {
  const { isConnected } = useAccount();

  return (
    <div className="border border-vault-border rounded bg-vault-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xs tracking-[0.3em] uppercase text-vault-text-dim">
          Operator Onboarding
        </h2>
        <span
          className={`font-mono text-xs uppercase tracking-wider px-2 py-0.5 border rounded ${
            isConnected
              ? 'text-oxide-green border-oxide-green/40 bg-oxide-green/10'
              : 'text-vault-text-dim border-vault-border bg-vault-dark/40'
          }`}
        >
          {isConnected ? 'Wallet Online' : 'Connect Wallet'}
        </span>
      </div>

      <ol className="space-y-2">
        <li className="font-mono text-sm text-vault-text">
          1. Connect your wallet and open any operation.
        </li>
        <li className="font-mono text-sm text-vault-text">
          2. In OPEN state, join the crew and start with 2-4 players.
        </li>
        <li className="font-mono text-sm text-vault-text">
          3. Each round, choose PICK, SEARCH, or SABOTAGE, then resolve.
        </li>
      </ol>

      <p className="font-mono text-xs text-vault-text-dim">
        Keyboard shortcuts in active games: <span className="text-vault-text">1</span>{' '}
        pick, <span className="text-vault-text">2</span> search,{' '}
        <span className="text-vault-text">R</span> resolve when ready.
      </p>

      <div className="flex gap-3">
        <Link
          to="/"
          className="font-mono text-xs uppercase tracking-wider border border-tungsten/40 text-tungsten px-3 py-1.5 rounded hover:bg-tungsten/10"
        >
          Refresh Console
        </Link>
      </div>
    </div>
  );
}

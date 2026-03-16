import { useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';

export default function NetworkSwitchBanner() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [dismissed, setDismissed] = useState(false);

  // Only show for connected users on a non-Sepolia chain
  if (!isConnected || !chain || chain.id === sepolia.id || dismissed) return null;

  const isMainnet = chain.id === 1;

  return (
    <div className="border-b border-tungsten/30 bg-tungsten/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 shrink-0 inline-block w-2 h-2 rounded-full bg-tungsten shadow-[0_0_6px_var(--color-tungsten)]" />
          <div>
            <p className="font-mono text-xs text-tungsten uppercase tracking-wider">
              {isMainnet
                ? 'You\u2019re on Ethereum Mainnet'
                : `You\u2019re on ${chain.name} (Chain ${chain.id})`}
            </p>
            <p className="font-mono text-xs text-vault-text-dim mt-1 leading-relaxed">
              Plundrix is live on Sepolia testnet for free-play beta.
              Switch to Sepolia to play — no real ETH required.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => switchChain({ chainId: sepolia.id })}
            disabled={isPending}
            className="
              min-h-[44px] px-5 py-2 rounded
              border border-tungsten/50 bg-tungsten/15
              font-mono text-xs text-tungsten-bright uppercase tracking-wider
              hover:bg-tungsten/25 hover:border-tungsten/70
              transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            {isPending ? 'Switching...' : 'Switch to Sepolia'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-vault-text-dim hover:text-vault-text transition-colors"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { chain, isConnected } = useAccount();

  return (
    <footer className="border-t border-vault-border bg-vault-surface/60 mt-auto safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3 text-xs font-mono text-vault-text-dim">
        {/* Top row: network + links */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="tracking-wider uppercase">
            {isConnected && chain ? `${chain.name} // Chain ${chain.id}` : 'No network'}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <a
              href="https://github.com/LuckyMachines/plundrix/tree/main/docs/dev"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-wider uppercase hover:text-vault-text transition-colors min-h-[44px] px-3 flex items-center"
            >
              Developer Docs
            </a>
            <Link
              to="/terms"
              className="tracking-wider uppercase hover:text-vault-text transition-colors min-h-[44px] px-3 flex items-center"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="tracking-wider uppercase hover:text-vault-text transition-colors min-h-[44px] px-3 flex items-center"
            >
              Privacy
            </Link>
            <span className="tracking-[0.2em] text-tungsten/60 uppercase font-display font-semibold px-3">
              Plundrix
            </span>
          </div>
        </div>
        <p className="text-center text-vault-text-dim">
          Made with love by Lucky Machines, LLC. Copyright 2026.
        </p>
        <p className="text-center text-vault-text-dim/90 max-w-xl mx-auto">
          Free-play beta only. No cash prizes or monetary rewards are currently live. Sepolia may
          enable test-only fee settings that do not represent a live production economy.
        </p>
        <p className="text-center text-vault-text-dim/90 max-w-xl mx-auto">
          Some players may be AI agents or bots. Agent participation is tracked and labeled on
          the leaderboard.
        </p>
      </div>
    </footer>
  );
}

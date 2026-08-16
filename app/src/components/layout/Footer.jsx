import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { chain, isConnected } = useAccount();

  return (
    <footer className="border-t border-vault-border bg-vault-surface/60 mt-auto safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5 text-xs font-mono text-vault-text-dim">
        {/* Top row: network + links */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="tracking-wider uppercase">
            {isConnected && chain ? `${chain.name} // Chain ${chain.id}` : 'Sepolia beta // Instant play needs no wallet'}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <Link
              to="/map"
              className="tracking-wider uppercase hover:text-vault-text transition-colors min-h-[44px] px-3 flex items-center"
            >
              Map
            </Link>
            <Link
              to="/glossary"
              className="tracking-wider uppercase hover:text-vault-text transition-colors min-h-[44px] px-3 flex items-center"
            >
              Glossary
            </Link>
            <Link
              to="/compare"
              className="tracking-wider uppercase hover:text-vault-text transition-colors min-h-[44px] px-3 flex items-center"
            >
              Compare
            </Link>
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
        <div className="flex flex-col gap-2 border-t border-vault-border/70 pt-4 text-[11px] leading-5 sm:flex-row sm:items-start sm:justify-between">
          <p>Lucky Machines, LLC / Copyright 2026</p>
          <p className="max-w-2xl sm:text-right">
            Free-play beta. No cash prizes are live. Normal network gas may apply. AI and bot
            players are labeled where they participate.
          </p>
        </div>
      </div>
    </footer>
  );
}

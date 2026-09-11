import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

const FooterNetworkStatus = lazy(() => import('../wallet/FooterNetworkStatus'));

export default function Footer({ web3Enabled = false }) {
  return (
    <footer className="border-t border-vault-border bg-vault-surface/60 mt-auto safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5 text-xs font-mono text-vault-text-dim">
        {/* Top row: network + links */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="tracking-wider uppercase">
            {web3Enabled ? (
              <Suspense fallback="Sepolia beta // Checking wallet">
                <FooterNetworkStatus />
              </Suspense>
            ) : 'Sepolia beta // Instant play needs no wallet'}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <Link
              to="/glossary"
              className="tracking-wider uppercase hover:text-vault-text transition-colors min-h-[44px] px-3 flex items-center"
            >
              Glossary
            </Link>
            <a
              href="https://plundrix.com/compare"
              className="tracking-wider uppercase hover:text-vault-text transition-colors min-h-[44px] px-3 flex items-center"
            >
              Compare
            </a>
            <Link
              to="/workshop"
              className="tracking-wider uppercase hover:text-vault-text transition-colors min-h-[44px] px-3 flex items-center"
            >
              Workshop
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
            <span className="tracking-brand text-tungsten/60 uppercase font-display font-semibold px-3">
              Plundrix
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-vault-border/70 pt-4 text-micro leading-5 sm:flex-row sm:items-start sm:justify-between">
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

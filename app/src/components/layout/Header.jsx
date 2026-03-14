import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConnectButton from '../wallet/ConnectButton';
import NetworkBadge from '../wallet/NetworkBadge';
import HelpButton from '../help/HelpButton';
import AccessibilityToggle from './AccessibilityToggle';

export default function Header({ onHelpClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header className="border-b border-vault-border bg-vault-surface/80 backdrop-blur-sm safe-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-14 py-3 flex items-center justify-between gap-3">
        {/* Left: Logo + staging badge */}
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold tracking-[0.3em] text-tungsten font-display uppercase">
              Plundrix
            </span>
          </Link>
          <span className="hidden sm:inline-block w-fit rounded border border-oxide-green/35 bg-oxide-green/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-oxide-green whitespace-nowrap">
            Sepolia live
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-vault-text-dim">
          <NavLink to="/">Console</NavLink>
          <NavLink to="/leaderboard">Ladder</NavLink>
          <NavLink to="/sessions">Sessions</NavLink>
          <a
            href="https://github.com/LuckyMachines/plundrix/tree/main/docs/dev"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-vault-border px-3 py-2 hover:bg-vault-panel/70 min-h-[44px] flex items-center"
          >
            Docs
          </a>
        </nav>

        {/* Desktop right controls */}
        <div className="hidden lg:flex items-center gap-3">
          <AccessibilityToggle />
          <HelpButton onClick={onHelpClick} />
          <NetworkBadge />
          <ConnectButton />
        </div>

        {/* Mobile right: connect + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          <ConnectButton />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded border border-vault-border text-vault-text-dim hover:text-vault-text transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="5" y1="5" x2="15" y2="15" />
                <line x1="15" y1="5" x2="5" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="17" y2="6" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-[57px] z-50 bg-vault-dark/95 backdrop-blur-md safe-bottom">
          <div className="flex flex-col h-full overflow-y-auto">
            <nav className="flex flex-col px-4 py-4 gap-1 font-mono text-sm uppercase tracking-[0.18em]">
              <MobileNavLink to="/">Console</MobileNavLink>
              <MobileNavLink to="/leaderboard">Ladder</MobileNavLink>
              <MobileNavLink to="/sessions">Sessions</MobileNavLink>
              <a
                href="https://github.com/LuckyMachines/plundrix/tree/main/docs/dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center min-h-[48px] px-4 py-3 rounded text-vault-text-dim hover:text-vault-text hover:bg-vault-panel/50 transition-colors"
              >
                Docs
              </a>
            </nav>

            <div className="border-t border-vault-border mx-4" />

            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-vault-text-dim uppercase tracking-wider">Network</span>
                <NetworkBadge />
              </div>
              <div className="flex items-center gap-2">
                <AccessibilityToggle />
                <HelpButton onClick={onHelpClick} />
              </div>
            </div>

            <div className="border-t border-vault-border mx-4" />

            <div className="px-4 py-4">
              <span className="inline-block rounded border border-oxide-green/35 bg-oxide-green/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-oxide-green">
                Sepolia staging live - mainnet production soon
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="rounded border border-vault-border px-3 py-2 hover:bg-vault-panel/70 min-h-[44px] flex items-center"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="flex items-center min-h-[48px] px-4 py-3 rounded text-vault-text hover:bg-vault-panel/50 transition-colors"
    >
      {children}
    </Link>
  );
}

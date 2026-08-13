import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConnectButton from '../wallet/ConnectButton';
import NetworkBadge from '../wallet/NetworkBadge';
import HelpButton from '../help/HelpButton';
import AccessibilityToggle from './AccessibilityToggle';

const NAV_ITEMS = [
  { to: '/', label: 'Play' },
  { to: '/simulator', label: 'Practice' },
  { to: '/replays', label: 'Replays' },
  { to: '/leaderboard', label: 'Ladder' },
  { to: '/compare', label: 'Compare' },
];

export default function Header({ onHelpClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`));

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-vault-border/80 bg-vault-dark/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="Plundrix home">
          <span className="grid h-8 w-8 place-items-center border border-tungsten/45 bg-tungsten/5 transition group-hover:border-tungsten">
            <svg viewBox="0 0 32 32" className="h-5 w-5 text-tungsten" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="16" cy="16" r="11" />
              <circle cx="16" cy="16" r="3" />
              <path d="M16 5v8M16 19v8M5 16h8M19 16h8M8.2 8.2l5.6 5.6M18.2 18.2l5.6 5.6" />
            </svg>
          </span>
          <span className="font-display text-xl font-bold uppercase tracking-[0.24em] text-vault-text">Plundrix</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive(item.to) ? 'page' : undefined}
              className={`relative flex min-h-[44px] items-center px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
                isActive(item.to) ? 'text-tungsten' : 'text-vault-text-dim hover:text-vault-text'
              }`}
            >
              {item.label}
              {isActive(item.to) && <span className="absolute inset-x-3 bottom-0 h-px bg-tungsten" />}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <AccessibilityToggle />
          <HelpButton onClick={onHelpClick} />
          <NetworkBadge />
          <ConnectButton />
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <ConnectButton />
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="grid min-h-[44px] min-w-[44px] place-items-center border border-vault-border text-vault-text-dim"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span className="grid gap-1.5" aria-hidden="true">
              <span className={`block h-px w-5 bg-current transition ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
              <span className={`block h-px w-5 bg-current transition ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px w-5 bg-current transition ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-x-0 top-[69px] h-[calc(100dvh-69px)] border-t border-vault-border bg-vault-dark/98 px-5 py-6 backdrop-blur-xl lg:hidden">
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive(item.to) ? 'page' : undefined}
                className={`flex min-h-[58px] items-center justify-between border px-4 font-display text-2xl uppercase tracking-[0.08em] ${
                  isActive(item.to) ? 'border-tungsten/60 bg-tungsten/10 text-tungsten' : 'border-vault-border text-vault-text'
                }`}
              >
                {item.label}
                <span className="font-mono text-[9px] text-vault-text-dim">0{index + 1}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex items-center justify-between border-t border-vault-border pt-5">
            <div className="flex items-center gap-2">
              <AccessibilityToggle />
              <HelpButton onClick={onHelpClick} />
            </div>
            <NetworkBadge />
          </div>
          <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.16em] text-oxide-green">Sepolia beta live / free play</p>
        </div>
      )}
    </header>
  );
}

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConnectButton from '../wallet/ConnectButton';
import NetworkBadge from '../wallet/NetworkBadge';
import HelpButton from '../help/HelpButton';
import AccessibilityToggle from './AccessibilityToggle';

const NAV_SECTIONS = [
  {
    label: 'Play',
    items: [
      { to: '/leaderboard', label: 'Ladder', description: 'Rankings and competitive progress' },
      { to: '/sessions', label: 'Sessions', description: 'Recent games and session history' },
      { to: '/replays', label: 'Replays', description: 'Review and share match stories' },
      { to: '/compare', label: 'Compare', description: 'Game comparisons and alternatives' },
    ],
  },
  {
    label: 'Practice',
    items: [
      { to: '/simulator', label: 'Practice Table', description: 'Try match setups and replay outcomes' },
      { to: '/ghosts', label: 'Agents', description: 'Compare labeled bot playstyles' },
      { to: '/mutations', label: 'Rules', description: 'Preview alternate rule sets' },
    ],
  },
  {
    label: 'Guide',
    items: [
      { to: '/map', label: 'Map', description: 'How the game areas connect' },
      { to: '/glossary', label: 'Glossary', description: 'Game terms and actions' },
    ],
  },
];

export default function Header({ onHelpClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`));
  const sectionActive = (section) => section.items.some((item) => isActive(item.to));

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-14 py-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {/* Left: Logo + staging badge */}
        <div className="order-1 flex shrink-0 items-center gap-2 min-w-0">
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
        <nav
          className="order-3 hidden w-full flex-wrap items-stretch justify-center gap-2 pt-2 lg:flex 2xl:order-2 2xl:w-auto 2xl:flex-1 2xl:pt-0"
          aria-label="Primary navigation"
        >
          <div className="flex items-end">
            <NavLink to="/" active={isActive('/')}>Console</NavLink>
          </div>
          {NAV_SECTIONS.map((section) => (
            <NavCluster
              key={section.label}
              section={section}
              active={sectionActive(section)}
              isActive={isActive}
            />
          ))}
        </nav>

        {/* Desktop right controls */}
        <div className="order-2 ml-auto hidden shrink-0 items-center gap-2 lg:flex 2xl:order-3 2xl:ml-0">
          <AccessibilityToggle />
          <HelpButton onClick={onHelpClick} />
          <NetworkBadge />
          <ConnectButton />
        </div>

        {/* Mobile right: connect + hamburger */}
        <div className="order-2 ml-auto flex items-center gap-2 lg:hidden">
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
            <nav className="flex flex-col px-4 py-4 gap-4 font-mono text-sm uppercase tracking-[0.12em]">
              <MobileSection title="Home">
                <MobileNavLink to="/" active={isActive('/')}>Console</MobileNavLink>
              </MobileSection>
              {NAV_SECTIONS.map((section) => (
                <MobileSection key={section.label} title={section.label}>
                  {section.items.map((item) => (
                    <MobileNavLink key={item.to} to={item.to} active={isActive(item.to)}>
                      {item.label}
                    </MobileNavLink>
                  ))}
                </MobileSection>
              ))}
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

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-[42px] items-center rounded border px-3 py-2 transition-colors ${
        active
          ? 'border-tungsten/70 bg-tungsten/10 text-vault-text'
          : 'border-vault-border text-vault-text-dim hover:bg-vault-panel/70 hover:text-vault-text'
      } font-mono text-xs uppercase tracking-[0.12em]`}
    >
      {children}
    </Link>
  );
}

function NavCluster({ section, active, isActive }) {
  return (
    <section
      className={`flex min-h-[42px] items-stretch rounded border bg-vault-dark/35 ${
        active ? 'border-tungsten/55' : 'border-vault-border'
      }`}
      aria-label={`${section.label} navigation`}
    >
      <div className={`flex items-center border-r px-2 font-mono text-[10px] uppercase tracking-[0.14em] ${
        active ? 'border-tungsten/30 text-tungsten' : 'border-vault-border text-vault-text-dim'
      }`}>
        {section.label}
      </div>
      <div className="flex flex-wrap items-center gap-1 p-1">
        {section.items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            aria-current={isActive(item.to) ? 'page' : undefined}
            title={item.description}
            className={`flex min-h-[34px] items-center rounded px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
              isActive(item.to)
                ? 'bg-tungsten/10 text-vault-text'
                : 'text-vault-text-dim hover:bg-vault-panel/70 hover:text-vault-text'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MobileSection({ title, children }) {
  return (
    <div>
      <p className="px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-vault-text-dim">
        {title}
      </p>
      <div className="grid gap-1">
        {children}
      </div>
    </div>
  );
}

function MobileNavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center min-h-[48px] rounded border px-4 py-3 transition-colors ${
        active
          ? 'border-tungsten/70 bg-tungsten/10 text-vault-text'
          : 'border-vault-border text-vault-text-dim hover:bg-vault-panel/50 hover:text-vault-text'
      }`}
    >
      {children}
    </Link>
  );
}

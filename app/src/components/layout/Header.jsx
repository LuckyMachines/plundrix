import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HelpButton from '../help/HelpButton';
import { usePreferences } from '../../context/AccessibilityContext';
import { Shortcut } from '../settings/SettingsPrimitives';

const NAV_ITEMS = [
  { to: '/', label: 'Hub' },
  { to: '/play', label: 'Play now' },
  { to: '/vault-run', label: 'Vault run' },
  { to: '/workshop', label: 'Workshop' },
  { to: '/replays', label: 'Replays' },
  { to: '/career', label: 'Career' },
];
const ConnectButton = lazy(() => import('../wallet/ConnectButton'));
const NetworkBadge = lazy(() => import('../wallet/NetworkBadge'));
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function SettingsButton({ onClick, iconOnly = false, keyboardHints = false }) {
  return (
    <button
      type="button"
      className={`settings-trigger${iconOnly ? ' min-w-[44px] justify-center px-0' : ''}`}
      onClick={onClick}
      aria-label={iconOnly ? 'Game settings' : undefined}
      aria-haspopup="dialog"
      aria-keyshortcuts="Control+. Meta+."
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.12-1.28l2-1.55-2-3.46-2.45.99a7.2 7.2 0 0 0-2.2-1.28L13.9 2h-4l-.34 3.42A7.2 7.2 0 0 0 7.36 6.7l-2.45-.99-2 3.46 2 1.55A7 7 0 0 0 4.8 12c0 .44.04.87.12 1.28l-2 1.55 2 3.46 2.45-.99a7.2 7.2 0 0 0 2.2 1.28L9.9 22h4l.34-3.42a7.2 7.2 0 0 0 2.2-1.28l2.45.99 2-3.46-2-1.55c.08-.41.12-.84.12-1.28Z" />
      </svg>
      {!iconOnly && <span>Settings</span>}
      {!iconOnly && keyboardHints && <Shortcut keys={['Ctrl', '.']} label="Shortcut" compact />}
    </button>
  );
}

export default function Header({ onHelpClick, onSettingsClick, web3Enabled = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const location = useLocation();
  const { keyboardHints } = usePreferences();
  const walletOptional = !web3Enabled;
  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`));

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => menuRef.current?.querySelector(FOCUSABLE)?.focus(), 0);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        menuTriggerRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !menuRef.current) return;
      const focusable = [...menuRef.current.querySelectorAll(FOCUSABLE)];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = priorOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const leaveMenuFor = (callback) => {
    setMenuOpen(false);
    menuTriggerRef.current?.focus();
    window.setTimeout(callback, 0);
  };

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-vault-border/80 bg-vault-dark/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-[1536px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="Plundrix home">
          <span className="grid h-8 w-8 place-items-center border border-tungsten/45 bg-tungsten/5 transition group-hover:border-tungsten">
            <svg viewBox="0 0 32 32" className="h-5 w-5 text-tungsten" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="16" cy="16" r="11" />
              <circle cx="16" cy="16" r="3" />
              <path d="M16 5v8M16 19v8M5 16h8M19 16h8M8.2 8.2l5.6 5.6M18.2 18.2l5.6 5.6" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold uppercase tracking-brand text-vault-text sm:text-xl sm:tracking-beacon">Plundrix</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 min-[1600px]:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive(item.to) ? 'page' : undefined}
              className={`relative flex min-h-[44px] items-center px-3 font-mono text-micro uppercase tracking-label transition ${
                isActive(item.to) ? 'text-tungsten' : 'text-vault-text-dim hover:text-vault-text'
              }`}
            >
              {item.label}
              {isActive(item.to) && <span className="absolute inset-x-3 bottom-0 h-px bg-tungsten" />}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 min-[1600px]:ml-0 min-[1600px]:flex">
          <SettingsButton onClick={onSettingsClick} keyboardHints={keyboardHints} />
          <HelpButton onClick={onHelpClick} />
          {!walletOptional && <Suspense fallback={null}><NetworkBadge /></Suspense>}
          {!walletOptional && <Suspense fallback={null}><ConnectButton /></Suspense>}
          {walletOptional && <Link to="/#live-operations" className="inline-flex min-h-[44px] items-center border border-vault-border px-3 font-mono text-xs uppercase tracking-interface text-vault-text-dim hover:text-tungsten">Live tables</Link>}
        </div>

        <div className="ml-auto flex items-center gap-2 min-[1600px]:hidden">
          {!walletOptional && <Suspense fallback={null}><ConnectButton /></Suspense>}
          <SettingsButton onClick={onSettingsClick} iconOnly />
          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="grid min-h-[44px] min-w-[44px] place-items-center border border-vault-border text-vault-text-dim"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-menu-drawer"
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
        <div ref={menuRef} id="primary-menu-drawer" className="mobile-menu-drawer fixed inset-x-0 top-[69px] h-[calc(100dvh-69px)] overflow-y-auto border-t border-vault-border px-5 py-6 min-[1600px]:hidden">
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive(item.to) ? 'page' : undefined}
                className={`flex min-h-[58px] items-center justify-between border px-4 font-display text-2xl uppercase tracking-heading ${
                  isActive(item.to) ? 'border-tungsten/60 bg-tungsten/10 text-tungsten' : 'border-vault-border text-vault-text'
                }`}
              >
                {item.label}
                <span className="font-mono text-micro text-vault-text-dim">0{index + 1}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex items-center justify-between border-t border-vault-border pt-5">
            <div className="flex items-center gap-2">
              <SettingsButton onClick={() => leaveMenuFor(onSettingsClick)} />
              <HelpButton onClick={() => leaveMenuFor(onHelpClick)} showLabel />
            </div>
            {!walletOptional && <Suspense fallback={null}><NetworkBadge /></Suspense>}
          </div>
          <p className="mt-6 font-mono text-micro uppercase tracking-label text-oxide-green">Sepolia beta live / free play</p>
        </div>
      )}
    </header>
  );
}

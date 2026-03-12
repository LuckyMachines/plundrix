import { Link } from 'react-router-dom';
import ConnectButton from '../wallet/ConnectButton';
import NetworkBadge from '../wallet/NetworkBadge';
import HelpButton from '../help/HelpButton';
import AccessibilityToggle from './AccessibilityToggle';

export default function Header({ onHelpClick }) {
  return (
    <header className="border-b border-vault-border bg-vault-surface/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 min-h-14 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-[0.3em] text-tungsten font-display uppercase">
              Plundrix
            </span>
          </Link>
          <span className="w-fit rounded border border-oxide-green/35 bg-oxide-green/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-oxide-green">
            Sepolia staging live - mainnet production soon
          </span>
          <nav className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim">
            <Link to="/" className="rounded border border-vault-border px-2.5 py-1 hover:bg-vault-panel/70">
              Console
            </Link>
            <Link
              to="/leaderboard"
              className="rounded border border-vault-border px-2.5 py-1 hover:bg-vault-panel/70"
            >
              Ladder
            </Link>
            <Link
              to="/sessions"
              className="rounded border border-vault-border px-2.5 py-1 hover:bg-vault-panel/70"
            >
              Sessions
            </Link>
            <a
              href="https://github.com/LuckyMachines/plundrix/tree/main/docs/dev"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-vault-border px-2.5 py-1 hover:bg-vault-panel/70"
            >
              Docs
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <AccessibilityToggle />
          <HelpButton onClick={onHelpClick} />
          <NetworkBadge />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

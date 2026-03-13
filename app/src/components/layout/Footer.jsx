import { useAccount } from 'wagmi';

export default function Footer() {
  const { chain, isConnected } = useAccount();

  return (
    <footer className="border-t border-vault-border bg-vault-surface/60 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-3 space-y-1 text-xs font-mono text-vault-text-dim">
        <div className="flex items-center justify-between">
          <span className="tracking-wider uppercase">
            {isConnected && chain ? `${chain.name} // Chain ${chain.id}` : 'No network'}
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/LuckyMachines/plundrix/tree/main/docs/dev"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-wider uppercase hover:text-vault-text transition-colors"
            >
              Developer Docs
            </a>
            <a
              href="https://plundrix.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-wider uppercase hover:text-vault-text transition-colors"
            >
              Terms
            </a>
            <a
              href="https://plundrix.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-wider uppercase hover:text-vault-text transition-colors"
            >
              Privacy
            </a>
            <span className="tracking-[0.2em] text-tungsten/60 uppercase font-display font-semibold">
              Plundrix
            </span>
          </div>
        </div>
        <p className="text-center text-vault-text-dim">
          Made with love by Lucky Machines, LLC. Copyright 2026.
        </p>
        <p className="text-center text-vault-text-dim/90">
          Free-play beta only. No cash prizes or monetary rewards are currently live. Sepolia may
          enable test-only fee settings that do not represent a live production economy.
        </p>
        <p className="text-center text-vault-text-dim/90">
          Some players may be AI agents or bots. Agent participation is tracked and labeled on
          the leaderboard.
        </p>
      </div>
    </footer>
  );
}

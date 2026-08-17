import { Link } from 'react-router-dom';
import GameBrowser from '../components/game/GameBrowser';
import QuickStartPanel from '../components/game/QuickStartPanel';
import Seo from '../components/seo/Seo';

export default function PlayerHubPage() {
  return (
    <>
      <Seo
        title="Plundrix Player Hub - Choose Your Table"
        description="Play Plundrix instantly against three agents or connect a wallet for live multiplayer operations on Sepolia."
        path="/"
        image="/images/og/plundrix-home.jpg"
        imageAlt="Plundrix player hub with instant and live play options"
      />

      <section className="border-b border-vault-border/70 bg-vault-surface/35">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="max-w-4xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-oxide-green">Player hub</p>
            <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.88] text-vault-text sm:text-7xl">
              Choose your breach.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-vault-text-dim">
              Start immediately against three agents, or connect a wallet and join a live table on Sepolia.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <article className="relative min-h-[340px] overflow-hidden border border-tungsten/50 bg-vault-dark p-6 sm:p-8">
              <img src="/images/plundrix-instant-breach.webp" alt="" width="1024" height="1024" className="absolute inset-0 h-full w-full object-cover object-center opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/90 to-vault-dark/35" />
              <div className="relative flex h-full flex-col items-start">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-tungsten">No wallet</p>
              <h2 className="mt-3 font-display text-4xl uppercase text-vault-text">Play instantly</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-vault-text-dim">
                Pick, Search, and Sabotage through a complete match. Choose a pace, face three distinct agents, and learn by playing.
              </p>
              <Link to="/play" className="mt-auto inline-flex min-h-[52px] items-center bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-vault-dark">
                Start instant match -&gt;
              </Link>
              </div>
            </article>

            <article className="relative min-h-[340px] overflow-hidden border border-vault-border bg-vault-dark p-6 sm:p-8">
              <img src="/images/plundrix-live-breach.webp" alt="" width="1024" height="1024" className="absolute inset-0 h-full w-full object-cover object-center opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/90 to-vault-dark/35" />
              <div className="relative flex h-full flex-col items-start">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-oxide-green">Wallet + Sepolia</p>
              <h2 className="mt-3 font-display text-4xl uppercase text-vault-text">Join a live table</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-vault-text-dim">
                Create or enter a 2-4 player operation. Your moves resolve together onchain, so every round is a read on the table.
              </p>
              <a href="#live-operations" className="mt-auto inline-flex min-h-[52px] items-center border border-oxide-green/50 bg-vault-dark/70 px-6 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-oxide-green">
                Open live operations -&gt;
              </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="live-operations" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-oxide-green">Live on Sepolia</p>
            <h2 className="mt-3 font-display text-4xl font-semibold uppercase text-vault-text sm:text-5xl">Live operations</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-vault-text-dim">
              Connect your wallet, create a free operation, or open a table that is waiting for another operator.
            </p>
          </div>
          <a href="https://plundrix.com/#how-it-works" className="font-mono text-xs uppercase tracking-[0.14em] text-tungsten hover:text-tungsten-bright">
            New here? Learn the rules -&gt;
          </a>
        </div>

        <div className="space-y-5">
          <GameBrowser />
          <QuickStartPanel />
        </div>
      </section>

      <section className="border-t border-vault-border/70 bg-vault-surface/35">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-9 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="font-display text-2xl uppercase text-vault-text">Not ready to choose?</p>
            <p className="mt-2 text-sm leading-6 text-vault-text-dim">Watch one match unfold or review the turns that changed it.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/trailer" className="inline-flex min-h-[44px] items-center border border-vault-border px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text">Watch trailer</Link>
            <Link to="/replays" className="inline-flex min-h-[44px] items-center border border-vault-border px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text">Browse replays</Link>
            <a href="https://plundrix.com" className="inline-flex min-h-[44px] items-center border border-vault-border px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-vault-text">About Plundrix</a>
          </div>
        </div>
      </section>
    </>
  );
}

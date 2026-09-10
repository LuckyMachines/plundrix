import { Link } from 'react-router-dom';
import GameBrowser from '../components/game/GameBrowser';
import QuickStartPanel from '../components/game/QuickStartPanel';
import Seo from '../components/seo/Seo';
import { RUNTIME_CAPABILITIES } from '../config/contract';

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
        <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
          <div className="max-w-4xl">
            <p className="font-mono text-micro uppercase tracking-beacon text-oxide-green">Player hub</p>
            <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-display text-vault-text sm:text-7xl">
              Choose your breach.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-vault-text-dim">
              Race three rivals now, carry a gadget through a Vault Run, or join a live Sepolia table.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <article className="hub-choice-card relative min-h-[320px] overflow-hidden border border-tungsten/50 bg-vault-dark p-6 sm:p-8">
              <img src="/images/plundrix-instant-breach.webp" alt="" width="1024" height="1024" className="absolute inset-0 h-full w-full object-cover object-center opacity-55" />
              <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/90 to-vault-dark/35" />
              <div className="relative flex h-full flex-col items-start">
              <p className="font-mono text-micro uppercase tracking-brand text-tungsten">No wallet</p>
              <h2 className="mt-3 font-display text-4xl uppercase text-vault-text">Play instantly</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-vault-text-dim">
                Pick, Search, and Sabotage through a complete match. Choose a pace, face three distinct agents, and learn by playing.
              </p>
              <Link to="/play" className="mt-auto inline-flex min-h-[52px] items-center bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-label text-vault-dark">
                Start instant match -&gt;
              </Link>
              </div>
            </article>

            <article className="hub-choice-card relative min-h-[320px] overflow-hidden border border-oxide-green/45 bg-vault-dark p-6 sm:p-8">
              <img src="/images/victory-breach.webp" alt="" width="1024" height="1024" className="absolute inset-0 h-full w-full object-cover object-center opacity-48" />
              <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/90 to-vault-dark/30" />
              <div className="relative flex h-full flex-col items-start">
                <p className="font-mono text-micro uppercase tracking-brand text-oxide-green">Persistent practice</p>
                <h2 className="mt-3 font-display text-4xl uppercase text-vault-text">Risk a vault run</h2>
                <p className="mt-4 max-w-md text-base leading-7 text-vault-text-dim">Carry one gadget through three escalating vaults. Choose crooked routes, build rival grudges, and chase the weekly seed.</p>
                <Link to="/vault-run" className="mt-auto inline-flex min-h-[52px] items-center border border-oxide-green/60 bg-vault-dark/70 px-6 font-mono text-xs font-semibold uppercase tracking-label text-oxide-green">Start vault run -&gt;</Link>
              </div>
            </article>

            <article className="hub-choice-card relative min-h-[320px] overflow-hidden border border-vault-border bg-vault-dark p-6 sm:p-8">
              <img src="/images/plundrix-live-breach.webp" alt="" width="1024" height="1024" className="absolute inset-0 h-full w-full object-cover object-center opacity-52" />
              <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/90 to-vault-dark/35" />
              <div className="relative flex h-full flex-col items-start">
              <p className="font-mono text-micro uppercase tracking-brand text-oxide-green">Wallet + Sepolia</p>
              <h2 className="mt-3 font-display text-4xl uppercase text-vault-text">Join a live table</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-vault-text-dim">
                Create or enter a 2-4 player operation. Your moves resolve together onchain, so every round is a read on the table.
              </p>
              <a href="#live-operations" className="mt-auto inline-flex min-h-[52px] items-center border border-oxide-green/50 bg-vault-dark/70 px-6 font-mono text-xs font-semibold uppercase tracking-label text-oxide-green">
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
            <p className="font-mono text-micro uppercase tracking-beacon text-oxide-green">Live on Sepolia</p>
            <h2 className="mt-3 font-display text-4xl font-semibold uppercase text-vault-text sm:text-5xl">Live operations</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-vault-text-dim">
              Connect your wallet, create a free operation, or open a table that is waiting for another operator.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Sepolia beta capabilities">
              <Capability label="Core game" ready={RUNTIME_CAPABILITIES.game} />
              <Capability label="Onchain workshop" ready={RUNTIME_CAPABILITIES.workshop} />
              <Capability label="Paced rules" ready={RUNTIME_CAPABILITIES.pacedGames} />
              <Capability label="Table pressure" ready={RUNTIME_CAPABILITIES.tablePressure} />
              <Capability label="One-confirmation turns" ready={RUNTIME_CAPABILITIES.sessionActions} />
            </div>
          </div>
          <a href="https://plundrix.com/#how-it-works" className="font-mono text-xs uppercase tracking-label text-tungsten hover:text-tungsten-bright">
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
            <Link to="/trailer" className="inline-flex min-h-[44px] items-center border border-vault-border px-4 font-mono text-micro uppercase tracking-label text-vault-text">Watch trailer</Link>
            <Link to="/workshop" className="inline-flex min-h-[44px] items-center border border-tungsten/45 px-4 font-mono text-micro uppercase tracking-label text-tungsten">Open workshop</Link>
            <Link to="/replays" className="inline-flex min-h-[44px] items-center border border-vault-border px-4 font-mono text-micro uppercase tracking-label text-vault-text">Browse replays</Link>
            <a href="https://plundrix.com" className="inline-flex min-h-[44px] items-center border border-vault-border px-4 font-mono text-micro uppercase tracking-label text-vault-text">About Plundrix</a>
          </div>
        </div>
      </section>
    </>
  );
}

function Capability({ label, ready }) {
  return <span className={`border px-2 py-1 font-mono text-micro uppercase tracking-interface ${ready ? 'border-oxide-green/40 bg-oxide-green/5 text-oxide-green' : 'border-vault-border bg-vault-dark/40 text-vault-text-dim'}`}>{label}: {ready ? 'ready' : 'preview only'}</span>;
}

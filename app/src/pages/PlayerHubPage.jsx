import { Link } from 'react-router-dom';
import ManagedOperations from '../components/game/ManagedOperations';
import QuickStartPanel from '../components/game/QuickStartPanel';
import CaperArtifactStage from '../components/gameplay/CaperArtifactStage';
import Seo from '../components/seo/Seo';
import { trackJourneyStep } from '../lib/analytics';
import { readRecentOperation } from '../lib/operationContinuity';

export default function PlayerHubPage() {
  const recentOperation = readRecentOperation();
  const canResumeOperation = recentOperation && recentOperation.state !== 'COMPLETE';

  return (
    <>
      <Seo
        title="Plundrix Player Hub - Choose Your Table"
        description="Play Plundrix instantly against three agents or join a live multiplayer vault operation."
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
              Race three rivals now, carry a gadget through a Vault Run, or join a live table.
            </p>
          </div>

          {canResumeOperation && <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border border-oxide-green/45 bg-oxide-green/5 px-5 py-4"><div><p className="font-mono text-micro uppercase tracking-brand text-oxide-green">Your seat is saved</p><p className="mt-1 text-sm text-vault-text-dim">Operation OP-{String(recentOperation.id).padStart(3, '0')} is ready to reopen.</p></div><Link to={`/game/${recentOperation.id}`} onClick={() => trackJourneyStep('operation-resumed', { mode: 'live', surface: 'player-hub' })} className="inline-flex min-h-[44px] items-center border border-oxide-green/45 px-4 font-mono text-xs uppercase tracking-label text-oxide-green">Reopen operation -&gt;</Link></div>}

          <div className="hub-briefing-grid mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
            <article className="hub-choice-card hub-choice-card--primary relative min-h-[390px] overflow-hidden border border-tungsten/60 bg-vault-dark p-6 sm:p-8 lg:p-10">
              <img src="/images/plundrix-instant-breach.webp" alt="" width="1024" height="1024" className="absolute inset-0 h-full w-full object-cover object-center opacity-55" />
              <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/90 to-vault-dark/35" />
              <div className="relative grid h-full items-end gap-7 md:grid-cols-[minmax(0,1fr)_minmax(230px,.72fr)]">
                <div className="flex h-full max-w-xl flex-col items-start">
                  <div className="flex flex-wrap items-center gap-3"><p className="font-mono text-micro uppercase tracking-brand text-tungsten">First operation / recommended</p><span className="border border-oxide-green/45 bg-oxide-green/10 px-2 py-1 font-mono text-micro uppercase tracking-interface text-oxide-green">Starts now</span></div>
                  <h2 className="mt-4 font-display text-5xl uppercase leading-none text-vault-text sm:text-6xl">Learn the heist by playing it.</h2>
                  <p className="mt-5 max-w-lg text-base leading-7 text-vault-text-dim">Race three distinct agents through one complete match. Pick, Search, or Sabotage; every reveal explains exactly what changed.</p>
                  <Link to="/play" onClick={() => trackJourneyStep('mode-selected', { mode: 'instant', surface: 'player-hub' })} className="mt-auto inline-flex min-h-[54px] items-center bg-tungsten-bright px-7 font-mono text-xs font-semibold uppercase tracking-label text-vault-dark">Start instant match -&gt;</Link>
                </div>
                <CaperArtifactStage kind="vault" label="First-operation vault" status="No account / no waiting" />
              </div>
            </article>

            <div className="grid gap-4">
              <article className="hub-choice-card relative min-h-[188px] overflow-hidden border border-oxide-green/45 bg-vault-dark p-6">
                <img src="/images/victory-breach.webp" alt="" width="1024" height="1024" className="absolute inset-0 h-full w-full object-cover object-center opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/92 to-vault-dark/45" />
                <div className="relative flex h-full flex-col items-start"><p className="font-mono text-micro uppercase tracking-brand text-oxide-green">After your first match</p><h2 className="mt-2 font-display text-3xl uppercase text-vault-text">Risk a Vault Run</h2><p className="mt-2 text-sm leading-6 text-vault-text-dim">Carry one gadget through three escalating vaults and the shared weekly seed.</p><Link to="/vault-run" onClick={() => trackJourneyStep('mode-selected', { mode: 'vault-run', surface: 'player-hub' })} className="mt-auto font-mono text-xs uppercase tracking-label text-oxide-green">Open route board -&gt;</Link></div>
              </article>

              <article className="hub-choice-card relative min-h-[188px] overflow-hidden border border-vault-border bg-vault-dark p-6">
                <img src="/images/plundrix-live-breach.webp" alt="" width="1024" height="1024" className="absolute inset-0 h-full w-full object-cover object-center opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/92 to-vault-dark/45" />
                <div className="relative flex h-full flex-col items-start"><p className="font-mono text-micro uppercase tracking-brand text-oxide-green">When your crew is ready</p><h2 className="mt-2 font-display text-3xl uppercase text-vault-text">Open a Live Table</h2><p className="mt-2 text-sm leading-6 text-vault-text-dim">Saved 2-4 player operations with paced simultaneous rounds.</p><a href="#live-operations" onClick={() => trackJourneyStep('mode-selected', { mode: 'live', surface: 'player-hub' })} className="mt-auto font-mono text-xs uppercase tracking-label text-oxide-green">Open live desk -&gt;</a></div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="live-operations" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="space-y-4">
          <ManagedOperations />
          <details className="border border-vault-border bg-vault-surface/55"><summary className="cursor-pointer px-5 py-4 font-mono text-xs uppercase tracking-label text-vault-text-dim">How a live table works</summary><div className="border-t border-vault-border"><QuickStartPanel /></div></details>
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

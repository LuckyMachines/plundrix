import { useState } from 'react';
import { Link } from 'react-router-dom';
import GameBrowser from '../components/game/GameBrowser';
import QuickStartPanel from '../components/game/QuickStartPanel';
import SeasonOverview from '../components/competition/SeasonOverview';
import LeaderboardTable from '../components/competition/LeaderboardTable';
import SessionCard from '../components/competition/SessionCard';
import Seo from '../components/seo/Seo';
import { useCompetitionOverview } from '../hooks/useCompetitionOverview';

const ACTIONS = [
  {
    id: 'pick',
    number: '01',
    label: 'Pick',
    kicker: 'Push your luck',
    description: 'Attack the next lock. Tools sharpen the odds, but a stun kills the attempt.',
    result: 'The third lock gives with a metallic snap. Two locks remain.',
    locks: 3,
    tools: 1,
    tone: 'text-tungsten',
  },
  {
    id: 'search',
    number: '02',
    label: 'Search',
    kicker: 'Build an edge',
    description: 'Trade momentum for tools that make every future pick more dangerous.',
    result: 'You find a tension wrench. Your next pick climbs to a 70% chance.',
    locks: 2,
    tools: 2,
    tone: 'text-oxide-green',
  },
  {
    id: 'sabotage',
    number: '03',
    label: 'Sabotage',
    kicker: 'Break their plan',
    description: 'Stun a rival, steal a tool, and turn their match-point turn into panic.',
    result: 'Rook is stunned. Their tool is yours and their next pick will fail.',
    locks: 2,
    tools: 2,
    tone: 'text-signal-red',
  },
];

const REPLAY_PROOF = [
  {
    id: 'gallery-comeback',
    eyebrow: 'Comeback',
    title: 'One lock from defeat',
    detail: 'A late sabotage reopens a table that looked finished.',
    stat: 'Final-round swing',
    image: '/images/replay-comeback.webp',
    imageAlt: 'A lockpicker makes a final attempt while a sabotaged cable sparks below the vault',
  },
  {
    id: 'gallery-sabotage',
    eyebrow: 'Betrayal',
    title: 'The stolen wrench',
    detail: 'Two saboteurs collide while the quiet player slips ahead.',
    stat: '4 operators',
    image: '/images/replay-sabotage.webp',
    imageAlt: 'A stolen wrench rests across a severed live cable in front of the vault',
  },
  {
    id: 'gallery-close',
    eyebrow: 'Photo finish',
    title: 'Everyone at match point',
    detail: 'The entire table reaches the fifth lock in the same round.',
    stat: '1 vault, 4 threats',
    image: '/images/replay-close-finish.webp',
    imageAlt: 'Four lockpicking stations converge on the same final vault lock',
  },
];

export default function HomePage() {
  const { data, isLoading, error } = useCompetitionOverview();

  return (
    <>
      <Seo
        title="Plundrix - Onchain Vault-Heist Strategy"
        description="Pick locks, search for tools, and sabotage rivals in a short-session onchain vault-heist strategy game for 2-4 players."
        path="/"
        image="/images/plundrix-vault-hero.png"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'VideoGame',
          name: 'Plundrix',
          description: 'A short-session onchain vault-heist strategy game for 2-4 players.',
          playMode: 'MultiPlayer',
          numberOfPlayers: '2-4',
          gamePlatform: 'Web browser',
        }}
      />

      <section className="home-hero overflow-hidden border-b border-vault-border/70">
        <div className="mx-auto grid min-h-[720px] max-w-7xl lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <div className="relative z-10 flex flex-col justify-center px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
            <div className="mb-7 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-oxide-green/35 bg-oxide-green/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-oxide-green">
                <span className="h-1.5 w-1.5 rounded-full bg-oxide-green shadow-[0_0_12px_rgba(64,160,128,0.9)]" />
                Sepolia beta live
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-vault-text-dim">
                2-4 players / fully onchain
              </span>
            </div>

            <p className="font-mono text-xs uppercase tracking-[0.28em] text-tungsten">
              The vault remembers every betrayal
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-[clamp(3.6rem,8vw,7.4rem)] font-bold uppercase leading-[0.82] tracking-[-0.035em] text-vault-text">
              Crack the vault.
              <span className="mt-2 block text-tungsten-bright">Break the table.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-7 text-vault-text/80 sm:text-xl sm:leading-8">
              Pick locks, search for an edge, or sabotage the rival about to win. Every player
              moves at once. Every round leaves a story.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#live-operations"
                className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-sm bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-vault-dark transition hover:bg-[#f2c18e]"
              >
                Enter the vault
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">-&gt;</span>
              </a>
              <Link
                to="/simulator"
                className="inline-flex min-h-[52px] items-center justify-center rounded-sm border border-vault-text/25 bg-vault-dark/35 px-6 font-mono text-xs uppercase tracking-[0.16em] text-vault-text backdrop-blur-sm transition hover:border-tungsten/60 hover:text-tungsten-bright"
              >
                Try a practice heist
              </Link>
            </div>

            <dl className="mt-12 grid max-w-xl grid-cols-2 border-y border-vault-border/70 sm:grid-cols-4">
              {[
                ['05', 'Locks'],
                ['03', 'Choices'],
                ['01', 'Winner'],
                ['100%', 'Replayable'],
              ].map(([value, label]) => (
                <div key={label} className="border-vault-border/70 px-3 py-4 first:pl-0 sm:border-r sm:last:border-r-0">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-vault-text-dim">{label}</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold tracking-[0.08em] text-vault-text">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hero-art relative min-h-[520px] lg:min-h-full">
            <img
              src="/images/plundrix-vault-hero.webp"
              alt="A massive five-bolt mechanical vault opening inside a dark heist workshop"
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#0a0a0f_0%,rgba(10,10,15,0.68)_10%,transparent_52%),linear-gradient(0deg,#0a0a0f_0%,transparent_38%)]" />
            <div className="absolute bottom-6 left-5 right-5 grid grid-cols-3 gap-2 sm:bottom-8 sm:left-8 sm:right-8">
              {ACTIONS.map((action) => (
                <div key={action.id} className="border border-white/15 bg-vault-dark/75 p-3 backdrop-blur-md">
                  <span className={`font-mono text-[9px] uppercase tracking-[0.16em] ${action.tone}`}>{action.number}</span>
                  <span className="mt-1 block font-display text-lg uppercase tracking-[0.08em] text-white">{action.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main>
        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="One choice. Three intentions."
            title="Every round is a read."
            copy="You do not wait through a long turn order. Everyone commits in secret, the vault resolves the table, and the pressure starts again."
          />
          <div className="mt-12 grid gap-px overflow-hidden border border-vault-border bg-vault-border lg:grid-cols-3">
            {ACTIONS.map((action) => (
              <article key={action.id} className="group bg-vault-surface p-6 transition-colors hover:bg-vault-panel sm:p-8">
                <div className="flex items-start justify-between gap-5">
                  <ActionGlyph action={action.id} />
                  <span className={`font-mono text-xs tracking-[0.2em] ${action.tone}`}>{action.number}</span>
                </div>
                <p className={`mt-9 font-mono text-[10px] uppercase tracking-[0.2em] ${action.tone}`}>{action.kicker}</p>
                <h3 className="mt-2 font-display text-4xl font-semibold uppercase tracking-[0.03em] text-vault-text">{action.label}</h3>
                <p className="mt-4 max-w-sm text-base leading-7 text-vault-text-dim">{action.description}</p>
              </article>
            ))}
          </div>
        </section>

        <TurnDemo />

        <section className="border-y border-vault-border/70 bg-vault-surface/45">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <SectionHeading
                eyebrow="Proof, not promises"
                title="Watch the turns that changed everything."
                copy="Every generated match can become a replay: inspect the decisions, jump to the swing round, or run the same setup again."
              />
              <Link to="/replays" className="font-mono text-xs uppercase tracking-[0.16em] text-tungsten hover:text-tungsten-bright">
                Open replay gallery -&gt;
              </Link>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {REPLAY_PROOF.map((replay, index) => (
                <Link
                  key={replay.id}
                  to={`/replay/${replay.id}`}
                  className="group relative min-h-[360px] overflow-hidden border border-vault-border bg-vault-dark p-6 transition hover:-translate-y-1 hover:border-tungsten/55 focus-visible:-translate-y-1 focus-visible:border-tungsten/55"
                >
                  <img
                    src={replay.image}
                    alt={replay.imageAlt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035] group-focus-visible:scale-[1.035]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,15,0.32)_0%,rgba(10,10,15,0.46)_36%,rgba(10,10,15,0.98)_100%)]" />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-tungsten">{replay.eyebrow}</span>
                      <span className="font-mono text-[10px] tracking-[0.16em] text-vault-text-dim">0{index + 1}</span>
                    </div>
                    <div className="mt-auto pt-24">
                      <h3 className="max-w-xs font-display text-3xl font-semibold uppercase leading-none text-white">{replay.title}</h3>
                      <p className="mt-4 max-w-sm text-base leading-6 text-white/75">{replay.detail}</p>
                    </div>
                    <div className="flex items-end justify-between gap-4 pt-6">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-oxide-green">{replay.stat}</span>
                      <span className="font-mono text-xs text-vault-text transition-transform group-hover:translate-x-1">Play -&gt;</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="live-operations" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="Live on Sepolia"
            title="Choose your table."
            copy="Connect a wallet to create an operation, or join an open vault. The beta is free to play; normal network gas may apply."
          />
          <div className="mt-10 space-y-6">
            {data && <SeasonOverview overview={data.overview} season={data.season} />}
            {isLoading && <LoadingSkeleton />}
            {error && <ServiceNotice />}
            <GameBrowser />
            <QuickStartPanel />
            {data && (
              <details className="group border border-vault-border bg-vault-surface/65">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between px-5 font-mono text-xs uppercase tracking-[0.16em] text-vault-text">
                  Live standings and session feed
                  <span className="text-tungsten transition group-open:rotate-45">+</span>
                </summary>
                <div className="grid gap-5 border-t border-vault-border p-5 lg:grid-cols-2">
                  <LeaderboardTable title={`${data.season.label} / Field standings`} entries={data.featuredLeaderboard} />
                  <div className="space-y-3">
                    {data.featuredSessions?.slice(0, 3).map((session) => <SessionCard key={session.gameId} session={session} />)}
                  </div>
                </div>
              </details>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function TurnDemo() {
  const [selected, setSelected] = useState(ACTIONS[0]);

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
      <div className="overflow-hidden border border-vault-border bg-vault-surface lg:grid lg:grid-cols-[0.78fr_1.22fr]">
        <div className="border-b border-vault-border p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-oxide-green">No wallet needed</p>
          <h2 className="mt-4 font-display text-4xl font-semibold uppercase leading-[0.95] text-vault-text sm:text-5xl">Make the call.</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-vault-text-dim">
            You have two locks open and one tool. Rook is ahead at four locks. What do you do?
          </p>
          <div className="mt-8 grid gap-2">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelected(action)}
                aria-pressed={selected.id === action.id}
                className={`flex min-h-[58px] items-center justify-between border px-4 text-left transition ${
                  selected.id === action.id
                    ? 'border-tungsten/60 bg-tungsten/10 text-vault-text'
                    : 'border-vault-border bg-vault-dark/40 text-vault-text-dim hover:border-vault-text/25 hover:text-vault-text'
                }`}
              >
                <span className="font-display text-xl uppercase tracking-[0.08em]">{action.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{action.kicker}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[540px] flex-col justify-between overflow-hidden bg-[#0c0c12] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(196,149,106,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(196,149,106,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-vault-border pb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vault-text-dim">Operation 041 / Round 6</p>
                <p className="mt-1 font-display text-2xl uppercase tracking-[0.08em] text-vault-text">The Meridian Vault</p>
              </div>
              <span className="border border-signal-red/35 bg-signal-red/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-signal-red">High pressure</span>
            </div>

            <div className="mt-10">
              <div className="flex items-end justify-between gap-5">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-vault-text-dim">Your progress</p>
                  <p className="mt-2 font-display text-4xl text-vault-text">{selected.locks} / 5</p>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-oxide-green">{selected.tools} tool{selected.tools === 1 ? '' : 's'} ready</p>
              </div>
              <div className="mt-5 grid grid-cols-5 gap-2" role="img" aria-label={`${selected.locks} of 5 locks cracked`}>
                {[0, 1, 2, 3, 4].map((lock) => (
                  <span
                    key={lock}
                    className={`h-20 border transition-all duration-300 ${
                      lock < selected.locks
                        ? 'border-tungsten/70 bg-[linear-gradient(180deg,rgba(232,176,120,0.32),rgba(196,149,106,0.08))] shadow-[inset_0_0_24px_rgba(232,176,120,0.1)]'
                        : 'border-vault-border bg-vault-panel/55'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-2 sm:grid-cols-3">
              {[
                ['YOU', `${selected.locks} locks`, 'Ready'],
                ['ROOK', '4 locks', selected.id === 'sabotage' ? 'Stunned' : 'Threat'],
                ['MARA', '3 locks', 'Hidden'],
              ].map(([name, progress, status]) => (
                <div key={name} className="border border-vault-border bg-vault-surface/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] tracking-[0.16em] text-vault-text">{name}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${status === 'Stunned' ? 'bg-signal-red' : 'bg-oxide-green'}`} />
                  </div>
                  <p className="mt-3 font-display text-lg text-vault-text">{progress}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-vault-text-dim">{status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 border-l-2 border-tungsten bg-tungsten/8 p-4" aria-live="polite">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-tungsten">If you {selected.label}</p>
            <p className="mt-2 text-base leading-6 text-vault-text">{selected.result}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, copy }) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-tungsten">{eyebrow}</p>
      <h2 className="mt-4 font-display text-4xl font-semibold uppercase leading-[0.95] tracking-[0.01em] text-vault-text sm:text-5xl lg:text-6xl">{title}</h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-vault-text-dim sm:text-lg">{copy}</p>
    </div>
  );
}

function ActionGlyph({ action }) {
  const paths = {
    pick: <><circle cx="24" cy="24" r="15" /><path d="M24 9v30M9 24h30M14 14l20 20M34 14 14 34" /></>,
    search: <><circle cx="20" cy="20" r="11" /><path d="m28 28 11 11M20 14v12M14 20h12" /></>,
    sabotage: <><path d="M12 36 36 12M15 12l21 21M11 31l6 6M31 11l6 6" /><circle cx="24" cy="24" r="17" /></>,
  };
  return (
    <span className="grid h-14 w-14 place-items-center border border-vault-border bg-vault-dark text-vault-text transition-colors group-hover:border-tungsten/45 group-hover:text-tungsten">
      <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{paths[action]}</svg>
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="border border-vault-border bg-vault-surface p-5" role="status" aria-label="Loading live season">
      <div className="skeleton h-3 w-36" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-20" />)}
      </div>
    </div>
  );
}

function ServiceNotice() {
  return (
    <div className="flex flex-col gap-2 border border-vault-border bg-vault-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-tungsten">Season feed reconnecting</p>
        <p className="mt-1 text-sm text-vault-text-dim">The game contract and practice table remain available.</p>
      </div>
      <Link to="/simulator" className="font-mono text-[10px] uppercase tracking-[0.14em] text-oxide-green">Play offline practice -&gt;</Link>
    </div>
  );
}

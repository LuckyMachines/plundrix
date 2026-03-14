import { useState } from 'react';
import GameBrowser from '../components/game/GameBrowser';
import ContractConfigNotice from '../components/shared/ContractConfigNotice';
import QuickStartPanel from '../components/game/QuickStartPanel';
import SeasonOverview from '../components/competition/SeasonOverview';
import LeaderboardTable from '../components/competition/LeaderboardTable';
import SessionCard from '../components/competition/SessionCard';
import { useCompetitionOverview } from '../hooks/useCompetitionOverview';

export default function HomePage() {
  const { data, isLoading, error } = useCompetitionOverview();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-widest text-tungsten uppercase mb-2 font-display">
        Operations Console
      </h1>
      <p className="text-vault-text-dim font-mono text-sm mb-8">
        Sepolia staging is live for free-to-play onchain sessions with seasonal points, ladders,
        badges, and explicit bot play. Mainnet production is coming soon.
      </p>
      <ContractConfigNotice />
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorPanel error={error} />
      ) : (
        <>
          <SeasonOverview overview={data.overview} season={data.season} />
          <CollapsibleSection
            title="Leaderboards"
            defaultOpen
          >
            <div className="grid gap-6 md:grid-cols-2">
              <LeaderboardTable
                title={`${data.season.label} · Field Standings`}
                entries={data.featuredLeaderboard}
              />
              <LeaderboardTable
                title={`${data.season.label} · Agent Ladder`}
                entries={data.featuredAgentLadder}
                emptyLabel="No registered agents on ladder yet."
              />
            </div>
          </CollapsibleSection>
          <CollapsibleSection
            title="Session Feed"
            defaultOpen={false}
          >
            {data.featuredSessions?.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {data.featuredSessions.map((session) => (
                  <SessionCard key={session.gameId} session={session} />
                ))}
              </div>
            ) : (
              <div className="border border-vault-border rounded bg-vault-surface p-8 text-center font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim">
                No scored sessions yet.
              </div>
            )}
          </CollapsibleSection>
        </>
      )}
      <QuickStartPanel />
      <GameBrowser />
    </div>
  );
}

function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="space-y-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left min-h-[44px] group"
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`w-3 h-3 text-vault-text-dim transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        >
          <polyline points="6 4 10 8 6 12" />
        </svg>
        <h2 className="font-mono text-xs tracking-[0.3em] text-vault-text-dim uppercase group-hover:text-vault-text transition-colors">
          {title}
        </h2>
      </button>
      {open && children}
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Season overview skeleton */}
      <div className="border border-vault-border rounded bg-vault-surface p-6">
        <div className="skeleton h-4 w-48 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="skeleton h-3 w-16 mb-2" />
              <div className="skeleton h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
      {/* Leaderboard skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="border border-vault-border rounded bg-vault-surface">
            <div className="border-b border-vault-border px-5 py-4">
              <div className="skeleton h-3 w-40" />
            </div>
            <div className="divide-y divide-vault-border">
              {[1, 2, 3].map((j) => (
                <div key={j} className="px-5 py-4 flex items-center gap-4">
                  <div className="skeleton w-8 h-8 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                  <div className="skeleton h-6 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({ error }) {
  return (
    <div className="border border-signal-red/35 rounded bg-vault-surface p-8">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-red">
        Competition service unavailable
      </p>
      <p className="font-mono text-xs text-vault-text-dim mt-3 break-all">
        {error?.message || String(error)}
      </p>
    </div>
  );
}

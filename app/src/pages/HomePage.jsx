import GameBrowser from '../components/game/GameBrowser';
import ContractConfigNotice from '../components/shared/ContractConfigNotice';
import QuickStartPanel from '../components/game/QuickStartPanel';
import SeasonOverview from '../components/competition/SeasonOverview';
import LeaderboardTable from '../components/competition/LeaderboardTable';
import SessionCard from '../components/competition/SessionCard';
import Spinner from '../components/shared/Spinner';
import { useCompetitionOverview } from '../hooks/useCompetitionOverview';

export default function HomePage() {
  const { data, isLoading, error } = useCompetitionOverview();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
      <h1 className="text-3xl font-semibold tracking-widest text-tungsten uppercase mb-2 font-display">
        Operations Console
      </h1>
      <p className="text-vault-text-dim font-mono text-sm mb-8">
        Sepolia staging is live for free-to-play onchain sessions with seasonal points, ladders,
        badges, and explicit bot play. Mainnet production is coming soon.
      </p>
      <ContractConfigNotice />
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} />
      ) : (
        <>
          <SeasonOverview overview={data.overview} season={data.season} />
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
          <section className="space-y-4">
            <h2 className="font-mono text-xs tracking-[0.3em] text-vault-text-dim uppercase">
              Session Feed
            </h2>
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
          </section>
        </>
      )}
      <QuickStartPanel />
      <GameBrowser />
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="border border-vault-border rounded bg-vault-surface p-10 flex items-center justify-center gap-3">
      <Spinner size="w-5 h-5" />
      <span className="font-mono text-xs text-vault-text-dim uppercase tracking-[0.22em]">
        Building season index...
      </span>
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

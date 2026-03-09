import { Link, useParams } from 'react-router-dom';
import ProfileSummary from '../components/competition/ProfileSummary';
import SessionCard from '../components/competition/SessionCard';
import Spinner from '../components/shared/Spinner';
import { useCompetitionProfile } from '../hooks/useCompetitionProfile';
import { useCompetitionSessions } from '../hooks/useCompetitionSessions';

export default function ProfilePage() {
  const { address } = useParams();
  const profileQuery = useCompetitionProfile(address);
  const sessionsQuery = useCompetitionSessions({ limit: 30 });

  const profileSessions =
    sessionsQuery.data?.sessions?.filter((session) =>
      session.players.some((player) => player.address.toLowerCase() === address?.toLowerCase())
    ) || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/leaderboard"
          className="rounded border border-vault-border px-3 py-2 font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim hover:bg-vault-panel/70"
        >
          Back to Leaderboard
        </Link>
      </div>

      {profileQuery.isLoading ? (
        <LoadingState />
      ) : profileQuery.error ? (
        <ErrorState error={profileQuery.error} />
      ) : (
        <>
          <ProfileSummary data={profileQuery.data} />
          <section className="space-y-4">
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-vault-text-dim">
              Recent Sessions
            </h2>
            {sessionsQuery.isLoading ? (
              <LoadingState label="Loading recent sessions..." />
            ) : profileSessions.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {profileSessions.slice(0, 6).map((session) => (
                  <SessionCard key={session.gameId} session={session} />
                ))}
              </div>
            ) : (
              <div className="border border-vault-border rounded bg-vault-surface p-8 text-center font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim">
                No recent sessions found for this profile.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function LoadingState({ label = 'Loading profile...' }) {
  return (
    <div className="border border-vault-border rounded bg-vault-surface p-10 flex items-center gap-3 justify-center">
      <Spinner size="w-5 h-5" />
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-vault-text-dim">
        {label}
      </span>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="border border-signal-red/35 rounded bg-vault-surface p-8">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-red">
        Failed to load profile
      </p>
      <p className="font-mono text-xs text-vault-text-dim mt-3 break-all">
        {error?.message || String(error)}
      </p>
    </div>
  );
}

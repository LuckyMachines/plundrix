import { Link, useParams } from 'react-router-dom';
import ProfileSummary from '../components/competition/ProfileSummary';
import ProfileIntegrationStats from '../components/competition/ProfileIntegrationStats';
import SessionCard from '../components/competition/SessionCard';
import { ActionWaitPanel } from '../components/shared/ActionFeedback';
import { useCompetitionProfile } from '../hooks/useCompetitionProfile';
import { useCompetitionSessions } from '../hooks/useCompetitionSessions';
import { AGENT_SERVICE_CONFIGURED } from '../config/service';

export default function ProfilePage() {
  const { operatorId } = useParams();
  const profileQuery = useCompetitionProfile(operatorId);
  const sessionsQuery = useCompetitionSessions({ limit: 30 });

  const profileSessions =
    sessionsQuery.data?.sessions?.filter((session) =>
      session.players.some((player) => player.operatorId === operatorId)
    ) || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/leaderboard"
          className="rounded border border-vault-border px-3 py-2 font-mono text-xs uppercase tracking-beacon text-vault-text-dim hover:bg-vault-panel/70"
        >
          Back to Leaderboard
        </Link>
      </div>

      <div>
        <p className="label">Competition profile</p>
        <h1 className="mt-2 font-display text-3xl uppercase text-tungsten">{profileQuery.data?.profile?.displayName || 'Operator profile'}</h1>
      </div>

      {!AGENT_SERVICE_CONFIGURED ? (
        <UnavailableState />
      ) : profileQuery.isLoading ? (
        <LoadingState />
      ) : profileQuery.error ? (
        <ErrorState error={profileQuery.error} />
      ) : (
        <>
          <ProfileSummary data={profileQuery.data} />
          <ProfileIntegrationStats stats={null} />
          <section className="space-y-4">
            <h2 className="font-mono text-xs uppercase tracking-beacon text-vault-text-dim">
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
              <div className="border border-vault-border rounded bg-vault-surface p-8 text-center font-mono text-xs uppercase tracking-beacon text-vault-text-dim">
                No recent sessions found for this profile.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function UnavailableState() {
  return (
    <section className="rounded border border-tungsten/30 bg-vault-surface p-8">
      <p className="font-mono text-xs uppercase tracking-beacon text-tungsten">Profile feed is warming up</p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-vault-text-dim">
        This verified profile needs the competition index, which is not connected in this environment.
        No player data has been guessed or substituted.
      </p>
      <Link to="/leaderboard" className="btn-secondary mt-5">Return to leaderboards</Link>
    </section>
  );
}

function LoadingState({ label = 'Loading profile...' }) {
  return <ActionWaitPanel eyebrow="Operator dossier" stages={[{ after: 0, label }, { after: 1800, label: 'Loading recent operations' }, { after: 5000, label: 'Finishing the dossier' }, { after: 9000, label: 'Still working - keep this window open' }]} detail="Loading verified career and session records." />;
}

function ErrorState({ error }) {
  return (
    <div className="border border-signal-red/35 rounded bg-vault-surface p-8">
      <p className="font-mono text-xs uppercase tracking-beacon text-signal-red">
        Failed to load profile
      </p>
      <p className="font-mono text-xs text-vault-text-dim mt-3 break-all">
        {error?.message || String(error)}
      </p>
    </div>
  );
}

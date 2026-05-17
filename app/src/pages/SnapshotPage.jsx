import { Link } from 'react-router-dom';
import ActionPresenceField from '../components/actions/ActionPresenceField';
import LockRack from '../components/vault/LockRack';
import SessionIntegrationRail from '../components/vault/SessionIntegrationRail';
import CommandStrip from '../components/vault/CommandStrip';
import ReplayTimeline from '../components/resolution/ReplayTimeline';
import EventLog from '../components/shared/EventLog';
import OutcomeBadge from '../components/shared/OutcomeBadge';
import { Action, OutcomeReason } from '../lib/constants';

const ADDRESSES = [
  '0x71F2b1d77E9962e407A8bE11F22b6cA420c0a111',
  '0x9A40c5837C920f5a1BCfaCaf68fF6109c54D2222',
  '0xD18B4cEb14d1bB7a5317Fde419E5a17CCc333333',
  '0x55C4d8FeE6A2ab14cA2b7395CE86f42044444444',
];

const snapshotSession = {
  gameId: '127',
  mode: 'resolve-ready',
  currentRound: 3,
  playerCount: 4,
  allSubmitted: true,
  timedOut: false,
  canResolve: true,
  pressure: { remaining: 72, fraction: 0.24, stage: 'urgent', label: 'Urgent', urgency: 2 },
  playerStatus: {
    posture: 'loaded',
    locksCracked: 2,
    tools: 3,
    actionSubmitted: false,
  },
  recommendedIntent: 'pick',
  commandAvailability: {
    pick: true,
    search: true,
    sabotage: true,
    resolve: true,
    help: true,
    replay: true,
    cycleTarget: true,
  },
  latestCue: {
    type: 'sabotage.hit',
    actor: ADDRESSES[2],
    target: ADDRESSES[0],
    sound: 'sabotage.hit',
  },
  latestRoundSummary: {
    commits: 4,
    locks: 1,
    tools: 1,
    sabotages: 1,
    successes: 3,
    winner: null,
  },
  roundHistorySummary: [
    { round: 1, commits: 4, locks: 1, tools: 2, sabotages: 0 },
    { round: 2, commits: 4, locks: 1, tools: 1, sabotages: 1 },
    { round: 3, commits: 4, locks: 1, tools: 1, sabotages: 1 },
  ],
};

const snapshotEvents = [
  event('ActionSubmitted', 1, { player: ADDRESSES[0], action: Action.SEARCH }),
  event('ToolFound', 1, { player: ADDRESSES[0], totalTools: 1 }),
  event('RoundResolved', 1, { round: 1 }),
  event('ActionSubmitted', 2, { player: ADDRESSES[1], action: Action.PICK }),
  event('LockCracked', 2, { player: ADDRESSES[1], totalCracked: 1 }),
  event('PlayerSabotaged', 2, { attacker: ADDRESSES[2], victim: ADDRESSES[1] }),
  event('RoundResolved', 2, { round: 2 }),
  event('ActionSubmitted', 3, { player: ADDRESSES[0], action: Action.PICK }),
  event('ActionOutcome', 3, {
    player: ADDRESSES[0],
    action: Action.PICK,
    success: true,
    reason: OutcomeReason.PICK_SUCCESS,
    locksCracked: 2,
  }),
  event('ToolFound', 3, { player: ADDRESSES[3], totalTools: 2 }),
  event('PlayerSabotaged', 3, { attacker: ADDRESSES[2], victim: ADDRESSES[0] }),
  event('RoundResolved', 3, { round: 3 }),
];

const eventCues = snapshotEvents.map((entry) => ({
  type: cueType(entry.name),
  tone: cueTone(entry.name),
  actor: entry.args?.player || entry.args?.attacker,
  target: entry.args?.victim,
  sound: cueType(entry.name),
}));

const roundHistory = [1, 2, 3].map((round) => ({
  round,
  blockNumber: BigInt(4000 + round),
  resolvedAt: 1715700000000 + round * 60_000,
  events: snapshotEvents.filter((entry) => Number(entry.args?.round) === round),
}));

function event(name, round, args) {
  return {
    name,
    args: { gameID: 127n, round: BigInt(round), ...args },
    blockNumber: BigInt(4000 + round),
    transactionHash: `0xsnapshot${round}${name}`,
    timestamp: 1715700000000 + round * 60_000,
  };
}

function cueType(name) {
  if (name === 'LockCracked') return 'lock.crack';
  if (name === 'ToolFound') return 'tool.found';
  if (name === 'PlayerSabotaged') return 'sabotage.hit';
  if (name === 'RoundResolved') return 'round.resolve';
  if (name === 'ActionSubmitted') return 'action.commit';
  return 'action.outcome';
}

function cueTone(name) {
  if (name === 'LockCracked') return 'tungsten';
  if (name === 'ToolFound') return 'oxide';
  if (name === 'PlayerSabotaged') return 'danger';
  if (name === 'RoundResolved') return 'blueprint';
  return 'neutral';
}

export default function SnapshotPage() {
  return (
    <div className="max-w-7xl mx-auto px-5 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-vault-text-dim">
            Deterministic Dummy Data
          </p>
          <h1 className="font-display text-3xl uppercase tracking-[0.2em] text-tungsten">
            Plundrix Screenshot Rig
          </h1>
        </div>
        <Link to="/" className="font-mono text-xs uppercase tracking-[0.2em] text-vault-text-dim border border-vault-border px-3 py-2">
          Console
        </Link>
      </div>

      <section data-snapshot="console" className="snapshot-frame space-y-4">
        <SessionIntegrationRail session={snapshotSession} />
        <CommandStrip session={snapshotSession} />
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-4">
          <div className="border border-vault-border rounded bg-vault-panel p-4">
            <LockRack locksCracked={2} session={{ ...snapshotSession, latestCue: { type: 'lock.crack', total: 2 } }} />
          </div>
          <ActionPresenceField
            intent="sabotage"
            tools={3}
            players={ADDRESSES}
            targetLocked
            recommendedIntent="pick"
          />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <ActionCard tone="tungsten" title="Set Tension" value="70%" detail="3 tools applied" />
          <ActionCard tone="oxide" title="Sweep Compartment" value="60%" detail="2 open sockets" />
          <ActionCard tone="danger" title="Cut Line" value="0x71F2" detail="Target selected" />
        </div>
      </section>

      <section data-snapshot="replay" className="snapshot-frame">
        <ReplayTimeline
          roundHistory={roundHistory}
          currentAddress={ADDRESSES[0]}
          session={{ ...snapshotSession, eventCues }}
          selectedRound={3}
        />
      </section>

      <section data-snapshot="leaderboard" className="snapshot-frame space-y-4">
        <div className="border border-vault-border rounded bg-vault-surface">
          <div className="border-b border-vault-border px-5 py-4">
            <h2 className="font-mono text-xs tracking-[0.3em] text-vault-text-dim uppercase">
              Local Playstyle Integration
            </h2>
          </div>
          {[
            ['#1', '0x71F2', 148, 12, 8, 5, 3],
            ['#2', '0x9A40', 121, 9, 11, 2, 2],
            ['#3', '0xD18B', 104, 5, 6, 9, 1],
          ].map(([rank, address, score, locks, tools, hits, wins]) => (
            <div key={address} className="px-5 py-4 grid gap-3 md:grid-cols-[4rem_1fr_18rem] md:items-center border-b border-vault-border last:border-b-0">
              <div className="font-display text-2xl text-tungsten">{rank}</div>
              <div>
                <p className="font-mono text-sm uppercase tracking-[0.16em] text-vault-text">{address}</p>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-vault-text-dim mt-1">
                  Score {score} // 4 observed games
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 font-mono text-xs text-vault-text-dim">
                <Metric label="Locks" value={locks} />
                <Metric label="Tools" value={tools} />
                <Metric label="Hits" value={hits} />
                <Metric label="Wins" value={wins} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section data-snapshot="profile" className="snapshot-frame space-y-4">
        <div className="border border-vault-border rounded bg-vault-surface p-5">
          <h2 className="font-display text-3xl uppercase tracking-[0.18em] text-tungsten">
            0x71F2 Operative
          </h2>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-vault-text-dim mt-2">
            Observed Session Story
          </p>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Observed Games" value="4" />
            <Metric label="Locks" value="12" />
            <Metric label="Tools" value="8" />
            <Metric label="Sabotage Hits" value="5" />
            <Metric label="Stunned" value="2" />
            <Metric label="Commits" value="18" />
            <Metric label="Wins" value="3" />
            <Metric label="Score" value="148" />
          </div>
        </div>
      </section>

      <section data-snapshot="events" className="snapshot-frame">
        <EventLog events={snapshotEvents} cues={eventCues} focusRound={3} />
      </section>
    </div>
  );
}

function ActionCard({ tone, title, value, detail }) {
  const toneClass =
    tone === 'oxide'
      ? 'text-oxide-green border-oxide-green/30'
      : tone === 'danger'
        ? 'text-signal-red border-signal-red/30'
        : 'text-tungsten border-tungsten/30';
  return (
    <div className={`border rounded bg-vault-panel p-4 ${toneClass}`}>
      <p className="font-mono text-xs uppercase tracking-[0.24em]">{title}</p>
      <p className="font-display text-3xl uppercase tracking-[0.1em] text-vault-text mt-3">{value}</p>
      <p className="font-mono text-xs text-vault-text-dim mt-2">{detail}</p>
      <div className="mt-3">
        <OutcomeBadge tone={tone === 'danger' ? 'danger' : tone === 'oxide' ? 'oxide' : 'tungsten'}>
          {tone === 'danger' ? 'Target Locked' : tone === 'oxide' ? 'Tool Found' : 'Lock Cracked'}
        </OutcomeBadge>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-vault-border bg-vault-panel/70 px-3 py-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-vault-text-dim">
        {label}
      </div>
      <div className="mt-2 font-mono text-vault-text">{value}</div>
    </div>
  );
}

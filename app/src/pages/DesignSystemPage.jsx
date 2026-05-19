import { useState } from 'react';
import { PageIntro, ProductLoopRail } from '../components/cohesion/CohesionLayout';
import { GameShell, QuietPanel, StatusPill } from '../components/gameplay/GameShell';
import { LatestEventSurface, MatchStatusStrip } from '../components/gameplay/ActiveMatchReadout';
import ActionPresenceField from '../components/actions/ActionPresenceField';
import PickControl from '../components/actions/PickControl';
import SearchControl from '../components/actions/SearchControl';
import SabotageControl from '../components/actions/SabotageControl';
import TargetCycler from '../components/actions/TargetCycler';
import CommandStrip from '../components/vault/CommandStrip';
import LockRack from '../components/vault/LockRack';
import MissionCoach from '../components/vault/MissionCoach';
import RoundConsole from '../components/vault/RoundConsole';
import RoundSummaryCard from '../components/vault/RoundSummaryCard';
import SessionIntegrationRail from '../components/vault/SessionIntegrationRail';
import ActionSeal from '../components/player/ActionSeal';
import StunStamp from '../components/player/StunStamp';
import ToolTray from '../components/player/ToolTray';
import PickResult from '../components/resolution/PickResult';
import SearchResult from '../components/resolution/SearchResult';
import SabotageResult from '../components/resolution/SabotageResult';
import EventLog from '../components/shared/EventLog';
import OutcomeBadge from '../components/shared/OutcomeBadge';
import {
  ACTION_IDENTITIES,
  MOMENT_TAGS,
  OPERATOR_REACTIONS,
  TABLE_MOODS,
  VAULT_REACTIONS,
} from '../lib/funSystems';

const MOCK_PLAYERS = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333',
  '0x4444444444444444444444444444444444444444',
];

const mockSession = {
  mode: 'urgent',
  pressure: { stage: 'urgent', label: 'Hot', remaining: 72 },
  latestCue: { type: 'lock.crack', actor: MOCK_PLAYERS[0], total: 4 },
  playerStatus: { posture: 'armed' },
  commandAvailability: {
    pick: true,
    search: true,
    sabotage: true,
    cycleTarget: true,
    resolve: false,
    replay: true,
    help: true,
  },
  recommendedIntent: 'pick',
  latestRoundSummary: {
    commits: 4,
    locks: 2,
    tools: 1,
    sabotages: 1,
    winner: null,
  },
};

const latestEvent = {
  name: 'LockCracked',
  args: { player: MOCK_PLAYERS[0], totalCracked: 4 },
  timestamp: Date.now() - 12000,
};

const mockEvents = [
  {
    name: 'ActionSubmitted',
    args: { player: MOCK_PLAYERS[0], action: 1, round: 7 },
    timestamp: Date.now() - 52000,
    transactionHash: '0xevent1',
  },
  {
    name: 'ToolFound',
    args: { player: MOCK_PLAYERS[1], totalTools: 3, round: 7 },
    timestamp: Date.now() - 36000,
    transactionHash: '0xevent2',
  },
  {
    name: 'PlayerSabotaged',
    args: { attacker: MOCK_PLAYERS[2], victim: MOCK_PLAYERS[3], round: 7 },
    timestamp: Date.now() - 25000,
    transactionHash: '0xevent3',
  },
  {
    ...latestEvent,
    args: { ...latestEvent.args, round: 7 },
    transactionHash: '0xevent4',
  },
];

const colorTokens = [
  ['Vault dark', '--color-vault-dark'],
  ['Vault surface', '--color-vault-surface'],
  ['Vault panel', '--color-vault-panel'],
  ['Vault border', '--color-vault-border'],
  ['Vault text', '--color-vault-text'],
  ['Dim text', '--color-vault-text-dim'],
  ['Tungsten', '--color-tungsten'],
  ['Oxide green', '--color-oxide-green'],
  ['Signal red', '--color-signal-red'],
  ['Blueprint', '--color-blueprint'],
];

export default function DesignSystemPage() {
  const [target, setTarget] = useState(MOCK_PLAYERS[2]);
  const noop = () => {};

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <PageIntro route="/design-system" />
      <ProductLoopRail activeStep="play" compact />

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="label">System pillars</p>
            <h2 className="mt-2 font-display text-2xl text-vault-text">Game UI as a living table</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-vault-text-dim">
              The page collects the production game components into one reference surface so gameplay, simulator screenshots, and product pages can share one visual language.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {['Negative space protects play', 'Every input has posture', 'Proof shares one vocabulary', 'Details stay behind drawers'].map((item) => (
              <div key={item} className="rounded border border-vault-border bg-vault-dark/35 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-vault-text-dim">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Specimen title="Gameplay Shell" label="Primary composition">
        <div className="fun-game-state" data-table-mood="final-lock" data-vault-reaction="almost-open" data-action-identity="pick">
          <GameShell
            drawerLabel="Spec details"
            status={(
              <MatchStatusStrip
                gameId="42"
                currentRound={7}
                playerCount={4}
                allSubmitted={false}
                canResolve={false}
                session={mockSession}
                resolveBusy={false}
              />
            )}
            stage={(
              <div className="grid w-full max-w-5xl gap-5">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
                  <div className="flex min-h-[220px] items-center justify-center">
                    <LockRack
                      locksCracked={4}
                      session={mockSession}
                      vaultReaction={VAULT_REACTIONS.almostOpen}
                      actionIdentity={ACTION_IDENTITIES.pick}
                    />
                  </div>
                  <QuietPanel className="flex justify-center">
                    <RoundConsole
                      currentRound={7}
                      roundStartTime={0}
                      allSubmitted={false}
                      gameState={1}
                      canResolve={false}
                      session={mockSession}
                    />
                  </QuietPanel>
                </div>
                <LatestEventSurface event={latestEvent} />
              </div>
            )}
            action={(
              <div className="grid gap-4">
                <MissionCoach
                  connected
                  registered
                  actionSubmitted={false}
                  stunned={false}
                  tools={3}
                  canResolve={false}
                  allSubmitted={false}
                  session={mockSession}
                />
                <ActionPresenceField
                  intent="pick"
                  tools={3}
                  players={MOCK_PLAYERS}
                  recommendedIntent="pick"
                  targetLocked
                />
                <CommandStrip session={mockSession} />
              </div>
            )}
            details={(
              <div className="grid gap-4">
                <SessionIntegrationRail session={mockSession} />
                <RoundSummaryCard session={mockSession} />
                <EventLog events={mockEvents} focusRound={7} />
              </div>
            )}
          />
        </div>
      </Specimen>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Specimen title="Action Controls" label="Input feel">
          <TargetCycler
            players={MOCK_PLAYERS}
            currentAddress={MOCK_PLAYERS[0]}
            targetAddress={target}
            onTargetChange={setTarget}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <PickControl
              onSubmit={noop}
              disabled={false}
              stunned={false}
              tools={3}
              active
              pressed={false}
              invalidCount={0}
              onIntentStart={noop}
              onIntentEnd={noop}
              onInvalidIntent={noop}
            />
            <SearchControl
              onSubmit={noop}
              disabled={false}
              stunned={false}
              tools={2}
              active
              pressed={false}
              invalidCount={0}
              onIntentStart={noop}
              onIntentEnd={noop}
              onInvalidIntent={noop}
            />
            <SabotageControl
              onSubmit={noop}
              disabled={false}
              stunned={false}
              players={MOCK_PLAYERS}
              currentAddress={MOCK_PLAYERS[0]}
              active
              pressed={false}
              invalidCount={0}
              onIntentStart={noop}
              onIntentEnd={noop}
              onInvalidIntent={noop}
              onTargetIntentChange={setTarget}
              externalTarget={target}
            />
          </div>
        </Specimen>

        <Specimen title="Player State Primitives" label="Operator kit">
          <div className="grid gap-4">
            <div className="rounded border border-vault-border bg-vault-dark/40 p-4">
              <p className="label">Tools</p>
              <div className="mt-3">
                <ToolTray toolCount={3} />
              </div>
            </div>
            <div className="relative min-h-[96px] overflow-hidden rounded border border-signal-red/30 bg-vault-dark/40 p-4">
              <p className="label">Stun overlay</p>
              <StunStamp visible />
            </div>
            <div className="rounded border border-blueprint/30 bg-blueprint/5 p-4">
              <p className="label">Committed action</p>
              <ActionSeal visible />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatusPill label="Pressure" value="Critical" tone="danger" />
              <StatusPill label="State" value="Resolve ready" tone="good" />
              <StatusPill label="Signal" value="Tool found" tone="info" />
              <StatusPill label="Posture" value="Armed" tone="warn" />
            </div>
          </div>
        </Specimen>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Specimen title="Outcomes" label="Resolution language">
          <div className="grid gap-3">
            <PickResult player={MOCK_PLAYERS[0]} totalCracked={4} success detail="Pick pressure converted into visible progress." />
            <SearchResult player={MOCK_PLAYERS[1]} totalTools={3} success detail="Search added future agency without crowding the active turn." />
            <SabotageResult attacker={MOCK_PLAYERS[2]} victim={MOCK_PLAYERS[3]} detail="Sabotage changed the table story with one compact beat." />
            <div className="flex flex-wrap gap-2">
              <OutcomeBadge tone="tungsten">LOCK CRACKED</OutcomeBadge>
              <OutcomeBadge tone="oxide">TOOL FOUND</OutcomeBadge>
              <OutcomeBadge tone="danger">CUT LINE</OutcomeBadge>
              <OutcomeBadge tone="neutral">NO JOY</OutcomeBadge>
            </div>
          </div>
        </Specimen>

        <Specimen title="Tokens" label="Color and tone">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colorTokens.map(([label, token]) => (
              <div key={token} className="rounded border border-vault-border bg-vault-dark/40 p-3">
                <div className="h-12 rounded border border-vault-border" style={{ background: `var(${token})` }} />
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-vault-text">{label}</p>
                <p className="mt-1 font-mono text-[11px] text-vault-text-dim">{token}</p>
              </div>
            ))}
          </div>
        </Specimen>
      </section>

      <Specimen title="Fun State Vocabulary" label="Shared data attributes">
        <div className="grid gap-4 lg:grid-cols-5">
          <StateList title="Table moods" items={Object.values(TABLE_MOODS)} prefix="data-table-mood" />
          <StateList title="Vault reactions" items={Object.values(VAULT_REACTIONS)} prefix="data-vault-reaction" />
          <StateList title="Action identities" items={Object.values(ACTION_IDENTITIES)} prefix="data-action-identity" />
          <StateList title="Operator reactions" items={Object.values(OPERATOR_REACTIONS)} prefix="data-reaction" />
          <StateList title="Moment tags" items={Object.values(MOMENT_TAGS)} prefix="moment" />
        </div>
      </Specimen>
    </div>
  );
}

function Specimen({ title, label, children }) {
  return (
    <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">{label}</p>
          <h2 className="mt-2 font-display text-2xl text-vault-text">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function StateList({ title, items, prefix }) {
  return (
    <div className="rounded border border-vault-border bg-vault-dark/35 p-3">
      <h3 className="font-display text-xs uppercase tracking-[0.2em] text-vault-text-dim">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item.id} className="rounded border border-vault-border bg-vault-panel/60 px-2.5 py-2">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-vault-text">{item.label}</p>
            <p className="mt-1 break-all font-mono text-[10px] text-vault-text-dim">{prefix}="{item.id}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageIntro } from '../components/cohesion/CohesionLayout';
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
import PhaseIndicator from '../components/vault/PhaseIndicator';
import RoundConsole from '../components/vault/RoundConsole';
import RoundSummaryCard from '../components/vault/RoundSummaryCard';
import SessionIntegrationRail from '../components/vault/SessionIntegrationRail';
import TimeoutDial from '../components/vault/TimeoutDial';
import ActionSeal from '../components/player/ActionSeal';
import StunStamp from '../components/player/StunStamp';
import ToolTray from '../components/player/ToolTray';
import PickResult from '../components/resolution/PickResult';
import SearchResult from '../components/resolution/SearchResult';
import SabotageResult from '../components/resolution/SabotageResult';
import EventLog from '../components/shared/EventLog';
import OutcomeBadge from '../components/shared/OutcomeBadge';
import Spinner from '../components/shared/Spinner';
import TxStatus from '../components/shared/TxStatus';
import BadgeChip from '../components/competition/BadgeChip';
import QueuePill from '../components/competition/QueuePill';
import TypePill from '../components/competition/TypePill';
import {
  ACTION_IDENTITIES,
  MOMENT_TAGS,
  OPERATOR_REACTIONS,
  TABLE_MOODS,
  VAULT_REACTIONS,
} from '../lib/funSystems';
import {
  ASSET_LIBRARY,
  ART_FAMILY_LIBRARY,
  ART_PART_QUEUE,
  ART_PIPELINE_SUMMARY,
  COLOR_TOKENS,
  DESIGN_PRINCIPLES,
  DESIGN_SECTIONS,
  EXPERIENCE_COVERAGE,
  MOTION_TOKENS,
  SPACING_TOKENS,
  TYPE_STYLES,
  VOICE_RULES,
} from '../data/designSystem';
import { CRAFTING_MATERIALS, GADGET_CATALOG } from '../data/gadgetInventory';
import GadgetVisual from '../components/workshop/GadgetVisual';

const REVIEW_KEY = 'plundrix-design-system-review-v1';
const MOCK_PLAYERS = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333',
  '0x4444444444444444444444444444444444444444',
];
const INVENTORY_SPECIMENS = [GADGET_CATALOG[0], GADGET_CATALOG[527], GADGET_CATALOG[1199]];

const mockSession = {
  mode: 'urgent',
  pressure: { stage: 'urgent', label: 'Hot', remaining: 72 },
  latestCue: { type: 'lock.crack', actor: MOCK_PLAYERS[0], total: 4 },
  playerStatus: { posture: 'armed' },
  commandAvailability: { pick: true, search: true, sabotage: true, cycleTarget: true, resolve: false, replay: true, help: true },
  recommendedIntent: 'pick',
  latestRoundSummary: { commits: 4, locks: 2, tools: 1, sabotages: 1, winner: null },
};

const latestEvent = {
  name: 'LockCracked',
  args: { player: MOCK_PLAYERS[0], totalCracked: 4 },
  timestamp: Date.now() - 12000,
};

const mockEvents = [
  { name: 'ActionSubmitted', args: { player: MOCK_PLAYERS[0], action: 1, round: 7 }, timestamp: Date.now() - 52000, transactionHash: '0xevent1' },
  { name: 'ToolFound', args: { player: MOCK_PLAYERS[1], totalTools: 3, round: 7 }, timestamp: Date.now() - 36000, transactionHash: '0xevent2' },
  { name: 'PlayerSabotaged', args: { attacker: MOCK_PLAYERS[2], victim: MOCK_PLAYERS[3], round: 7 }, timestamp: Date.now() - 25000, transactionHash: '0xevent3' },
  { ...latestEvent, args: { ...latestEvent.args, round: 7 }, transactionHash: '0xevent4' },
];

const EMPTY_REVIEW = Object.freeze({
  statuses: {},
  priorities: {},
  sectionNotes: {},
  reviewer: '',
  version: '1.0',
  notes: '',
});

function normalizeReview(input = {}) {
  const source = input.review || input;
  const statuses = { ...(source.statuses || {}) };
  const priorities = { ...(source.priorities || {}) };
  const sectionNotes = { ...(source.sectionNotes || {}) };

  if (Array.isArray(input.sections)) {
    input.sections.forEach((section) => {
      if (!section?.id) return;
      if (section.status) statuses[section.id] = section.status;
      if (section.priority) priorities[section.id] = section.priority;
      if (section.note) sectionNotes[section.id] = section.note;
    });
  }

  return {
    ...EMPTY_REVIEW,
    ...source,
    statuses,
    priorities,
    sectionNotes,
  };
}

function initialReview() {
  if (typeof window === 'undefined') return normalizeReview();
  try {
    return normalizeReview(JSON.parse(window.localStorage.getItem(REVIEW_KEY)) || {});
  } catch {
    return normalizeReview();
  }
}

export default function DesignSystemPage() {
  const [target, setTarget] = useState(MOCK_PLAYERS[2]);
  const [actionState, setActionState] = useState('ready');
  const [viewport, setViewport] = useState('desktop');
  const [filter, setFilter] = useState('all');
  const [review, setReview] = useState(initialReview);
  const [reviewMessage, setReviewMessage] = useState('');
  const importRef = useRef(null);
  const noop = () => {};

  useEffect(() => {
    window.localStorage.setItem(REVIEW_KEY, JSON.stringify(review));
  }, [review]);

  const counts = useMemo(() => DESIGN_SECTIONS.reduce((result, section) => {
    const status = review.statuses?.[section.id] || 'unreviewed';
    result[status] += 1;
    return result;
  }, { approved: 0, 'needs-work': 0, unreviewed: 0 }), [review.statuses]);
  const visibleSections = useMemo(
    () => DESIGN_SECTIONS.filter((section) => filter === 'all' || (review.statuses?.[section.id] || 'unreviewed') === filter),
    [filter, review.statuses],
  );

  const setSectionStatus = (id, status) => {
    setReview((current) => ({
      ...current,
      statuses: { ...current.statuses, [id]: current.statuses?.[id] === status ? 'unreviewed' : status },
    }));
  };

  const updateSectionReview = (id, field, value) => {
    const key = field === 'note' ? 'sectionNotes' : 'priorities';
    setReview((current) => ({
      ...current,
      [key]: { ...current[key], [id]: value },
    }));
  };

  const exportReview = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      schemaVersion: 2,
      reviewer: review.reviewer || '',
      designSystemVersion: review.version || '1.0',
      summary: counts,
      sections: DESIGN_SECTIONS.map((section) => ({
        ...section,
        status: review.statuses?.[section.id] || 'unreviewed',
        priority: review.priorities?.[section.id] || '',
        note: review.sectionNotes?.[section.id] || '',
      })),
      notes: review.notes || '',
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plundrix-design-review.json';
    link.click();
    URL.revokeObjectURL(url);
    setReviewMessage('Review exported.');
  };

  const importReview = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setReview(normalizeReview(JSON.parse(await file.text())));
      setReviewMessage(`Imported ${file.name}.`);
    } catch {
      setReviewMessage('Import failed. Choose a valid Plundrix review JSON file.');
    }
  };

  const resetReview = () => {
    if (!window.confirm('Reset every review status, priority, and note on this device?')) return;
    setReview(normalizeReview());
    setFilter('all');
    setReviewMessage('Review reset.');
  };

  const specimenProps = (id) => ({
    id,
    status: review.statuses?.[id] || 'unreviewed',
    filter,
    onStatusChange: (status) => setSectionStatus(id, status),
    priority: review.priorities?.[id] || '',
    note: review.sectionNotes?.[id] || '',
    onPriorityChange: (value) => updateSectionReview(id, 'priority', value),
    onNoteChange: (value) => updateSectionReview(id, 'note', value),
  });
  const disabled = actionState === 'disabled';
  const stunned = actionState === 'stunned';

  return (
    <div className="internal-tool-page ds-page mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      <PageIntro
        route="/design-system"
        eyebrow="Internal reference / living system"
        title="Plundrix Design System"
        description="One review surface for the visual language, interaction rules, game states, responsive behavior, content voice, and production component coverage. Review decisions persist in this browser."
        primaryAction={<Link to="/design" className="btn-secondary">Open decision tower</Link>}
      />

      <ReviewToolbar
        counts={counts}
        filter={filter}
        setFilter={setFilter}
        exportReview={exportReview}
        importReview={() => importRef.current?.click()}
        resetReview={resetReview}
      />
      <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Import design review JSON" onChange={importReview} />
      {reviewMessage && <p className="rounded border border-blueprint/35 bg-blueprint/10 px-3 py-2 font-mono text-xs text-blueprint" role="status" aria-live="polite">{reviewMessage}</p>}

      <div className="ds-layout">
        <aside className="ds-index" aria-label="Design system sections" tabIndex={0}>
          <p className="label">System index</p>
          <nav className="mt-3 grid gap-1">
            {visibleSections.map((section) => {
              const index = DESIGN_SECTIONS.findIndex((item) => item.id === section.id);
              const status = review.statuses?.[section.id] || 'unreviewed';
              return (
                <a key={section.id} href={`#${section.id}`} className="ds-index-link">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1 truncate">{section.label}</span>
                  <span className={`ds-review-dot ds-review-dot-${status}`} aria-label={status} />
                </a>
              );
            })}
          </nav>
          <details className="mt-5 border-t border-vault-border pt-4">
            <summary className="cursor-pointer label">Review owner and notes</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2">
                <span className="field-label">Reviewer</span>
                <input className="control" value={review.reviewer || ''} onChange={(event) => setReview((current) => ({ ...current, reviewer: event.target.value }))} placeholder="Name or team" />
              </label>
              <label className="grid gap-2">
                <span className="field-label">System version</span>
                <input className="control" value={review.version || ''} onChange={(event) => setReview((current) => ({ ...current, version: event.target.value }))} placeholder="1.0" />
              </label>
            </div>
            <textarea
              value={review.notes || ''}
              onChange={(event) => setReview((current) => ({ ...current, notes: event.target.value }))}
              className="control mt-3 min-h-[150px] py-3"
              placeholder="Capture cross-system decisions, inconsistencies, and next passes."
              aria-label="Design review notes"
            />
          </details>
        </aside>

        <div className="min-w-0 space-y-6">
          {visibleSections.length === 0 && (
            <section className="ds-specimen text-center">
              <p className="font-display text-2xl text-vault-text">No sections match this filter.</p>
              <button type="button" className="btn-secondary mt-4" onClick={() => setFilter('all')}>Show every section</button>
            </section>
          )}
          <Specimen {...specimenProps('principles')} label="Foundation" title="Design principles" description="The non-negotiable rules that decide what belongs on screen.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {DESIGN_PRINCIPLES.map((item) => (
                <article key={item.number} className="surface-card">
                  <span className="font-mono text-xs text-tungsten">{item.number}</span>
                  <h3 className="mt-4 font-display text-2xl uppercase text-vault-text">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-vault-text-dim">{item.description}</p>
                </article>
              ))}
            </div>
          </Specimen>

          <Specimen {...specimenProps('color')} label="Foundation" title="Semantic color" description="Color communicates gameplay meaning. Every accent keeps one primary job.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {COLOR_TOKENS.map((color) => (
                <article key={color.token} className="overflow-hidden rounded border border-vault-border bg-vault-dark/45">
                  <div className="h-20 border-b border-vault-border" style={{ background: `var(${color.token})` }} />
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg uppercase text-vault-text">{color.label}</h3>
                      <span className="font-mono text-[10px] text-vault-text-dim">{color.value}</span>
                    </div>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-tungsten">{color.role}</p>
                    <p className="mt-2 text-sm leading-5 text-vault-text-dim">{color.usage}</p>
                    <code className="mt-3 block break-all text-[11px] text-blueprint">var({color.token})</code>
                  </div>
                </article>
              ))}
            </div>
            <RulePair good="Use one accent to describe one state." avoid="Do not use red, green, and gold as decoration in the same control." />
          </Specimen>

          <Specimen {...specimenProps('type')} label="Foundation" title="Typography" description="Barlow Condensed carries story and hierarchy. JetBrains Mono carries controls, status, and proof.">
            <div className="divide-y divide-vault-border rounded border border-vault-border bg-vault-dark/35">
              {TYPE_STYLES.map((style) => (
                <div key={style.id} className="grid gap-3 p-4 lg:grid-cols-[150px_minmax(0,1fr)_220px] lg:items-center">
                  <div><p className="label">{style.label}</p><p className="mt-1 font-mono text-[10px] text-vault-text-dim">{style.use}</p></div>
                  <p className={style.className}>{style.sample}</p>
                  <code className="break-words font-mono text-[10px] leading-5 text-blueprint">{style.className}</code>
                </div>
              ))}
            </div>
            <RulePair good="Sentence case for promises; uppercase for compact interface labels." avoid="Do not set paragraphs in uppercase or stretch tracking across long copy." />
          </Specimen>

          <Specimen {...specimenProps('space')} label="Foundation" title="Space, shape, and elevation" description="A compact 4px rhythm, restrained corners, and borders create the industrial table without visual noise.">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="surface-card">
                <p className="label">Spacing scale</p>
                <div className="mt-4 grid gap-3">
                  {SPACING_TOKENS.map((space) => (
                    <div key={space.label} className="grid grid-cols-[44px_1fr_150px] items-center gap-3">
                      <span className="font-mono text-xs text-vault-text">{space.label}</span>
                      <span className="h-3 bg-tungsten/70" style={{ width: `${space.value * 2}px` }} />
                      <span className="text-xs text-vault-text-dim">{space.value}px / {space.use}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['2-4px', 'Controls and chips', 'rounded'],
                  ['6-8px', 'Panels and cards', 'rounded-md'],
                  ['999px', 'Identity pills only', 'rounded-full'],
                  ['1px border', 'Default elevation', 'border'],
                ].map(([value, use, shape]) => (
                  <div key={value} className={`grid min-h-[140px] place-items-center border border-vault-border bg-vault-panel/60 p-4 text-center ${shape}`}>
                    <div><p className="font-display text-2xl text-vault-text">{value}</p><p className="mt-2 text-sm text-vault-text-dim">{use}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </Specimen>

          <Specimen {...specimenProps('controls')} label="Components" title="Controls and inputs" description="Every control has a 44px minimum target, visible focus, explicit state, and a verb that predicts the result.">
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="surface-card">
                <p className="label">Button hierarchy</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button type="button" className="btn-primary">Commit and reveal</button>
                  <button type="button" className="btn-secondary">Watch replay</button>
                  <button type="button" className="btn-danger">Sabotage rival</button>
                  <button type="button" className="btn-quiet">Table details</button>
                  <button type="button" className="btn-primary" disabled>Unavailable</button>
                  <button type="button" className="btn-secondary"><Spinner size="h-4 w-4" /> Confirming</button>
                </div>
              </div>
              <div className="surface-card">
                <p className="label">Form controls</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2"><span className="field-label">Operator name</span><input className="control" defaultValue="Lockrunner" /></label>
                  <label className="grid gap-2"><span className="field-label">Target rival</span><select className="control" defaultValue="rook"><option value="rook">Rook</option><option value="mara">Mara</option></select></label>
                  <label className="grid gap-2 sm:col-span-2"><span className="field-label">Session note</span><textarea className="control min-h-[90px] py-3" defaultValue="Watch the final lock pressure." /></label>
                </div>
              </div>
            </div>
            <RulePair good="Primary action: one per decision region, written as verb + outcome." avoid="Do not use two filled buttons or vague labels such as Submit and Continue." />
          </Specimen>

          <Specimen {...specimenProps('feedback')} label="Components" title="Status, identity, and feedback" description="Small components must stay meaningful without relying on color alone.">
            <div className="grid gap-5 xl:grid-cols-4">
              <div className="surface-card">
                <p className="label">Status and outcome</p>
                <div className="mt-4 grid grid-cols-2 gap-3"><StatusPill label="Pressure" value="Critical" tone="danger" /><StatusPill label="State" value="Resolve ready" tone="good" /><StatusPill label="Signal" value="Tool found" tone="info" /><StatusPill label="Posture" value="Armed" tone="warn" /></div>
                <div className="mt-5 flex flex-wrap gap-2"><OutcomeBadge tone="tungsten">Lock cracked</OutcomeBadge><OutcomeBadge tone="oxide">Tool found</OutcomeBadge><OutcomeBadge tone="danger">Cut line</OutcomeBadge><OutcomeBadge tone="neutral">No joy</OutcomeBadge></div>
              </div>
              <div className="surface-card">
                <p className="label">Identity and queue</p>
                <div className="mt-4 flex flex-wrap gap-2"><TypePill type="human" /><TypePill type="agent" /><TypePill type="bot" /><TypePill type="unverified" /></div>
                <div className="mt-4 flex flex-wrap gap-2"><QueuePill queue="open" /><QueuePill queue="mixed" /><QueuePill queue="agent_ladder" /></div>
                <div className="mt-4"><BadgeChip badge={{ label: 'Vaultbreaker' }} /></div>
              </div>
              <div className="surface-card">
                <p className="label">Transaction lifecycle</p>
                <TxStatus isPending />
                <TxStatus isConfirming hash="0x1234567890abcdef" />
                <TxStatus isSuccess hash="0x1234567890abcdef" />
                <TxStatus error={{ message: 'Action expired before confirmation.' }} />
              </div>
              <div className="surface-card">
                <p className="label">System feedback</p>
                <div className="mt-4 grid gap-2 font-mono text-xs">
                  <div className="rounded border border-oxide-green/40 bg-oxide-green/10 p-3 text-oxide-green" role="status">Saved to this device.</div>
                  <div className="rounded border border-blueprint/40 bg-blueprint/10 p-3 text-blueprint" role="status">Link copied. Ready to share.</div>
                  <div className="rounded border border-signal-red/40 bg-signal-red/10 p-3 text-signal-red" role="alert">Wallet connection failed. Try again.</div>
                </div>
              </div>
            </div>
          </Specimen>

          <Specimen {...specimenProps('gameplay')} label="Game" title="Primary gameplay composition" description="The real production shell: status first, vault and opponents second, one sticky action dock, details on demand.">
            <div className="fun-game-state" data-table-mood="final-lock" data-vault-reaction="almost-open" data-action-identity="pick">
              <GameShell
                drawerLabel="Spec details"
                status={<MatchStatusStrip gameId="42" currentRound={7} playerCount={4} allSubmitted={false} canResolve={false} session={mockSession} resolveBusy={false} />}
                stage={<div className="grid w-full max-w-5xl gap-5"><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center"><div className="flex min-h-[220px] items-center justify-center"><LockRack locksCracked={4} session={mockSession} vaultReaction={VAULT_REACTIONS.almostOpen} actionIdentity={ACTION_IDENTITIES.pick} /></div><QuietPanel className="flex justify-center"><RoundConsole currentRound={7} roundStartTime={0} allSubmitted={false} gameState={1} canResolve={false} session={mockSession} /></QuietPanel></div><LatestEventSurface event={latestEvent} /></div>}
                action={<div className="grid gap-4"><MissionCoach connected registered actionSubmitted={false} stunned={false} tools={3} canResolve={false} allSubmitted={false} session={mockSession} /><ActionPresenceField intent="pick" tools={3} players={MOCK_PLAYERS} recommendedIntent="pick" targetLocked /><CommandStrip session={mockSession} /></div>}
                details={<div className="grid gap-4"><SessionIntegrationRail session={mockSession} /><RoundSummaryCard session={mockSession} /><EventLog events={mockEvents} focusRound={7} /></div>}
              />
            </div>
          </Specimen>

          <Specimen {...specimenProps('actions')} label="Game" title="Action and operator states" description="Switch the specimen state to compare ready, stunned, and disabled behavior in the same composition.">
            <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Action specimen state">
              {['ready', 'stunned', 'disabled'].map((state) => <button key={state} type="button" aria-pressed={actionState === state} onClick={() => setActionState(state)} className={actionState === state ? 'btn-primary' : 'btn-secondary'}>{state}</button>)}
            </div>
            <TargetCycler players={MOCK_PLAYERS} currentAddress={MOCK_PLAYERS[0]} targetAddress={target} onTargetChange={setTarget} />
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <PickControl onSubmit={noop} disabled={disabled} stunned={stunned} tools={3} active pressed={false} invalidCount={0} onIntentStart={noop} onIntentEnd={noop} onInvalidIntent={noop} />
              <SearchControl onSubmit={noop} disabled={disabled} stunned={stunned} tools={2} active pressed={false} invalidCount={0} onIntentStart={noop} onIntentEnd={noop} onInvalidIntent={noop} />
              <SabotageControl onSubmit={noop} disabled={disabled} stunned={stunned} players={MOCK_PLAYERS} currentAddress={MOCK_PLAYERS[0]} active pressed={false} invalidCount={0} onIntentStart={noop} onIntentEnd={noop} onInvalidIntent={noop} onTargetIntentChange={setTarget} externalTarget={target} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3"><StateTile label="Tools"><ToolTray toolCount={3} /></StateTile><StateTile label="Stun overlay" danger><div className="relative min-h-[72px]"><StunStamp visible /></div></StateTile><StateTile label="Committed"><div className="relative min-h-[72px]"><ActionSeal visible /></div></StateTile></div>
            <details className="mt-5 rounded border border-vault-border bg-vault-dark/35 p-4"><summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">State vocabulary</summary><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><StateList title="Table moods" items={Object.values(TABLE_MOODS)} prefix="table" /><StateList title="Vault reactions" items={Object.values(VAULT_REACTIONS)} prefix="vault" /><StateList title="Action identities" items={Object.values(ACTION_IDENTITIES)} prefix="action" /><StateList title="Operator reactions" items={Object.values(OPERATOR_REACTIONS)} prefix="operator" /><StateList title="Moment tags" items={Object.values(MOMENT_TAGS)} prefix="moment" /></div></details>
          </Specimen>

          <Specimen {...specimenProps('journeys')} label="Game" title="Journey state gallery" description="Every core moment should be recognizable before reading the supporting copy.">
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              <JourneyCard step="01 / Enter" title="Choose your breach" tone="tungsten"><p>Start instantly with three labeled agents, or enter a live Sepolia table.</p><button type="button" className="btn-primary mt-4">Start instant match</button></JourneyCard>
              <JourneyCard step="02 / Assemble" title="Operation briefing" tone="blueprint"><div className="grid gap-2"><ProgressRow done label="Connect wallet" /><ProgressRow done label="Join operation" /><ProgressRow label="Minimum 2 players" /></div></JourneyCard>
              <JourneyCard step="03 / Decide" title="Round 7" tone="tungsten"><div className="grid gap-4 overflow-x-auto" role="region" aria-label="Round phase preview" tabIndex={0}><PhaseIndicator gameState={1} allSubmitted={false} /><TimeoutDial roundStartTime={0} timeout={300} pressure={{ stage: 'urgent', remaining: 72 }} /></div></JourneyCard>
              <JourneyCard step="04 / Resolve" title="The table reveals" tone="oxide"><div className="grid gap-2"><PickResult player={MOCK_PLAYERS[0]} totalCracked={4} success /><SearchResult player={MOCK_PLAYERS[1]} totalTools={3} success /><SabotageResult attacker={MOCK_PLAYERS[2]} victim={MOCK_PLAYERS[3]} /></div></JourneyCard>
              <JourneyCard step="05 / Finish" title="Vault breached" tone="tungsten"><p className="text-lg text-vault-text">Rook found the final opening in 9 rounds.</p><div className="mt-4 flex gap-2"><button type="button" className="btn-primary">Rematch</button><button type="button" className="btn-secondary">Share</button></div></JourneyCard>
              <JourneyCard step="06 / Remember" title="Replay the swing" tone="blueprint"><img src="/images/replay-comeback.webp" alt="Comeback replay artwork" className="mt-3 aspect-[16/8] w-full rounded object-cover" /><p className="mt-3">Round 8: one stolen tool changed the race.</p></JourneyCard>
              <JourneyCard step="Empty" title="The first table is yours"><p>Create a free live operation or learn the vault instantly.</p><button type="button" className="btn-secondary mt-4">Play instantly</button></JourneyCard>
              <JourneyCard step="Loading" title="Scanning operations"><div className="mt-4 grid gap-2"><span className="skeleton h-4 w-2/3" /><span className="skeleton h-16 w-full" /></div></JourneyCard>
              <JourneyCard step="Error" title="Live feed unavailable" tone="danger"><p>Your match is safe. Try again, or continue in Instant Play.</p><button type="button" className="btn-danger mt-4">Try again</button></JourneyCard>
            </div>
          </Specimen>

          <Specimen {...specimenProps('inventory')} label="Game" title="Inventory and crafting" description="A modular collection should make ownership legible, recipes concrete, and equipped power honest before it tries to feel abundant.">
            <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
              <div className="surface-card">
                <p className="label text-tungsten">Material wallet</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">{CRAFTING_MATERIALS.map((material, index) => <div key={material.id} className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-2 border border-vault-border bg-vault-dark/45 p-2"><img src={material.image} alt="" className="h-12 w-12 object-contain" /><div><p className="font-display uppercase text-vault-text">{material.label}</p><p className="font-mono text-sm text-tungsten-bright">{18 + index * 7}</p></div></div>)}</div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">{INVENTORY_SPECIMENS.map((gadget, index) => <article key={gadget.id} className="border border-vault-border bg-vault-dark/45 p-3" style={{ borderTopColor: gadget.finishColor }}><GadgetVisual gadget={gadget} compact /><div className="mt-3 flex justify-between gap-2"><span className="font-mono text-xs uppercase text-tungsten">{index === 0 ? 'Equipped' : index === 1 ? 'Craftable' : 'Locked'}</span><span className="font-mono text-xs text-vault-text-dim">{gadget.serial}</span></div><h3 className="mt-2 font-display text-xl uppercase text-vault-text">{gadget.name}</h3><p className="mt-1 font-mono text-xs uppercase" style={{ color: gadget.finishColor }}>{gadget.calibrationModule}</p><p className="mt-3 text-xs leading-5 text-vault-text-dim"><strong className="text-vault-text">{gadget.effectName}:</strong> {gadget.protocolLabel}</p><button type="button" disabled={index === 2} className={index === 0 ? 'btn-primary mt-3 w-full' : 'btn-secondary mt-3 w-full'}>{index === 0 ? 'Equipped' : index === 1 ? 'Assemble' : 'Need salvage'}</button></article>)}</div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3"><MiniRule title="Abundance rule" body="Lead with ten meaningful chassis; describe the 1,200 records as configurations." /><MiniRule title="Power rule" body="Chassis controls one of ten visible signatures. Finish, module, and rarity never hide power." /><MiniRule title="Reward rule" body="Every match pays salvage; unwanted custom builds can be reclaimed for half their recipe." /></div>
          </Specimen>

          <Specimen {...specimenProps('responsive')} label="System" title="Responsive composition" description="Inspect the same hierarchy at target widths. Mobile preserves the decision and moves supporting detail below it.">
            <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Preview width">{['mobile', 'tablet', 'desktop'].map((size) => <button key={size} type="button" aria-pressed={viewport === size} onClick={() => setViewport(size)} className={viewport === size ? 'btn-primary' : 'btn-secondary'}>{size}</button>)}</div>
            <div className="overflow-x-auto rounded border border-vault-border bg-black/30 p-3 sm:p-6" role="region" aria-label="Responsive interface preview" tabIndex={0}><div className="ds-responsive-frame" data-viewport={viewport}><div className="border-b border-vault-border bg-vault-dark px-4 py-3"><span className="font-display text-xl font-bold uppercase tracking-[0.18em]">Plundrix</span></div><div className="ds-responsive-content grid grid-cols-[1fr_0.65fr] gap-4 p-4"><div className="instant-vault-core grid min-h-[240px] place-items-center border border-vault-border p-5 text-center"><div><p className="label">Round 4 / vault</p><p className="mt-3 font-display text-5xl text-tungsten-bright">3 / 5</p><p className="mt-2 text-vault-text-dim">Two locks remain.</p></div></div><div className="border border-vault-border bg-vault-surface p-4"><p className="label">Choose one action</p><div className="mt-4 grid gap-2"><button type="button" className="btn-primary">Pick - 70%</button><button type="button" className="btn-secondary">Search - 60%</button><button type="button" className="btn-danger">Sabotage</button></div></div></div></div></div>
            <div className="mt-4 grid gap-3 md:grid-cols-3"><MiniRule title="Mobile / 390px" body="One decision column, horizontal rival rail, sticky commit action." /><MiniRule title="Tablet / 768px" body="Two-column actions where readable; details remain secondary." /><MiniRule title="Desktop / 1440px" body="Vault and action dock share the viewport; maximum line length stays controlled." /></div>
          </Specimen>

          <Specimen {...specimenProps('motion')} label="System" title="Motion, sound, and accessibility" description="Feedback can enrich a result but must never carry required information by itself.">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="surface-card"><p className="label">Motion timing</p><div className="mt-4 grid gap-3">{MOTION_TOKENS.map((token) => <div key={token.label} className="grid grid-cols-[72px_88px_1fr] gap-3 border-b border-vault-border pb-3"><span className="font-mono text-xs uppercase text-vault-text">{token.label}</span><span className="font-mono text-xs text-tungsten">{token.value}</span><span className="text-sm text-vault-text-dim">{token.use}</span></div>)}</div></div>
              <div className="surface-card"><p className="label">Inclusive defaults</p><ul className="mt-4 grid gap-3 text-sm leading-6 text-vault-text-dim">{['All actions remain usable with reduced motion.', 'Sound is optional, persisted, and duplicated visually.', 'Focus is visible and dialogs trap and restore focus.', 'Controls use 44px minimum targets.', 'State is expressed with text, shape, and color.', 'Readable mode raises microcopy to a usable floor.'].map((rule) => <li key={rule} className="flex gap-3"><span className="text-oxide-green">OK</span><span>{rule}</span></li>)}</ul></div>
            </div>
          </Specimen>

          <Specimen {...specimenProps('voice')} label="System" title="Voice, terminology, and trust" description="Player language is terse, concrete, and theatrical without hiding mechanics or inventing proof.">
            <div className="overflow-x-auto rounded border border-vault-border" role="region" aria-label="Voice guidelines" tabIndex={0}><table className="w-full min-w-[680px] text-left"><thead className="bg-vault-dark"><tr><th className="p-3 label">Rule</th><th className="p-3 label text-oxide-green">Use</th><th className="p-3 label text-signal-red">Avoid</th></tr></thead><tbody className="divide-y divide-vault-border">{VOICE_RULES.map((rule) => <tr key={rule.label}><td className="p-3 font-display text-lg uppercase text-vault-text">{rule.label}</td><td className="p-3 text-sm text-vault-text">{rule.good}</td><td className="p-3 text-sm text-vault-text-dim line-through decoration-signal-red/70">{rule.avoid}</td></tr>)}</tbody></table></div>
            <div className="mt-4 flex flex-wrap gap-2">{['Operation', 'Round', 'Vault', 'Player', 'Tool', 'Sabotage', 'Replay', 'Agent', 'Live table'].map((term) => <span key={term} className="rounded border border-vault-border bg-vault-dark/50 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-vault-text">{term}</span>)}</div>
          </Specimen>

          <Specimen {...specimenProps('assets')} label="System" title="Visual asset library" description="Generated atmosphere establishes the world; real interface states remain the product proof.">
            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Accepted assets" value={ART_PIPELINE_SUMMARY.accepted} tone="green" />
              <Metric label="Needs revision" value={ART_PIPELINE_SUMMARY.needsRevision} tone="red" />
              <Metric label="Reusable parts" value={ART_PIPELINE_SUMMARY.partsReady} tone="blue" />
              <Metric label="Asset families" value={ART_PIPELINE_SUMMARY.families} tone="amber" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{ASSET_LIBRARY.map((asset) => <article key={asset.id} className={`overflow-hidden rounded border bg-vault-dark/40 ${asset.status === 'needs-revision' ? 'border-signal-red/55' : 'border-vault-border'}`}><img src={asset.src} alt={asset.alt} className={`aspect-video w-full ${asset.family === 'transparent-part' ? 'bg-[#10131a] object-contain p-3' : 'object-cover'}`} loading="lazy" /><div className="p-3"><div className="flex items-start justify-between gap-3"><h3 className="font-display text-xl uppercase text-vault-text">{asset.label}</h3><span className="font-mono text-[9px] uppercase text-tungsten">{asset.kind}</span></div><p className="mt-1 text-sm text-vault-text-dim">{asset.role}</p><p className={`mt-2 font-mono text-xs uppercase tracking-[0.1em] ${asset.status === 'needs-revision' ? 'text-signal-red' : 'text-oxide-green'}`}>{asset.status === 'needs-revision' ? 'Needs visual revision' : `Joy target: ${asset.joy}`}</p>{asset.reviewNote && <p className="mt-2 text-sm leading-5 text-signal-red">{asset.reviewNote}</p>}<code className="mt-2 block text-[10px] text-blueprint">{asset.src}</code></div></article>)}</div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="surface-card">
                <p className="label">Family grammar</p>
                <div className="mt-3 grid gap-3">{ART_FAMILY_LIBRARY.map((family) => <div key={family.id} className="rounded border border-vault-border bg-vault-dark/35 p-3"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-display text-lg uppercase text-vault-text">{family.label}</h3><code className="text-xs text-blueprint">{family.id}</code></div><p className="mt-1 text-sm text-vault-text-dim">{family.role}</p><p className="mt-2 text-xs leading-5 text-vault-text-dim">{family.composition}</p></div>)}</div>
              </div>
              <div className="surface-card">
                <p className="label">Reusable part kit</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">{ART_PART_QUEUE.map((part) => <div key={part.id} className="rounded border border-blueprint/30 bg-blueprint/5 p-3"><h3 className="font-display text-lg uppercase text-vault-text">{part.label}</h3><p className="mt-1 text-sm text-vault-text-dim">{part.role}</p><p className="mt-2 font-mono text-xs uppercase tracking-[0.1em] text-oxide-green">{part.status === 'accepted' ? 'Accepted master' : 'Generation ready'} / Joy: {part.joy}</p><code className="mt-2 block break-all text-xs text-blueprint">{part.source}</code></div>)}</div>
              </div>
            </div>
            <RulePair good="Atmosphere frames the choice; screenshots and replays prove the product." avoid="Never present generated art as a real match capture or player story." />
          </Specimen>

          <Specimen {...specimenProps('coverage')} label="Governance" title="Experience coverage map" description="Use this table during reviews so improvements propagate across the whole product instead of one screen at a time.">
            <div className="overflow-x-auto rounded border border-vault-border" role="region" aria-label="Experience coverage" tabIndex={0}><table className="w-full min-w-[820px] text-left"><thead className="bg-vault-dark"><tr><th className="p-3 label">Surface</th><th className="p-3 label">Player job</th><th className="p-3 label">Priority</th><th className="p-3 label">Required patterns</th></tr></thead><tbody className="divide-y divide-vault-border">{EXPERIENCE_COVERAGE.map((row) => <tr key={row.surface}><td className="p-3 font-display text-lg uppercase text-vault-text">{row.surface}</td><td className="p-3 text-sm text-vault-text">{row.job}</td><td className="p-3"><span className="font-mono text-xs text-tungsten">{row.priority}</span></td><td className="p-3 text-sm text-vault-text-dim">{row.patterns}</td></tr>)}</tbody></table></div>
            <div className="mt-4 grid gap-3 md:grid-cols-3"><MiniRule title="Change rule" body="Update a shared primitive before patching a single screen." /><MiniRule title="Review rule" body="Check ready, hover, focus, disabled, loading, success, and error." /><MiniRule title="Release rule" body="Verify desktop, mobile, readable, and reduced-motion modes." /></div>
          </Specimen>
        </div>
      </div>
    </div>
  );
}

function ReviewToolbar({ counts, filter, setFilter, exportReview, importReview, resetReview }) {
  const reviewed = counts.approved + counts['needs-work'];
  const percent = Math.round((reviewed / DESIGN_SECTIONS.length) * 100);
  return (
    <section className="ds-review-bar" aria-label="Design review progress">
      <div className="min-w-[180px] flex-1"><div className="flex items-center justify-between gap-4"><span className="label">Review progress</span><span className="font-mono text-xs text-vault-text">{reviewed}/{DESIGN_SECTIONS.length} / {percent}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-vault-dark"><div className="h-full bg-tungsten transition-all" style={{ width: `${percent}%` }} /></div></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter design sections">{[['all', 'All'], ['needs-work', `Needs work ${counts['needs-work']}`], ['approved', `Approved ${counts.approved}`]].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? 'btn-primary' : 'btn-secondary'}>{label}</button>)}</div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-quiet" onClick={importReview}>Import</button>
        <button type="button" className="btn-quiet" onClick={exportReview}>Export</button>
        <button type="button" className="btn-quiet" onClick={resetReview}>Reset</button>
      </div>
    </section>
  );
}

function Specimen({
  id,
  title,
  label,
  description,
  status,
  filter,
  priority,
  note,
  onStatusChange,
  onPriorityChange,
  onNoteChange,
  children,
}) {
  if (filter !== 'all' && status !== filter) return null;
  return (
    <section id={id} className="ds-specimen scroll-mt-44" data-review-status={status}>
      <header className="mb-5 flex flex-col gap-4 border-b border-vault-border pb-4 lg:flex-row lg:items-start lg:justify-between"><div className="max-w-3xl"><p className="label">{label} / {id}</p><h2 className="mt-2 font-display text-3xl text-vault-text">{title}</h2><p className="mt-2 text-sm leading-6 text-vault-text-dim">{description}</p></div><div className="flex shrink-0 flex-wrap gap-2" role="group" aria-label={`${title} review status`}><button type="button" aria-pressed={status === 'approved'} onClick={() => onStatusChange('approved')} className={status === 'approved' ? 'ds-review-button ds-review-approved' : 'ds-review-button'}>Approve</button><button type="button" aria-pressed={status === 'needs-work'} onClick={() => onStatusChange('needs-work')} className={status === 'needs-work' ? 'ds-review-button ds-review-needs-work' : 'ds-review-button'}>Needs work</button></div></header>
      {children}
      <details className="ds-section-review mt-5 rounded border border-vault-border bg-vault-dark/40 p-3">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">
          Section critique {priority ? `/ ${priority}` : ''}{note ? ' / note saved' : ''}
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <label className="grid gap-2">
            <span className="field-label">Priority</span>
            <select className="control" value={priority} onChange={(event) => onPriorityChange(event.target.value)}>
              <option value="">Not set</option>
              <option value="P0">P0 - blocks play</option>
              <option value="P1">P1 - next pass</option>
              <option value="P2">P2 - polish</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="field-label">Critique and next action</span>
            <textarea className="control min-h-[88px] py-3" value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder={`What should change in ${title.toLowerCase()}?`} />
          </label>
        </div>
      </details>
    </section>
  );
}

function RulePair({ good, avoid }) {
  return <div className="mt-5 grid gap-3 md:grid-cols-2"><div className="rounded border border-oxide-green/30 bg-oxide-green/5 p-3 text-sm text-vault-text"><span className="mr-2 font-mono text-xs text-oxide-green">DO</span>{good}</div><div className="rounded border border-signal-red/30 bg-signal-red/5 p-3 text-sm text-vault-text"><span className="mr-2 font-mono text-xs text-signal-red">AVOID</span>{avoid}</div></div>;
}

function StateTile({ label, danger = false, children }) {
  return <div className={`relative overflow-hidden rounded border p-4 ${danger ? 'border-signal-red/30 bg-signal-red/5' : 'border-vault-border bg-vault-dark/40'}`}><p className="label">{label}</p><div className="mt-3">{children}</div></div>;
}

function Metric({ label, value, tone = 'amber' }) {
  const color = { amber: 'text-tungsten', blue: 'text-blueprint', green: 'text-oxide-green', red: 'text-signal-red' }[tone] || 'text-vault-text';
  return <div className="rounded border border-vault-border bg-vault-dark/40 p-3"><p className="label">{label}</p><p className={`mt-2 font-display text-3xl ${color}`}>{value}</p></div>;
}

function StateList({ title, items, prefix }) {
  return <div className="rounded border border-vault-border bg-vault-panel/55 p-3"><h3 className="font-display text-sm uppercase tracking-[0.14em] text-vault-text">{title}</h3><div className="mt-3 grid gap-2">{items.map((item) => <div key={item.id} className="rounded border border-vault-border bg-vault-dark/45 px-2.5 py-2"><p className="font-mono text-xs uppercase text-vault-text">{item.label}</p><p className="mt-1 break-all font-mono text-[10px] text-vault-text-dim">{prefix}="{item.id}"</p></div>)}</div></div>;
}

function JourneyCard({ step, title, tone = 'neutral', children }) {
  const border = { tungsten: 'border-tungsten/40', oxide: 'border-oxide-green/40', blueprint: 'border-blueprint/40', danger: 'border-signal-red/40', neutral: 'border-vault-border' }[tone];
  return <article className={`min-h-[240px] min-w-0 overflow-hidden rounded border bg-vault-surface/80 p-5 ${border}`}><p className="label">{step}</p><h3 className="mt-3 font-display text-3xl uppercase text-vault-text">{title}</h3><div className="mt-4 min-w-0 text-sm leading-6 text-vault-text-dim">{children}</div></article>;
}

function ProgressRow({ done = false, label }) {
  return <div className={`flex items-center gap-3 rounded border px-3 py-2 font-mono text-xs uppercase ${done ? 'border-oxide-green/30 bg-oxide-green/5 text-oxide-green' : 'border-vault-border text-vault-text-dim'}`}><span>{done ? 'DONE' : 'NEXT'}</span><span>{label}</span></div>;
}

function MiniRule({ title, body }) {
  return <div className="surface-card"><h3 className="font-display text-lg uppercase text-vault-text">{title}</h3><p className="mt-2 text-sm leading-5 text-vault-text-dim">{body}</p></div>;
}

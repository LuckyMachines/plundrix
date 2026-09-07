import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SignatureMoment from '../components/game/SignatureMoment';
import Seo from '../components/seo/Seo';
import GadgetVisual from '../components/workshop/GadgetVisual';
import { useAccessibility } from '../context/AccessibilityContext';
import { GADGET_CHASSIS_BY_ID, getGadgetById } from '../data/gadgetInventory';
import { trackProductEvent } from '../lib/analytics';
import { copyText } from '../lib/clipboard';
import { recordLocalBalanceSample } from '../lib/gadgetTelemetry';
import {
  getGadgetMastery,
  grantGadgetMasteryState,
  grantMatchSalvageState,
  readInventory,
  writeInventory,
} from '../lib/inventoryStore';
import { readChronicle, recordRivalryMatch, rivalTaunt, writeChronicle } from '../lib/playerChronicle';
import { SIM_ACTION, getPickChance, getSearchChance } from '../lib/plundrixEngine';
import {
  VAULT_ROUTES,
  VAULT_RUN_STAGES,
  applyVaultRound,
  buildVaultActionMap,
  createVaultRun,
  readVaultRun,
  startVaultStage,
  writeVaultRun,
} from '../lib/vaultRun';
import { loadWeeklyBoard, localWeeklyChallenge, submitWeeklyScore } from '../lib/weeklyChallenge';

const ACTIONS = [
  { id: SIM_ACTION.PICK, label: 'Pick', detail: 'Pressure the next lock.' },
  { id: SIM_ACTION.SEARCH, label: 'Search', detail: 'Find tools and improve later odds.' },
  { id: SIM_ACTION.SABOTAGE, label: 'Sabotage', detail: 'Stun a rival and steal when possible.' },
];

const BARGAINS = [
  { id: null, label: 'Play it straight', action: 'any', detail: 'No additional risk. Disturbingly respectable.' },
  { id: 'hotwire', label: 'Burn a tool', action: SIM_ACTION.PICK, detail: '+20 Pick odds. Spend one tool.' },
  { id: 'double-or-nothing', label: 'Double or nothing', action: SIM_ACTION.PICK, detail: '-18 Pick odds. Success cracks two locks.' },
  { id: 'deep-dive', label: 'Search too deep', action: SIM_ACTION.SEARCH, detail: '-15 Search odds. Success finds one extra tool.' },
];

function actionChance(match, action, bargain) {
  const player = match.players[0];
  const signature = player.gadgetReady ? GADGET_CHASSIS_BY_ID[player.gadget] : null;
  if (action === SIM_ACTION.PICK) {
    let gadgetBonus = 0;
    if (signature?.id === 'precision-kit') gadgetBonus = 10;
    if (signature?.id === 'torque-driver' && player.tools > 0) gadgetBonus = 18;
    if (signature?.id === 'quickset-clamp' && player.locksCracked === 0) gadgetBonus = 14;
    return Math.max(5, Math.min(match.rules.pickChanceCap, getPickChance(player, match.rules) + gadgetBonus + (bargain === 'hotwire' ? 20 : bargain === 'double-or-nothing' ? -18 : 0)));
  }
  if (action === SIM_ACTION.SEARCH) {
    let baseChance = getSearchChance(player, match.rules);
    let gadgetBonus = 0;
    if (signature?.id === 'signal-scanner') gadgetBonus = 20;
    if (signature?.id === 'echo-coil' && match.currentRound >= 3) gadgetBonus = 26;
    if (signature?.id === 'cache-siphon' && player.tools < match.rules.maxTools) gadgetBonus = 12;
    if (signature?.id === 'route-compass') { baseChance = match.rules.searchChance; gadgetBonus = 10; }
    return Math.max(5, Math.min(95, baseChance + gadgetBonus - (bargain === 'deep-dive' ? 15 : 0)));
  }
  return null;
}

export default function VaultRunPage() {
  const { reducedMotion, soundEnabled } = useAccessibility();
  const [inventory, setInventory] = useState(readInventory);
  const equipped = getGadgetById(inventory.equippedId);
  const chassis = GADGET_CHASSIS_BY_ID[equipped.chassisId];
  const [run, setRun] = useState(() => readVaultRun() || (new URLSearchParams(window.location.search).has('weekly') ? createVaultRun({ weekly: true, gadget: equipped.chassisId }) : null));
  const [chronicle, setChronicle] = useState(readChronicle);
  const [board, setBoard] = useState({ challenge: localWeeklyChallenge(), scores: [], durability: 'loading' });
  const [selectedAction, setSelectedAction] = useState(SIM_ACTION.PICK);
  const [target, setTarget] = useState('player-2');
  const [bargain, setBargain] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [notice, setNotice] = useState('');
  const [published, setPublished] = useState(false);
  const processedPaths = useRef(run?.path.length || 0);
  const timer = useRef(null);

  const stage = run ? VAULT_RUN_STAGES[run.stageIndex] : VAULT_RUN_STAGES[0];
  const match = run?.currentMatch;
  const player = match?.players?.[0];
  const lastRound = match?.roundHistory?.at(-1);
  const signatureEvent = useMemo(
    () => [...(lastRound?.events || [])].reverse().find((event) => event.type === 'GadgetActivated'),
    [lastRound],
  );
  const mastery = getGadgetMastery(inventory, equipped.chassisId);
  const availableBargains = BARGAINS.filter((item) => item.action === 'any' || item.action === selectedAction)
    .filter((item) => item.id !== 'hotwire' || (player?.tools || 0) > 0);

  useEffect(() => {
    loadWeeklyBoard().then(setBoard);
    return () => window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (run) writeVaultRun(run);
  }, [run]);

  useEffect(() => {
    if (!run || run.path.length <= processedPaths.current) return;
    processedPaths.current = run.path.length;
    const entry = run.path.at(-1);
    const stageMatch = run.currentMatch;
    let nextInventory = readInventory();
    const salvage = grantMatchSalvageState(nextInventory, {
      matchId: stageMatch.gameId,
      won: entry.won,
      rounds: entry.rounds,
      rewardMultiplier: entry.salvageMultiplier,
    });
    nextInventory = salvage.next;
    if (['COMPLETE', 'FAILED'].includes(run.status)) {
      nextInventory = grantGadgetMasteryState(nextInventory, {
        gadgetId: run.gadget,
        won: run.status === 'COMPLETE',
        activated: run.path.filter((item) => item.gadgetActivated).length,
        runCompleted: true,
      }).next;
    }
    nextInventory = writeInventory(nextInventory);
    setInventory(nextInventory);
    const nextChronicle = writeChronicle(recordRivalryMatch(readChronicle(), stageMatch));
    setChronicle(nextChronicle);
    recordLocalBalanceSample({
      gadgetId: run.gadget,
      activated: stageMatch.players[0].gadgetReady === false,
      won: entry.won,
      rounds: entry.rounds,
      mode: run.weekly ? 'weekly-vault' : 'vault-run',
      bargains: entry.bargainIds,
      bargainOutcomes: entry.bargainOutcomes,
    });
    setNotice(entry.won ? `Vault cleared. +${entry.score} score and salvage secured.` : 'The vault bit back. One life spent.');
    trackProductEvent('Vault Stage Completed', { stage: entry.stageId, result: entry.won ? 'win' : 'loss', weekly: run.weekly });
    trackProductEvent('Rivalry Updated', { rival: VAULT_RUN_STAGES.find((item) => item.id === entry.stageId)?.rival?.toLowerCase() || 'table', outcome: entry.won ? 'escaped' : 'bitten' });
    if (['COMPLETE', 'FAILED'].includes(run.status)) trackProductEvent('Vault Run Completed', { outcome: run.status.toLowerCase(), weekly: run.weekly, gadget: run.gadget });
  }, [run]);

  const beginRun = (weekly) => {
    const next = createVaultRun({ weekly, gadget: equipped.chassisId });
    setRun(next);
    setNotice(weekly ? 'Weekly seed loaded. Everyone gets the same trouble.' : 'Route table open. Choose your first bad idea.');
    setPublished(false);
    processedPaths.current = 0;
    trackProductEvent('Vault Run Started', { mode: 'vault-run', weekly, gadget: equipped.chassisId });
  };

  const chooseRoute = (routeId) => {
    setRun((current) => startVaultStage(current, routeId));
    setSelectedAction(SIM_ACTION.PICK);
    setBargain(null);
    setNotice('Route locked. The vault has opinions.');
    trackProductEvent('Vault Route Chosen', { stage: stage.id, bargain: routeId, weekly: run.weekly });
  };

  const resolve = () => {
    if (!run || resolving) return;
    const playerAction = { action: selectedAction, sabotageTarget: selectedAction === SIM_ACTION.SABOTAGE ? target : null, bargain };
    const actionMap = buildVaultActionMap(run, playerAction);
    setResolving(true);
    timer.current = window.setTimeout(() => {
      setRun((current) => applyVaultRound(current, actionMap));
      setResolving(false);
      setBargain(null);
      trackProductEvent('Vault Round Resolved', { stage: stage.id, action: ACTIONS.find((item) => item.id === selectedAction)?.label, bargain: bargain || 'none' });
    }, reducedMotion ? 0 : 520);
  };

  const share = async () => {
    const url = `${window.location.origin}/vault-run${run?.weekly ? '?weekly=1' : ''}`;
    const text = run?.status === 'COMPLETE' ? `I escaped all three Plundrix vaults with ${run.score} points.` : 'Three vaults. Two lives. One very questionable plan.';
    try {
      if (navigator.share) await navigator.share({ title: 'Plundrix Vault Run', text, url });
      else await copyText(`${text} ${url}`);
      setNotice('Challenge copied. Plausible deniability not included.');
    } catch (error) {
      if (error?.name !== 'AbortError') setNotice('The challenge refused to leave the building.');
    }
  };

  const publish = async () => {
    try {
      const result = await submitWeeklyScore({ challengeId: run.challengeId, runId: run.runId, alias: 'Operator', score: run.score, rounds: run.path.reduce((sum, item) => sum + item.rounds, 0), result: 'complete' });
      setBoard(result);
      setPublished(true);
      setNotice('Score posted to the weekly board. Rook is pretending not to care.');
    } catch {
      setNotice('The public board is offline; your run remains safe on this device.');
    }
  };

  if (!run) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
        <Seo title="Vault Run - Three Vault Roguelite | Plundrix" description="Take one gadget through three escalating Plundrix vaults with risky routes, persistent rivals, and a weekly seeded challenge." path="/vault-run" image="/images/victory-breach.webp" />
        <section className="relative min-h-[540px] overflow-hidden border border-tungsten/50 bg-vault-dark">
          <img src="/images/victory-breach.webp" alt="" width="1536" height="1024" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/90 to-vault-dark/20" />
          <div className="relative grid min-h-[540px] items-end gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_360px] lg:p-14">
            <div className="max-w-3xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-oxide-green">Persistent practice run</p>
              <h1 className="mt-4 font-display text-6xl font-bold uppercase leading-[0.82] text-vault-text sm:text-8xl">Three vaults.<br /><span className="text-tungsten">One bad idea.</span></h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-vault-text-dim">Carry one gadget through escalating tables. Choose a dubious route before each breach, survive with two lives, and leave your rivals with a story they deeply resent.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => beginRun(false)} className="min-h-[52px] bg-tungsten-bright px-6 font-mono text-xs font-bold uppercase tracking-[0.14em] text-vault-dark">Begin vault run</button>
                <button type="button" onClick={() => beginRun(true)} className="min-h-[52px] border border-oxide-green/60 bg-vault-dark/70 px-6 font-mono text-xs font-bold uppercase tracking-[0.14em] text-oxide-green">Enter weekly vault</button>
              </div>
            </div>
            <aside className="border border-vault-border bg-vault-dark/85 p-5 backdrop-blur">
              <GadgetVisual gadget={equipped} compact masteryLevel={mastery.level} />
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.18em] text-vault-text-dim">Equipped accomplice</p>
              <p className="mt-2 font-display text-2xl uppercase text-vault-text">{equipped.name}</p>
              <p className="mt-2 text-sm leading-6 text-vault-text-dim">{chassis.effect}</p>
              <p className="mt-4 border-t border-vault-border pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-oxide-green">Mastery {mastery.level} / {mastery.title}</p>
              <Link to="/workshop" className="mt-4 inline-flex min-h-[44px] items-center text-xs uppercase tracking-[0.12em] text-tungsten underline underline-offset-4">Change gadget</Link>
            </aside>
          </div>
        </section>
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {VAULT_RUN_STAGES.map((item) => <article key={item.id} className="border border-vault-border bg-vault-surface p-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-oxide-green">{item.eyebrow}</p><h2 className="mt-2 font-display text-3xl uppercase text-vault-text">{item.label}</h2><p className="mt-3 text-sm leading-6 text-vault-text-dim">{item.note}</p></article>)}
        </section>
      </div>
    );
  }

  if (run.status === 'COMPLETE' || run.status === 'FAILED') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Seo title="Vault Run Result | Plundrix" description="Review a completed Plundrix Vault Run." path="/vault-run" />
        <section className={`border p-6 sm:p-10 ${run.status === 'COMPLETE' ? 'border-oxide-green/60 bg-oxide-green/5' : 'border-signal-red/50 bg-signal-red/5'}`}>
          <p className="font-mono text-[10px] uppercase tracking-[.22em] text-tungsten">Run complete / {run.path.length} breaches recorded</p>
          <h1 className="mt-4 font-display text-6xl uppercase leading-none text-vault-text sm:text-8xl">{run.status === 'COMPLETE' ? 'Vaults emptied.' : 'Caught beautifully.'}</h1>
          <p className="mt-6 text-xl text-vault-text-dim">Final score <strong className="text-vault-text">{run.score.toLocaleString()}</strong>. {run.status === 'COMPLETE' ? 'The getaway cart is mostly on fire.' : 'The rivals will be unbearable about this.'}</p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">{run.path.map((entry, index) => <article key={`${entry.stageId}-${index}`} className="border border-vault-border bg-vault-dark/60 p-4"><p className="font-mono text-[9px] uppercase text-vault-text-dim">Attempt {index + 1}</p><p className="mt-2 font-display text-2xl uppercase text-vault-text">{VAULT_RUN_STAGES.find((item) => item.id === entry.stageId)?.label}</p><p className="mt-2 text-sm text-vault-text-dim">{entry.won ? 'Cleared' : 'Repelled'} / {entry.rounds} rounds / +{entry.score}</p></article>)}</div>
          {notice && <p className="mt-6 text-sm text-oxide-green" role="status">{notice}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => beginRun(false)} className="min-h-[48px] bg-tungsten-bright px-5 font-mono text-xs font-bold uppercase text-vault-dark">Run it again</button>
            {run.weekly && run.status === 'COMPLETE' && !published && <button type="button" onClick={publish} className="min-h-[48px] border border-oxide-green/60 px-5 font-mono text-xs font-bold uppercase text-oxide-green">Post weekly score</button>}
            <button type="button" onClick={share} className="min-h-[48px] border border-vault-border px-5 font-mono text-xs uppercase text-vault-text">Share the alibi</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Seo title={`${stage.label} - Vault Run | Plundrix`} description="Continue a three-stage Plundrix Vault Run." path="/vault-run" />
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-vault-border pb-6">
        <div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-oxide-green">{run.weekly ? board.challenge.title : 'Vault run'} / {stage.eyebrow}</p><h1 className="mt-2 font-display text-5xl uppercase leading-none text-vault-text sm:text-6xl">{stage.label}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-vault-text-dim">{stage.note}</p></div>
        <div className="flex gap-5 font-mono text-xs uppercase text-vault-text-dim"><span>Lives <strong className="text-vault-text">{'X'.repeat(run.lives) || '0'}</strong></span><span>Heat <strong className="text-signal-red">{run.heat}/5</strong></span><span>Score <strong className="text-tungsten">{run.score}</strong></span></div>
      </header>

      {run.status === 'ROUTE' ? (
        <main className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            {run.path.length > 0 && <div className="mb-5 border-l-2 border-oxide-green bg-oxide-green/10 p-4 text-sm text-vault-text">{notice}</div>}
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-tungsten">Choose your approach</p>
            <h2 className="mt-2 font-display text-4xl uppercase text-vault-text">Every route leaves fingerprints.</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {VAULT_ROUTES.map((route) => <button key={route.id} type="button" onClick={() => chooseRoute(route.id)} className="group min-h-[260px] border border-vault-border bg-vault-surface p-5 text-left transition hover:-translate-y-1 hover:border-tungsten/60 focus-visible:border-tungsten"><span className="font-mono text-[9px] uppercase tracking-[.18em] text-signal-red">{route.tone}</span><span className="mt-3 block font-display text-3xl uppercase text-vault-text">{route.label}</span><span className="mt-5 block text-sm leading-6 text-vault-text-dim">{route.trade}</span><span className="mt-7 block font-mono text-[10px] uppercase text-tungsten">Take this route -&gt;</span></button>)}
            </div>
          </section>
          <RivalSidebar chronicle={chronicle} board={board} run={run} />
        </main>
      ) : (
        <main className="mt-7 grid gap-6 xl:grid-cols-[1fr_330px]">
          <section className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{match.players.map((candidate) => <article key={candidate.id} className={`border p-4 ${candidate.id === 'player-1' ? 'border-tungsten/55 bg-tungsten/5' : candidate.stunned ? 'border-signal-red/45 bg-signal-red/5' : 'border-vault-border bg-vault-surface'}`}><div className="flex items-center justify-between"><p className="font-display text-xl uppercase text-vault-text">{candidate.name}</p><span className={`h-2 w-2 rounded-full ${candidate.stunned ? 'bg-signal-red' : 'bg-oxide-green'}`} /></div><p className="mt-3 font-mono text-[10px] uppercase text-vault-text-dim">Locks {candidate.locksCracked}/{match.rules.totalLocks} / Tools {candidate.tools}</p><div className="mt-3 flex gap-1">{Array.from({ length: match.rules.totalLocks }, (_, index) => <i key={index} className={`h-1.5 flex-1 ${index < candidate.locksCracked ? 'bg-tungsten' : 'bg-vault-border'}`} />)}</div></article>)}</div>
            <SignatureMoment event={signatureEvent} actorName={match.players.find((candidate) => candidate.id === signatureEvent?.actor)?.name} reducedMotion={reducedMotion} soundEnabled={soundEnabled} />
            {notice && <p className="border-l-2 border-oxide-green bg-oxide-green/10 p-3 text-sm text-vault-text" role="status">{notice}</p>}
            {lastRound && <div className="border border-vault-border bg-vault-dark/55 p-4"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-vault-text-dim">Last round</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{lastRound.events.filter((event) => event.type === 'ActionOutcome').map((event) => <p key={event.id} className={`text-sm ${event.success ? 'text-oxide-green' : 'text-vault-text-dim'}`}>{event.message}</p>)}</div></div>}
            <section className="border border-vault-border bg-vault-surface p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-tungsten">Round {match.currentRound}</p><h2 className="mt-2 font-display text-3xl uppercase text-vault-text">Choose the next offense.</h2></div>{actionChance(match, selectedAction, bargain) !== null && <strong className="font-display text-4xl text-tungsten">{actionChance(match, selectedAction, bargain)}%</strong>}</div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">{ACTIONS.map((action) => <button key={action.id} type="button" aria-pressed={selectedAction === action.id} onClick={() => { setSelectedAction(action.id); setBargain(null); }} className={`min-h-[94px] border p-4 text-left ${selectedAction === action.id ? 'border-tungsten bg-tungsten/10' : 'border-vault-border bg-vault-dark/40'}`}><span className="font-display text-2xl uppercase text-vault-text">{action.label}</span><span className="mt-2 block text-xs leading-5 text-vault-text-dim">{action.detail}</span></button>)}</div>
              {selectedAction === SIM_ACTION.SABOTAGE && <div className="mt-4 flex flex-wrap gap-2">{match.players.slice(1).map((candidate) => <button key={candidate.id} type="button" onClick={() => setTarget(candidate.id)} className={`min-h-[44px] border px-4 font-mono text-[10px] uppercase ${target === candidate.id ? 'border-signal-red bg-signal-red/10 text-signal-red' : 'border-vault-border text-vault-text-dim'}`}>{candidate.name} / {candidate.locksCracked} locks</button>)}</div>}
              {selectedAction !== SIM_ACTION.SABOTAGE && <div className="mt-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-signal-red">Optional round bargain</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{availableBargains.map((item) => <button key={item.id || 'straight'} type="button" aria-pressed={bargain === item.id} onClick={() => setBargain(item.id)} className={`min-h-[68px] border px-3 py-2 text-left ${bargain === item.id ? (item.id ? 'border-signal-red bg-signal-red/10' : 'border-tungsten bg-tungsten/10') : 'border-vault-border'}`}><span className="font-mono text-[10px] uppercase text-vault-text">{item.label}</span><span className="mt-1 block text-xs text-vault-text-dim">{item.detail}</span></button>)}</div></div>}
              <button type="button" disabled={resolving} onClick={resolve} className="mt-6 min-h-[54px] w-full bg-tungsten-bright px-6 font-mono text-xs font-bold uppercase tracking-[.16em] text-vault-dark disabled:opacity-50">{resolving ? 'The vault is considering it...' : `Commit ${ACTIONS.find((item) => item.id === selectedAction).label}`}</button>
            </section>
          </section>
          <RivalSidebar chronicle={chronicle} board={board} run={run} />
        </main>
      )}
    </div>
  );
}

function RivalSidebar({ chronicle, board, run }) {
  return (
    <aside className="space-y-4">
      <section className="border border-vault-border bg-vault-surface p-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-tungsten">Rival dossier</p><div className="mt-4 space-y-4">{Object.entries(chronicle.rivals).map(([name, record]) => <article key={name} className="border-t border-vault-border pt-3"><div className="flex justify-between"><p className="font-display text-xl uppercase text-vault-text">{name}</p><span className="font-mono text-[9px] text-signal-red" aria-label={`${record.grudge} of 5 grudge`}>{'X'.repeat(record.grudge)}{'-'.repeat(5 - record.grudge)}</span></div><p className="mt-1 font-mono text-[8px] uppercase text-vault-text-dim">Record {record.playerWins}-{record.rivalWins} / tools taken {record.toolsStolen}</p><p className="mt-2 text-xs italic leading-5 text-vault-text-dim">"{rivalTaunt(name, record)}"</p></article>)}</div></section>
      {run.weekly && <section className="border border-oxide-green/35 bg-oxide-green/5 p-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-oxide-green">{board.challenge.title}</p><p className="mt-2 text-xs leading-5 text-vault-text-dim">{board.challenge.modifier}: {board.challenge.note}</p><ol className="mt-4 space-y-2">{board.scores.slice(0, 5).map((score, index) => <li key={`${score.alias}-${index}`} className="flex justify-between border-t border-vault-border pt-2 font-mono text-[10px] uppercase text-vault-text"><span>{index + 1}. {score.alias}</span><span className="text-tungsten">{score.score}</span></li>)}</ol><p className="mt-4 font-mono text-[8px] uppercase tracking-[.12em] text-vault-text-dim">{board.durability === 'service-session-beta' ? 'Beta board / session durable' : 'Local preview board'}</p></section>}
    </aside>
  );
}

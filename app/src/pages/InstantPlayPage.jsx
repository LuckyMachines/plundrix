import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import SignatureMoment from '../components/game/SignatureMoment';
import DecisionPlate from '../components/gameplay/DecisionPlate';
import { CrewReadinessRail, MissionStatusPanel, OperationFile } from '../components/gameplay/HeistConsolePanels';
import VaultMechanism from '../components/gameplay/VaultMechanism';
import GadgetVisual from '../components/workshop/GadgetVisual';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  CRAFTING_MATERIALS,
  GADGET_CHASSIS_BY_ID,
  getGadgetById,
  getGadgetConfiguration,
} from '../data/gadgetInventory';
import { latencyBucket, trackProductEvent } from '../lib/analytics';
import { copyText } from '../lib/clipboard';
import { getGadgetMastery, grantGadgetMasteryState, grantMatchSalvageState, readInventory, writeInventory } from '../lib/inventoryStore';
import { recordLocalBalanceSample } from '../lib/gadgetTelemetry';
import { readChronicle, recordRivalryMatch, writeChronicle } from '../lib/playerChronicle';
import { INSTANT_PROFILE_KEY, markProfilePlayed, playerCohort, readLocalProfile } from '../lib/playerCareer';
import { buildReplayFromSimulation, saveReplayToLibrary } from '../lib/replayDirector';
import {
  SIM_ACTION,
  SIM_GADGETS,
  buildStrategyActionMap,
  createInitialSimulation,
  getPickChance,
  getSearchChance,
  getTablePressure,
  resolveSimulationRound,
} from '../lib/plundrixEngine';

const MODES = {
  blitz: {
    label: 'Blitz',
    description: 'A fast three-lock sprint for your first vault race.',
    rules: { totalLocks: 3, roundTimeoutSeconds: 45 },
  },
  classic: {
    label: 'Classic',
    description: 'The full five-lock vault race.',
    rules: { totalLocks: 5, roundTimeoutSeconds: 300 },
  },
  tactical: {
    label: 'Tactical',
    description: 'Five locks with one-use operator gadgets.',
    rules: { totalLocks: 5, roundTimeoutSeconds: 90 },
  },
};

const RIVALS = ['Rook', 'Mara', 'Vesper'];
const STRATEGIES = ['human', 'leader-hunter', 'tool-hoarder', 'saboteur'];
const PROFILE_KEY = INSTANT_PROFILE_KEY;
const MATCH_KEY = 'plundrix-instant-match-v1';
const ACTION_ART = {
  [SIM_ACTION.PICK]: '/images/parts/pick-tool.webp',
  [SIM_ACTION.SEARCH]: '/images/parts/search-kit.webp',
  [SIM_ACTION.SABOTAGE]: '/images/parts/sabotage-cable.webp',
};
const ACTION_LABELS = {
  [SIM_ACTION.PICK]: 'Pick',
  [SIM_ACTION.SEARCH]: 'Search',
  [SIM_ACTION.SABOTAGE]: 'Sabotage',
};

const RANKS = [
  [2000, 'Vault Legend'],
  [1000, 'Heist Architect'],
  [500, 'Lock Runner'],
  [0, 'Vault Rookie'],
];

function rankForXp(xp) {
  return RANKS.find(([threshold]) => xp >= threshold)?.[1] || 'Vault Rookie';
}

function playAudioCue(type) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const notes = type === 'win' ? [220, 330, 440, 660] : type === 'sabotage' ? [150, 95] : [180, 240];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type === 'sabotage' ? 'sawtooth' : 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + index * 0.08 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.08 + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + index * 0.08);
    oscillator.stop(context.currentTime + index * 0.08 + 0.2);
  });
  window.setTimeout(() => context.close(), 700);
}

const readProfile = readLocalProfile;

function readSavedMatch() {
  try {
    const saved = JSON.parse(localStorage.getItem(MATCH_KEY));
    if (
      saved?.version !== 1 ||
      saved?.state?.state !== 'ACTIVE' ||
      !Array.isArray(saved.state.players) ||
      !MODES[saved.mode]
    ) return null;
    return saved;
  } catch {
    return null;
  }
}

function createMatch({ mode, gadget, seed, name }) {
  const gadgets = mode === 'tactical'
    ? [gadget, 'firewall', 'signal-scanner', 'precision-kit']
    : [];
  return createInitialSimulation({
    scenarioId: 'human-vs-bots',
    playerCount: 4,
    seed,
    names: [name || 'Operator', ...RIVALS],
    strategies: STRATEGIES,
    gadgets,
    rules: {
      ...MODES[mode].rules,
      sabotageCooldownRounds: 1,
    },
  });
}

function actionPreview(state, action, target) {
  const player = state.players[0];
  const signature = player.gadgetReady ? GADGET_CHASSIS_BY_ID[player.gadget] : null;
  if (action === SIM_ACTION.PICK) {
    const pressure = getTablePressure(player, state, state.rules);
    let bonus = 0;
    if (signature?.id === 'precision-kit') bonus = 10;
    if (signature?.id === 'torque-driver' && player.tools > 0) bonus = 18;
    if (signature?.id === 'quickset-clamp' && player.locksCracked === 0) bonus = 14;
    const reward = pressure.locksOnSuccess > 1 ? 'two locks' : `lock ${player.locksCracked + 1}`;
    const pressureNote = pressure.pickBonus > 0 ? ` Table pressure adds ${pressure.pickBonus} points.` : '';
    return `${Math.min(95, getPickChance(player, state.rules, state) + bonus)}% chance to crack ${reward}.${pressureNote}`;
  }
  if (action === SIM_ACTION.SEARCH) {
    let baseChance = getSearchChance(player, state.rules);
    let bonus = 0;
    let reward = 'a tool';
    if (signature?.id === 'signal-scanner') bonus = 20;
    if (signature?.id === 'echo-coil' && state.currentRound >= 3) bonus = 26;
    if (signature?.id === 'cache-siphon' && player.tools < state.rules.maxTools) { bonus = 12; reward = 'up to two tools'; }
    if (signature?.id === 'route-compass') { baseChance = state.rules.searchChance; bonus = 10; }
    return `${Math.min(95, baseChance + bonus)}% chance to gain ${reward}; each tool adds 15% Pick odds.`;
  }
  const rival = state.players.find((candidate) => candidate.id === target);
  if (!rival) return 'Choose a rival to disrupt.';
  if (rival.lastSabotagedRound && state.currentRound - rival.lastSabotagedRound <= 1) {
    return `${rival.name} cannot be stunned this round because they were just targeted.`;
  }
  const rivalSignature = rival.gadgetReady ? GADGET_CHASSIS_BY_ID[rival.gadget] : null;
  if (rivalSignature?.protocol === 'firewall') {
    return `${rival.name}'s ${rivalSignature.label} will absorb this Sabotage.`;
  }
  return `Stun ${rival.name} for the next round${rival.tools ? ' and steal one tool' : ''}.`;
}

export default function InstantPlayPage() {
  const [params] = useSearchParams();
  const { reducedMotion, soundEnabled, setSoundEnabled } = useAccessibility();
  const [profile, setProfile] = useState(readProfile);
  const [restoredMatch] = useState(() => (params.has('seed') || params.has('target') ? null : readSavedMatch()));
  const [equippedBlueprint] = useState(() => getGadgetById(readInventory().equippedId));
  const [mode, setMode] = useState(() => restoredMatch?.mode || (MODES[params.get('mode')] ? params.get('mode') : 'blitz'));
  const [gadget, setGadget] = useState(() => {
    const requested = params.get('gadget');
    return restoredMatch?.gadget || (SIM_GADGETS.some((item) => item.id === requested) ? requested : equippedBlueprint.chassisId);
  });
  const [seed, setSeed] = useState(() => restoredMatch?.seed || params.get('seed') || `quick-${Date.now()}`);
  const [started, setStarted] = useState(Boolean(restoredMatch));
  const [state, setState] = useState(() => restoredMatch?.state || createMatch({ mode, gadget, seed, name: profile.name }));
  const [selectedAction, setSelectedAction] = useState(restoredMatch?.selectedAction || SIM_ACTION.PICK);
  const [target, setTarget] = useState(restoredMatch?.target || 'player-2');
  const [shareStatus, setShareStatus] = useState(restoredMatch ? 'Operation restored on this device.' : '');
  const [salvageReward, setSalvageReward] = useState(null);
  const [savedReplay, setSavedReplay] = useState(null);
  const [, setChronicle] = useState(readChronicle);
  const practiceBlueprint = useMemo(() => (
    gadget === equippedBlueprint.chassisId
      ? equippedBlueprint
      : getGadgetConfiguration(gadget, 'brassbound', 'steady')
  ), [equippedBlueprint, gadget]);
  const [isResolving, setIsResolving] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const recordedGame = useRef(null);
  const resolveTimer = useRef(null);
  const matchStartedAt = useRef(restoredMatch?.startedAt ? Date.parse(restoredMatch.startedAt) : null);
  const firstActionTracked = useRef(Boolean(restoredMatch?.state?.roundHistory?.length));

  const player = state.players[0];
  const leader = state.players.reduce((current, candidate) => (
    candidate.locksCracked > current.locksCracked ? candidate : current
  ), state.players[0]);
  const threatPercent = Math.min(96, 18 + ((state.currentRound - 1) * 9) + (leader.locksCracked * 15));
  const threatLabel = threatPercent >= 70 ? 'High' : threatPercent >= 38 ? 'Moderate' : 'Low';
  const operationObjectives = [
    { label: 'Collect intel', complete: player.tools > 0 },
    { label: 'Reach the vault', complete: player.locksCracked > 0 },
    { label: 'Extract safely', complete: false },
  ];
  const tablePressure = getTablePressure(player, state, state.rules);
  const winner = state.players.find((candidate) => candidate.id === state.winner);
  const preview = actionPreview(state, selectedAction, target);
  const lastRound = state.roundHistory.at(-1);
  const latestOutcomes = useMemo(
    () => (lastRound?.events || []).filter((event) => event.type === 'ActionOutcome'),
    [lastRound],
  );
  const latestSignature = useMemo(
    () => [...(lastRound?.events || [])].reverse().find((event) => event.type === 'GadgetActivated'),
    [lastRound],
  );
  const challengeTarget = Number(params.get('target')) || null;
  const rank = rankForXp(profile.xp);

  useEffect(() => () => window.clearTimeout(resolveTimer.current), []);

  useEffect(() => {
    if (!intelOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIntelOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [intelOpen]);

  useEffect(() => {
    if (!started || state.state !== 'ACTIVE') {
      localStorage.removeItem(MATCH_KEY);
      return;
    }
    localStorage.setItem(MATCH_KEY, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      mode,
      gadget,
      seed,
      startedAt: matchStartedAt.current ? new Date(matchStartedAt.current).toISOString() : null,
      state,
      selectedAction,
      target,
    }));
  }, [gadget, mode, seed, selectedAction, started, state, target]);

  useEffect(() => {
    if (state.state !== 'COMPLETE' || recordedGame.current === state.gameId) return;
    recordedGame.current = state.gameId;
    let nextInventory = readInventory();
    const actionMix = state.roundHistory.reduce((counts, round) => {
      const outcome = round.events.find((event) => event.type === 'ActionOutcome' && event.actor === 'player-1');
      if (outcome) counts[outcome.action] = (counts[outcome.action] || 0) + 1;
      return counts;
    }, {});
    const salvage = grantMatchSalvageState(nextInventory, {
      matchId: state.gameId,
      won: state.winner === 'player-1',
      rounds: state.currentRound,
      actionMix,
    });
    nextInventory = salvage.next;
    if (mode === 'tactical') {
      nextInventory = grantGadgetMasteryState(nextInventory, {
        gadgetId: gadget,
        won: state.winner === 'player-1',
        activated: state.players[0].gadgetReady === false,
      }).next;
    }
    writeInventory(nextInventory);
    if (salvage.awarded) {
      setSalvageReward(salvage.drops);
    }
    const nextChronicle = writeChronicle(recordRivalryMatch(readChronicle(), state));
    setChronicle(nextChronicle);
    const replay = buildReplayFromSimulation(state, {
      sourceType: 'player operation',
      strategies: STRATEGIES,
    });
    saveReplayToLibrary(replay);
    setSavedReplay(replay);
    trackProductEvent('Rivalry Updated', { rival: state.winner === 'player-1' ? 'table' : (winner?.name || 'rival').toLowerCase(), outcome: state.winner === 'player-1' ? 'escaped' : 'beaten' });
    recordLocalBalanceSample({
      gadgetId: mode === 'tactical' ? gadget : 'none',
      activated: mode === 'tactical' && state.players[0].gadgetReady === false,
      won: state.winner === 'player-1',
      rounds: state.currentRound,
      mode,
    });
    setProfile((current) => {
      const won = state.winner === 'player-1';
      const next = {
        ...current,
        games: current.games + 1,
        wins: current.wins + (won ? 1 : 0),
        xp: current.xp + (won ? 125 : 50),
        streak: won ? current.streak + 1 : 0,
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      return next;
    });
  }, [state]);

  const begin = (nextSeed = seed) => {
    const isRematch = started && state.state === 'COMPLETE';
    const playedAt = new Date().toISOString();
    const cohort = playerCohort(profile, playedAt);
    const activeProfile = markProfilePlayed(profile, playedAt);
    localStorage.removeItem(MATCH_KEY);
    setSavedReplay(null);
    setSeed(nextSeed);
    setState(createMatch({ mode, gadget, seed: nextSeed, name: profile.name }));
    setSelectedAction(SIM_ACTION.PICK);
    setStarted(true);
    setShareStatus('');
    setSalvageReward(null);
    matchStartedAt.current = Date.now();
    firstActionTracked.current = false;
    setProfile(activeProfile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(activeProfile));
    trackProductEvent(isRematch ? 'Instant Rematch Started' : 'Instant Match Started', { mode, cohort });
  };

  const abandon = () => {
    window.clearTimeout(resolveTimer.current);
    localStorage.removeItem(MATCH_KEY);
    setIsResolving(false);
    setStarted(false);
    setShareStatus('');
  };

  const resolve = (spectate = false) => {
    if (isResolving) return;
    if (!spectate && !firstActionTracked.current) {
      firstActionTracked.current = true;
      trackProductEvent('First Meaningful Action', {
        mode,
        action: selectedAction,
        cohort: playerCohort(profile),
        latency: matchStartedAt.current ? latencyBucket(Date.now() - matchStartedAt.current) : 'restored',
      });
    }
    const map = buildStrategyActionMap(state, STRATEGIES, {
      aggression: 60,
      searchGreed: 45,
      sabotageThreshold: 58,
      riskTolerance: 60,
    });
    if (!spectate) {
      map['player-1'] = {
        action: selectedAction,
        sabotageTarget: selectedAction === SIM_ACTION.SABOTAGE ? target : null,
      };
    }
    setIsResolving(true);
    if (soundEnabled) playAudioCue(selectedAction === SIM_ACTION.SABOTAGE ? 'sabotage' : 'resolve');
    resolveTimer.current = window.setTimeout(() => {
      const next = resolveSimulationRound(state, map);
      setState(next);
      setSelectedAction(SIM_ACTION.PICK);
      setIsResolving(false);
      trackProductEvent('Round Resolved', {
        mode,
        action: spectate ? 'auto' : selectedAction,
        roundBucket: next.currentRound <= 5 ? '1-5' : next.currentRound <= 10 ? '6-10' : '11+',
      });
      if (soundEnabled && next.winner) playAudioCue('win');
      if (next.winner) trackProductEvent('Instant Match Completed', { mode, result: next.winner === 'player-1' ? 'win' : 'loss' });
    }, reducedMotion ? 0 : 520);
  };

  const toggleAudio = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playAudioCue('resolve');
  };

  const share = async () => {
    const result = state.state === 'COMPLETE' ? `&target=${state.currentRound}` : '';
    const url = `${window.location.origin}/play?mode=${mode}&gadget=${gadget}&seed=${encodeURIComponent(seed)}${result}`;
    const challengeText = state.state === 'COMPLETE'
      ? `I finished this Plundrix vault in ${state.currentRound} rounds. Can you beat it?`
      : 'Can you beat this Plundrix vault setup?';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Challenge my Plundrix vault', text: challengeText, url });
      } else {
        await copyText(url);
      }
      setShareStatus(state.state === 'COMPLETE' ? `Challenge set: beat ${state.currentRound} rounds` : 'Challenge link ready');
      trackProductEvent('Challenge Shared', { mode, state: state.state.toLowerCase() });
    } catch (error) {
      if (error?.name !== 'AbortError') setShareStatus(error?.message || 'Challenge link could not be shared.');
    }
  };

  if (!started) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Seo
          title="Play Plundrix Instantly - No Wallet Required"
          description="Start a fast Plundrix vault race against three labeled tactical agents. Choose Pick, Search, or Sabotage with no signup or wallet."
          path="/play"
          image="/images/og/plundrix-play.jpg"
          imageAlt="Plundrix instant play - Your table is ready. No wallet required."
        />
        <section className="instant-setup-shell overflow-hidden border border-vault-border bg-vault-surface lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="instant-setup-copy p-6 sm:p-9 lg:p-12">
            <p className="font-mono text-micro uppercase tracking-beacon text-oxide-green">Instant operation</p>
            <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-display text-vault-text sm:text-7xl">Your table is ready.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-vault-text-dim">Play immediately against three distinct agents. Learn the pressure loop here, then take the same instincts onchain.</p>

            {challengeTarget && (
              <div className="mt-6 border-l-2 border-oxide-green bg-oxide-green/10 px-4 py-3 text-sm text-vault-text" role="status">
                Challenge received: breach this vault in fewer than {challengeTarget} rounds.
              </div>
            )}

            <div className="instant-mode-grid mt-8 grid gap-3 sm:grid-cols-3">
              {Object.entries(MODES).map(([id, item]) => (
                <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className={`instant-mode-card min-h-[104px] border p-4 text-left sm:min-h-[132px] ${mode === id ? 'border-tungsten bg-tungsten/10' : 'border-vault-border bg-vault-dark/35'}`}>
                  <span className="font-display text-2xl uppercase text-vault-text">{item.label}</span>
                  <span className="mt-3 block text-sm leading-5 text-vault-text-dim">{item.description}</span>
                </button>
              ))}
            </div>

            <button type="button" onClick={() => begin()} className="mt-5 inline-flex min-h-[54px] w-full items-center justify-center bg-tungsten-bright px-7 font-mono text-xs font-semibold uppercase tracking-label text-vault-dark sm:hidden">Breach the vault -&gt;</button>

            {mode === 'tactical' && (
              <div className="mt-6 border border-tungsten/35 bg-tungsten/5 p-3">
                <div className="grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-3">
                  <GadgetVisual gadget={practiceBlueprint} compact className="min-h-20" />
                  <div className="min-w-0">
                    <p className="font-mono text-micro uppercase tracking-label text-tungsten">Workshop loadout / {practiceBlueprint.protocolFamilyLabel}</p>
                    <p className="mt-1 truncate font-display text-xl uppercase text-vault-text">{practiceBlueprint.name}</p>
                    <p className="mt-1 text-xs leading-5 text-vault-text-dim"><strong className="text-vault-text">{practiceBlueprint.effectName}:</strong> {practiceBlueprint.protocolLabel}</p>
                  </div>
                  <Link to="/workshop" className="hidden min-h-[44px] items-center border border-vault-border px-3 font-mono text-micro uppercase text-vault-text-dim sm:inline-flex">Change build</Link>
                </div>
                <p className="mt-3 border-t border-vault-border pt-3 font-mono text-micro uppercase tracking-interface text-oxide-green">One build, one visible signature, one use per operation.</p>
              </div>
            )}

            <button type="button" onClick={() => begin()} className="mt-6 hidden min-h-[54px] items-center justify-center bg-tungsten-bright px-7 font-mono text-xs font-semibold uppercase tracking-label text-vault-dark sm:inline-flex">Breach the vault -&gt;</button>

            <p className="mt-6 max-w-xl text-sm leading-6 text-vault-text-dim">
              Tools add 15 points to future Pick odds, up to 95%. Falling behind adds 6 points per lock, up to 18. A deep gap - or any gap after the leader reaches three locks - turns a successful Pick into a double breach. Sabotage cannot chain-stun the same rival.
            </p>
            <details className="mt-4 max-w-xl rounded border border-vault-border bg-vault-dark/35 p-3">
              <summary className="cursor-pointer font-mono text-xs uppercase tracking-interface text-vault-text-dim">
                Practice and live rules
              </summary>
              <p className="mt-3 text-sm leading-6 text-vault-text-dim">
                Instant Play is a local practice ruleset. Pick, Search, Sabotage, tools, and simultaneous
                reveals match the live game's core loop; gadgets and anti-chain-stun protection are practice
                features. Table pressure is included in the next audited Sepolia contract release and may differ until that upgrade is deployed.
              </p>
            </details>
          </div>

          <aside className="relative min-h-[420px] border-t border-vault-border lg:border-l lg:border-t-0">
            <img src="/images/plundrix-instant-breach.webp" alt="" width="1024" height="1024" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-vault-dark via-vault-dark/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Operator record</p>
              <div className="mt-3 grid grid-cols-3 gap-px bg-vault-border">
                <Stat label="Games" value={profile.games} />
                <Stat label="Wins" value={profile.wins} />
                <Stat label="Level" value={Math.floor(profile.xp / 500) + 1} />
              </div>
            </div>
          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className="caper-operation caper-workbench instant-play-active mx-auto max-w-7xl px-4 py-6 sm:px-6" data-match-state={state.state.toLowerCase()}>
      <Seo
        title={`${MODES[mode].label} Operation - Plundrix`}
        description="Play a fast tactical Plundrix vault race against three labeled agents."
        path="/play"
        image="/images/og/plundrix-play.jpg"
        imageAlt="Plundrix instant play - Your table is ready. No wallet required."
      />
      {state.state === 'ACTIVE' && (
        <div className="instant-mobile-command" role="region" aria-label="Selected action command">
          <a href="#instant-actions" className="instant-mobile-command__selection">
            <span>Selected action</span>
            <strong>{ACTION_LABELS[selectedAction]} / change</strong>
          </a>
          <button
            type="button"
            disabled={isResolving}
            onClick={() => resolve(false)}
            aria-label={`Commit ${ACTION_LABELS[selectedAction]}`}
            className="instant-mobile-command__commit"
          >
            {isResolving ? 'Revealing...' : `Commit ${ACTION_LABELS[selectedAction]}`}
          </button>
          <button
            type="button"
            disabled={isResolving}
            onClick={() => resolve(true)}
            title="The game chooses a recommended move for you this round."
            aria-label="Auto-play this round"
            className="instant-mobile-command__auto"
          >
            Auto
          </button>
        </div>
      )}
      <div className="instant-operation-layout grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="instant-primary-column min-w-0 space-y-5">
          {state.state === 'ACTIVE' && latestOutcomes.length > 0 && <ResolutionSummary outcomes={latestOutcomes} />}

          {state.state === 'ACTIVE' && (
          <section className={`instant-round-board instant-heist-console caper-layer ${isResolving ? 'instant-resolving' : ''}`} aria-live="polite">
            <header className="instant-round-header flex flex-wrap items-center justify-between gap-3 border-b border-vault-border px-5 py-4">
              <div>
                <p className="font-mono text-micro uppercase tracking-brand text-oxide-green">Active operation / R{state.currentRound} / {state.rules.totalLocks - player.locksCracked} locks / {threatPercent}% heat</p>
                <p className="mt-1 font-display text-2xl uppercase text-vault-text">Nightfall vault</p>
              </div>
              <dl className="instant-operation-metrics" aria-label="Live operation status">
                <div><dt>Operator</dt><dd>{profile.name}</dd></div>
                <div><dt>Clearance</dt><dd>{rank}</dd></div>
                <div><dt>Tools</dt><dd>{player.tools}/{state.rules.maxTools}</dd></div>
              </dl>
              <div className="instant-round-controls flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setIntelOpen(true)} aria-expanded={intelOpen} aria-controls="instant-intel-rail" className="instant-intel-toggle min-h-[44px] border border-blueprint/45 px-3 font-mono text-xs uppercase text-blueprint">Intel</button>
                <button type="button" onClick={toggleAudio} aria-pressed={soundEnabled} className="min-h-[44px] border border-vault-border px-3 font-mono text-xs uppercase text-vault-text-dim">{soundEnabled ? 'Sound on' : 'Sound off'}</button>
                <button type="button" onClick={share} className="min-h-[44px] border border-tungsten/45 px-3 font-mono text-micro uppercase text-tungsten"><span className="sm:hidden">Share</span><span className="hidden sm:inline">Share challenge</span></button>
                <button type="button" onClick={abandon} className="min-h-[44px] border border-vault-border px-3 font-mono text-xs uppercase text-vault-text-dim"><span className="sm:hidden">Exit</span><span className="hidden sm:inline">Exit match</span></button>
              </div>
            </header>
            {shareStatus && <p className="border-b border-vault-border bg-oxide-green/5 px-5 py-2 font-mono text-xs text-oxide-green" role="status">{shareStatus}</p>}

            <div className="instant-heist-grid">
              <div className="instant-heist-left">
                <MissionStatusPanel
                  round={state.currentRound}
                  modeLabel={MODES[mode].label}
                  objectives={operationObjectives}
                  threatPercent={threatPercent}
                  threatLabel={threatLabel}
                />
                <CrewReadinessRail players={state.players} totalLocks={state.rules.totalLocks} />
              </div>

              <div className="instant-vault-column">
                <VaultMechanism
                  cracked={player.locksCracked}
                  total={state.rules.totalLocks}
                  resolving={isResolving}
                  selectedAction={ACTION_LABELS[selectedAction].toLowerCase()}
                  label="Nightfall vault / live route"
                />
                <section className="instant-tool-rack" aria-label="Tools and gadgets">
                  <div className="instant-tool-rack__heading"><span>Tools &amp; gadgets</span><strong>{player.tools} carried</strong></div>
                  <div className="instant-tool-rack__items">
                    <span data-active={player.gadgetReady} title={`Equipped gadget: ${practiceBlueprint.name}`}>
                      <img src={practiceBlueprint.image} alt="" width="96" height="96" />
                    </span>
                    {Array.from({ length: 4 }, (_, index) => (
                      index < player.tools
                        ? <span key={index} data-active="true" title="Carried lock tool"><img src="/images/parts/lock-module.webp" alt="" width="96" height="96" /></span>
                        : <span key={index} className="instant-tool-rack__empty" data-slot={`0${index + 1}`} role="img" aria-label={`Empty tool slot ${index + 1}`} />
                    ))}
                  </div>
                </section>
              </div>

              <OperationFile
                player={player}
                leader={leader}
                totalLocks={state.rules.totalLocks}
                selectedActionLabel={ACTION_LABELS[selectedAction]}
                materials={CRAFTING_MATERIALS}
                round={state.currentRound}
              />
            </div>

            {latestSignature && <div className="border-b border-vault-border p-4"><SignatureMoment event={latestSignature} actorName={state.players.find((candidate) => candidate.id === latestSignature.actor)?.name} reducedMotion={reducedMotion} soundEnabled={soundEnabled} /></div>}
          </section>
          )}

          {state.state === 'ACTIVE' ? (
            <section id="instant-actions" className="instant-decision-board caper-layer caper-layer-control p-5 sm:p-7" aria-labelledby="instant-actions-heading">
              <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Choose one concealed action</p>
              <h2 id="instant-actions-heading" className="instant-decision-heading">Make the next move.</h2>
              {state.roundHistory.length === 0 && (
                <p className="instant-first-move mt-3 border-l-2 border-oxide-green bg-oxide-green/10 px-4 py-3 text-sm leading-6 text-vault-text">
                  Pick races now. Search improves future Pick odds. Sabotage costs a rival their next turn. Everyone reveals together.
                </p>
              )}
              <div className="instant-action-row">
                <div className="instant-action-options mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    [SIM_ACTION.PICK, 'Pick', `${getPickChance(player, state.rules, state)}% / ${tablePressure.locksOnSuccess} ${tablePressure.locksOnSuccess === 1 ? 'lock' : 'locks'}`, tablePressure.pickBonus ? `Table pressure adds ${tablePressure.pickBonus} points.` : 'Attack the next lock.'],
                    [SIM_ACTION.SEARCH, 'Search', `${getSearchChance(player, state.rules)}% base`, 'Build future Pick odds.'],
                    [SIM_ACTION.SABOTAGE, 'Sabotage', 'One-round stun', 'Stop a rival and steal one tool when available.'],
                  ].map(([id, label, metric, detail], index) => (
                    <DecisionPlate
                      key={id}
                      action={id}
                      identity={label.toLowerCase()}
                      label={label}
                      metric={metric}
                      detail={detail}
                      image={ACTION_ART[id]}
                      index={index}
                      selected={selectedAction === id}
                      committed={isResolving && selectedAction === id}
                      disabled={isResolving}
                      onSelect={() => setSelectedAction(id)}
                    />
                  ))}
                </div>

                <div className="instant-action-commit">
                  <button type="button" disabled={isResolving} onClick={() => resolve(false)} aria-label="Commit and reveal" className="min-h-[52px] flex-1 bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-label text-vault-dark disabled:cursor-wait disabled:opacity-60">{isResolving ? 'Revealing...' : 'Confirm move'}</button>
                  <button type="button" disabled={isResolving} onClick={() => resolve(true)} title="The game chooses a recommended move for you this round." aria-label="Auto-play this round" className="min-h-[52px] border border-vault-border px-4 font-mono text-xs uppercase tracking-label text-vault-text-dim disabled:opacity-50"><span className="hidden sm:inline">Auto-play this round</span><span className="sm:hidden">Auto</span></button>
                </div>
              </div>

              {selectedAction === SIM_ACTION.SABOTAGE && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {state.players.slice(1).map((candidate) => (
                    <button key={candidate.id} type="button" onClick={() => setTarget(candidate.id)} className={`min-h-[44px] border px-4 font-mono text-xs uppercase ${target === candidate.id ? 'border-signal-red bg-signal-red/10 text-signal-red' : 'border-vault-border text-vault-text'}`}>{candidate.name} / {candidate.locksCracked} locks</button>
                  ))}
                </div>
              )}

              <div className="mt-5 border-l-2 border-tungsten bg-vault-dark/50 p-4" aria-live="polite">
                <p className="font-mono text-micro uppercase tracking-label text-tungsten">Tactical preview</p>
                <p className="mt-2 text-sm leading-6 text-vault-text">{preview}</p>
              </div>
            </section>
          ) : (
            <section className="instant-complete relative overflow-hidden border border-tungsten/45 bg-vault-dark px-7 py-10 text-left sm:px-10">
              <img src="/images/victory-breach.webp" alt="" width="1024" height="420" className="absolute inset-0 h-full w-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/90 to-vault-dark/20" />
              <div className="relative z-10 max-w-2xl">
                <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Final briefing</p>
                <h2 className="mt-3 font-display text-5xl uppercase leading-display text-vault-text">{winner?.name} breached the vault</h2>
                <p className="mt-4 max-w-xl leading-6 text-vault-text-dim">Completed in {state.currentRound} rounds. {state.winner === 'player-1' ? `You earned 125 XP and defended your ${rank} rank.` : `${winner?.name} stole the final opening. You earned 50 XP and new intel for the rematch.`}</p>
                <p className="mt-3 font-mono text-micro uppercase tracking-label text-signal-red">Rivalry chronicle updated. They will remember this.</p>
                {salvageReward?.length > 0 && <div className="mt-5 border border-oxide-green/45 bg-oxide-green/10 p-4"><p className="font-mono text-micro uppercase tracking-label text-oxide-green">Workshop salvage recovered</p><div className="mt-3 flex flex-wrap gap-2">{salvageReward.map(({ materialId, amount, reason }) => { const material = CRAFTING_MATERIALS.find((item) => item.id === materialId); return <span key={materialId} title={reason} className="inline-flex items-center gap-2 border border-vault-border bg-vault-dark/70 px-3 py-2 font-mono text-xs uppercase text-vault-text"><img src={material?.image} alt="" className="h-7 w-7 object-contain" />+{amount} {material?.label}</span>; })}</div><p className="mt-3 text-xs text-vault-text-dim">{salvageReward[0]?.reason} Choose actions and Vault Run routes to pursue different materials.</p></div>}
                {challengeTarget && <p className={`mt-3 font-mono text-xs uppercase tracking-label ${state.currentRound < challengeTarget && state.winner === 'player-1' ? 'text-oxide-green' : 'text-tungsten'}`}>{state.currentRound < challengeTarget && state.winner === 'player-1' ? `Challenge beaten by ${challengeTarget - state.currentRound} rounds` : `Challenge target: under ${challengeTarget} rounds`}</p>}
              </div>
              <div className="relative z-10 mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={() => begin(`rematch-${Date.now()}`)} className="min-h-[50px] bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase text-vault-dark">Instant rematch</button>
                {savedReplay && <Link to={`/replay/${savedReplay.id}`} onClick={() => trackProductEvent('Post Match Continued', { destination: 'own-replay' })} className="inline-flex min-h-[50px] items-center border border-oxide-green/45 px-5 font-mono text-xs uppercase text-oxide-green">Replay this operation</Link>}
                <details className="min-w-[180px] border border-vault-border bg-vault-dark/70">
                  <summary className="grid min-h-[50px] cursor-pointer place-items-center px-5 font-mono text-xs uppercase text-vault-text">More options</summary>
                  <div className="grid gap-1 border-t border-vault-border p-2">
                    <button type="button" onClick={share} className="min-h-[44px] px-3 text-left font-mono text-xs uppercase text-tungsten">Share score challenge</button>
                    <Link to="/career" onClick={() => trackProductEvent('Post Match Continued', { destination: 'career' })} className="inline-flex min-h-[44px] items-center px-3 font-mono text-xs uppercase text-vault-text">View career</Link>
                    <Link to="/replays" onClick={() => trackProductEvent('Post Match Continued', { destination: 'replay-gallery' })} className="inline-flex min-h-[44px] items-center px-3 font-mono text-xs uppercase text-vault-text">Watch replays</Link>
                    <Link to="/workshop" onClick={() => trackProductEvent('Post Match Continued', { destination: 'workshop' })} className="inline-flex min-h-[44px] items-center px-3 font-mono text-xs uppercase text-oxide-green">Visit workshop</Link>
                  </div>
                </details>
              </div>
            </section>
          )}

        </div>

        {intelOpen && <button type="button" className="instant-intel-backdrop" aria-label="Close table intel" onClick={() => setIntelOpen(false)} />}
        <aside id="instant-intel-rail" className={`instant-intel-rail min-w-0 space-y-4 ${intelOpen ? 'is-open' : ''}`} aria-label="Table intel">
          <div className="instant-intel-drawer-header">
            <p className="font-mono text-xs uppercase tracking-label text-tungsten">Table intel</p>
            <button type="button" onClick={() => setIntelOpen(false)} className="instant-intel-close min-h-[44px] border border-vault-border px-3 font-mono text-xs uppercase text-vault-text">Close</button>
          </div>
          {state.state === 'ACTIVE' && state.roundHistory.length > 1 && <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-micro uppercase tracking-brand text-oxide-green">First-operation guide</p>
            <ol className="mt-4 space-y-3">
              {[
                ['Choose', state.roundHistory.length > 0, 'Read the odds and commit one move.'],
                ['Resolve', state.roundHistory.length > 0, 'Every operator reveals together.'],
                ['Counter', state.roundHistory.length > 1, 'React to tools, stuns, and leaders.'],
                ['Breach', state.state === 'COMPLETE', 'Crack the final lock first.'],
              ].map(([label, done, detail], index) => (
                <li key={label} className="flex gap-3">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center border font-mono text-micro ${done ? 'border-oxide-green bg-oxide-green/10 text-oxide-green' : 'border-vault-border text-vault-text-dim'}`}>{done ? 'OK' : index + 1}</span>
                  <div><p className="font-display uppercase text-vault-text">{label}</p><p className="mt-1 text-xs leading-5 text-vault-text-dim">{detail}</p></div>
                </li>
              ))}
            </ol>
          </section>}

          {state.state === 'ACTIVE' && (
          <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Current plan</p>
            <p className="mt-2 font-display text-2xl uppercase text-vault-text">{selectedAction}</p>
            <p className="mt-3 text-sm leading-6 text-vault-text-dim">{preview}</p>
            <p className="mt-4 border-t border-vault-border pt-3 font-mono text-xs text-oxide-green">Progress saves automatically on this device.</p>
          </section>
          )}

          {mode === 'tactical' && <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Workshop loadout</p>
            <div className="mt-3 grid grid-cols-[78px_minmax(0,1fr)] items-center gap-3"><GadgetVisual gadget={practiceBlueprint} compact masteryLevel={getGadgetMastery(readInventory(), gadget).level} /><div><p className="font-display text-xl uppercase text-vault-text">{practiceBlueprint.name}</p><p className="mt-1 text-xs leading-5 text-vault-text-dim">{practiceBlueprint.effectName} / {practiceBlueprint.protocolLabel}</p></div></div>
          </section>}

          {state.state === 'COMPLETE' && <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Season identity</p>
            <p className="mt-2 font-display text-2xl uppercase text-tungsten-bright">{rank}</p>
            <label className="mt-4 grid gap-2">
              <span className="font-mono text-micro uppercase text-vault-text-dim">Operator name</span>
              <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value.slice(0, 20) }))} onBlur={() => localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))} className="min-h-[44px] border border-vault-border bg-vault-dark px-3 text-vault-text" />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="XP" value={profile.xp} />
              <Stat label="Streak" value={profile.streak} />
              <Stat label="Wins" value={profile.wins} />
              <Stat label="Games" value={profile.games} />
            </div>
            <div className="mt-3 h-2 bg-vault-dark"><div className="h-2 bg-oxide-green" style={{ width: `${(profile.xp % 500) / 5}%` }} /></div>
            <p className="mt-2 font-mono text-micro uppercase text-vault-text-dim">Level {Math.floor(profile.xp / 500) + 1} / next rank in {500 - (profile.xp % 500)} XP</p>
          </section>}

          {state.state === 'COMPLETE' && <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Next operation</p>
            <div className="mt-3 grid gap-2">
              <Link to="/#live-operations" className="min-h-[44px] border border-tungsten/45 px-3 py-3 font-mono text-micro uppercase text-tungsten">Take it onchain</Link>
              <Link to="/trailer" className="min-h-[44px] border border-vault-border px-3 py-3 font-mono text-micro uppercase text-vault-text">Watch gameplay trailer</Link>
              <Link to="/sessions" className="min-h-[44px] border border-vault-border px-3 py-3 font-mono text-micro uppercase text-vault-text">Spectate live sessions</Link>
            </div>
          </section>}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-vault-dark/75 p-3">
      <p className="font-mono text-micro uppercase tracking-label text-vault-text-dim">{label}</p>
      <p className="mt-1 font-display text-2xl text-vault-text">{value}</p>
    </div>
  );
}

function ResolutionSummary({ outcomes }) {
  const playerOutcome = outcomes.find((event) => event.actor === 'player-1') || outcomes[0];
  const successful = Boolean(playerOutcome?.success);
  return (
    <section className={`instant-resolution-summary border-l-2 p-4 ${successful ? 'border-oxide-green bg-oxide-green/10' : 'border-signal-red bg-signal-red/5'}`} aria-labelledby="instant-resolution-heading">
      <p className="font-mono text-micro uppercase tracking-brand text-vault-text-dim">Last resolution</p>
      <h2 id="instant-resolution-heading" className="mt-2 font-display text-3xl uppercase text-vault-text">{successful ? 'Your move landed.' : 'The vault held.'}</h2>
      <p className={`mt-1 text-sm ${successful ? 'text-oxide-green' : 'text-signal-red'}`}>{playerOutcome?.message}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {outcomes.filter((event) => event !== playerOutcome).map((event) => <p key={event.id} className="border-t border-vault-border pt-2 text-xs text-vault-text-dim">{event.message}</p>)}
      </div>
    </section>
  );
}

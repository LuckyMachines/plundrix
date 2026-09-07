import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import SignatureMoment from '../components/game/SignatureMoment';
import GadgetVisual from '../components/workshop/GadgetVisual';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  CRAFTING_MATERIALS,
  GADGET_CHASSIS_BY_ID,
  getGadgetById,
  getGadgetConfiguration,
} from '../data/gadgetInventory';
import { trackProductEvent } from '../lib/analytics';
import { copyText } from '../lib/clipboard';
import { getGadgetMastery, grantGadgetMasteryState, grantMatchSalvageState, readInventory, writeInventory } from '../lib/inventoryStore';
import { recordLocalBalanceSample } from '../lib/gadgetTelemetry';
import { readChronicle, recordRivalryMatch, rivalTaunt, writeChronicle } from '../lib/playerChronicle';
import {
  SIM_ACTION,
  SIM_GADGETS,
  buildStrategyActionMap,
  createInitialSimulation,
  getPickChance,
  getSearchChance,
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
const PROFILE_KEY = 'plundrix-instant-profile-v1';
const MATCH_KEY = 'plundrix-instant-match-v1';
const RIVAL_PERSONAS = {
  Rook: 'The closer - attacks the vault whenever the odds turn favorable.',
  Mara: 'The scavenger - stockpiles tools before making a decisive run.',
  Vesper: 'The disruptor - hunts leaders and turns their plans against them.',
};
const RIVAL_ART = {
  Rook: '/images/parts/rook-device.webp',
  Mara: '/images/parts/mara-device.webp',
  Vesper: '/images/parts/vesper-device.webp',
};
const ACTION_ART = {
  [SIM_ACTION.PICK]: '/images/parts/pick-tool.webp',
  [SIM_ACTION.SEARCH]: '/images/parts/search-kit.webp',
  [SIM_ACTION.SABOTAGE]: '/images/parts/sabotage-cable.webp',
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

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || { name: 'Operator', games: 0, wins: 0, xp: 0, streak: 0 };
  } catch {
    return { name: 'Operator', games: 0, wins: 0, xp: 0, streak: 0 };
  }
}

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
    let bonus = 0;
    if (signature?.id === 'precision-kit') bonus = 10;
    if (signature?.id === 'torque-driver' && player.tools > 0) bonus = 18;
    if (signature?.id === 'quickset-clamp' && player.locksCracked === 0) bonus = 14;
    return `${Math.min(95, getPickChance(player, state.rules) + bonus)}% chance to crack lock ${player.locksCracked + 1}.`;
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
  const [chronicle, setChronicle] = useState(readChronicle);
  const practiceBlueprint = useMemo(() => (
    gadget === equippedBlueprint.chassisId
      ? equippedBlueprint
      : getGadgetConfiguration(gadget, 'brassbound', 'steady')
  ), [equippedBlueprint, gadget]);
  const [isResolving, setIsResolving] = useState(false);
  const recordedGame = useRef(null);
  const resolveTimer = useRef(null);

  const player = state.players[0];
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
      state,
      selectedAction,
      target,
    }));
  }, [gadget, mode, seed, selectedAction, started, state, target]);

  useEffect(() => {
    if (state.state !== 'COMPLETE' || recordedGame.current === state.gameId) return;
    recordedGame.current = state.gameId;
    let nextInventory = readInventory();
    const salvage = grantMatchSalvageState(nextInventory, {
      matchId: state.gameId,
      won: state.winner === 'player-1',
      rounds: state.currentRound,
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
    localStorage.removeItem(MATCH_KEY);
    setSeed(nextSeed);
    setState(createMatch({ mode, gadget, seed: nextSeed, name: profile.name }));
    setSelectedAction(SIM_ACTION.PICK);
    setStarted(true);
    setShareStatus('');
    setSalvageReward(null);
    trackProductEvent('Instant Match Started', { mode });
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
        <section className="overflow-hidden border border-vault-border bg-vault-surface lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 sm:p-9 lg:p-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-oxide-green">Instant operation</p>
            <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] text-vault-text sm:text-7xl">Your table is ready.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-vault-text-dim">Play immediately against three distinct agents. Learn the pressure loop here, then take the same instincts onchain.</p>

            {challengeTarget && (
              <div className="mt-6 border-l-2 border-oxide-green bg-oxide-green/10 px-4 py-3 text-sm text-vault-text" role="status">
                Challenge received: breach this vault in fewer than {challengeTarget} rounds.
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {Object.entries(MODES).map(([id, item]) => (
                <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className={`min-h-[104px] border p-4 text-left sm:min-h-[132px] ${mode === id ? 'border-tungsten bg-tungsten/10' : 'border-vault-border bg-vault-dark/35'}`}>
                  <span className="font-display text-2xl uppercase text-vault-text">{item.label}</span>
                  <span className="mt-3 block text-sm leading-5 text-vault-text-dim">{item.description}</span>
                </button>
              ))}
            </div>

            {mode === 'tactical' && (
              <div className="mt-6 border border-tungsten/35 bg-tungsten/5 p-3">
                <div className="grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-3">
                  <GadgetVisual gadget={practiceBlueprint} compact className="min-h-20" />
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-tungsten">Workshop loadout / {practiceBlueprint.protocolFamilyLabel}</p>
                    <p className="mt-1 truncate font-display text-xl uppercase text-vault-text">{practiceBlueprint.name}</p>
                    <p className="mt-1 text-xs leading-5 text-vault-text-dim"><strong className="text-vault-text">{practiceBlueprint.effectName}:</strong> {practiceBlueprint.protocolLabel}</p>
                  </div>
                  <Link to="/workshop" className="hidden min-h-[44px] items-center border border-vault-border px-3 font-mono text-[9px] uppercase text-vault-text-dim sm:inline-flex">Change build</Link>
                </div>
                <p className="mt-3 border-t border-vault-border pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-oxide-green">One build, one visible signature, one use per operation.</p>
              </div>
            )}

            <button type="button" onClick={() => begin()} className="mt-6 inline-flex min-h-[54px] w-full items-center justify-center bg-tungsten-bright px-7 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-vault-dark sm:w-auto">Breach the vault -&gt;</button>

            <p className="mt-6 max-w-xl text-sm leading-6 text-vault-text-dim">
              Tools stay with you and add 15% to future Pick odds, up to 95%. Sabotage stuns a rival for one round, but the same rival cannot be chain-stunned. If players breach together, a seeded tiebreak decides the winner.
            </p>
            <details className="mt-4 max-w-xl rounded border border-vault-border bg-vault-dark/35 p-3">
              <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em] text-vault-text-dim">
                Practice and live rules
              </summary>
              <p className="mt-3 text-sm leading-6 text-vault-text-dim">
                Instant Play is a local practice ruleset. Pick, Search, Sabotage, tools, and simultaneous
                reveals match the live game's core loop; gadgets and anti-chain-stun protection are practice
                features and may differ from the current Sepolia contract.
              </p>
            </details>
          </div>

          <aside className="relative min-h-[420px] border-t border-vault-border lg:border-l lg:border-t-0">
            <img src="/images/plundrix-instant-breach.webp" alt="" width="1024" height="1024" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-vault-dark via-vault-dark/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Operator record</p>
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
    <div className="instant-play-active mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Seo
        title={`${MODES[mode].label} Operation - Plundrix`}
        description="Play a fast tactical Plundrix vault race against three labeled agents."
        path="/play"
        image="/images/og/plundrix-play.jpg"
        imageAlt="Plundrix instant play - Your table is ready. No wallet required."
      />
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <section className={`border border-vault-border bg-vault-surface ${isResolving ? 'instant-resolving' : ''}`} aria-live="polite">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-vault-border px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-oxide-green">{MODES[mode].label} / instant session</p>
                <h1 className="mt-1 font-display text-3xl uppercase text-vault-text">Round {state.currentRound}</h1>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={toggleAudio} aria-pressed={soundEnabled} className="min-h-[44px] border border-vault-border px-3 font-mono text-xs uppercase text-vault-text-dim">{soundEnabled ? 'Sound on' : 'Sound off'}</button>
                <button type="button" onClick={share} className="min-h-[44px] border border-tungsten/45 px-3 font-mono text-[10px] uppercase text-tungsten">Share challenge</button>
                <button type="button" onClick={abandon} className="min-h-[44px] border border-vault-border px-3 font-mono text-xs uppercase text-vault-text-dim">Exit match</button>
              </div>
            </header>
            {shareStatus && <p className="border-b border-vault-border bg-oxide-green/5 px-5 py-2 font-mono text-xs text-oxide-green" role="status">{shareStatus}</p>}

            <div className="instant-vault-core relative overflow-hidden border-b border-vault-border px-5 py-7 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-tungsten">Your vault</p>
              <div className="mx-auto mt-4 flex max-w-md justify-center gap-3" role="img" aria-label={`${player.locksCracked} of ${state.rules.totalLocks} locks cracked`}>
                {Array.from({ length: state.rules.totalLocks }, (_, index) => (
                  <span key={index} className={`instant-lock grid h-12 w-12 place-items-center rounded-full border-2 font-display text-xl ${index < player.locksCracked ? 'instant-lock-cracked border-tungsten bg-tungsten/20 text-tungsten-bright' : 'border-vault-border bg-vault-dark text-vault-text-dim'}`}>{index < player.locksCracked ? 'X' : index + 1}</span>
                ))}
              </div>
              <p className="mt-4 text-sm text-vault-text-dim">Crack {state.rules.totalLocks - player.locksCracked} more {state.rules.totalLocks - player.locksCracked === 1 ? 'lock' : 'locks'} before the table.</p>
              {isResolving && <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-tungsten">Actions sealed. Revealing...</p>}
            </div>

            {latestSignature && <div className="border-b border-vault-border p-4"><SignatureMoment event={latestSignature} actorName={state.players.find((candidate) => candidate.id === latestSignature.actor)?.name} reducedMotion={reducedMotion} soundEnabled={soundEnabled} /></div>}

            <div className="flex min-w-0 snap-x gap-px overflow-x-auto bg-vault-border" role="region" aria-label="Players at this table" tabIndex={0}>
              {state.players.map((candidate) => (
                <article key={candidate.id} className={`min-w-[220px] flex-1 snap-start bg-vault-surface p-4 ${candidate.id === 'player-1' ? 'ring-1 ring-inset ring-tungsten/45' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      {RIVAL_ART[candidate.name] && <img src={RIVAL_ART[candidate.name]} alt="" width="384" height="384" className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]" />}
                      <span className="font-display text-xl uppercase text-vault-text">{candidate.name}</span>
                    </span>
                    <span className={`h-2 w-2 rounded-full ${candidate.stunned ? 'bg-signal-red' : 'bg-oxide-green'}`} />
                  </div>
                  <div className="mt-3 flex gap-1" role="img" aria-label={`${candidate.locksCracked} of ${state.rules.totalLocks} locks`}>
                    {Array.from({ length: state.rules.totalLocks }, (_, index) => <span key={index} className={`h-3 flex-1 border ${index < candidate.locksCracked ? 'border-tungsten bg-tungsten/40' : 'border-vault-border bg-vault-dark'}`} />)}
                  </div>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-vault-text-dim">{candidate.tools} tools {candidate.stunned ? '/ stunned' : ''}</p>
                  {RIVAL_PERSONAS[candidate.name] && <p className="mt-2 text-xs leading-5 text-vault-text-dim">{RIVAL_PERSONAS[candidate.name]}</p>}
                  {chronicle.rivals[candidate.name] && <><p className="mt-2 font-mono text-[8px] uppercase tracking-[.12em] text-signal-red">Grudge {'X'.repeat(chronicle.rivals[candidate.name].grudge)}{'-'.repeat(5 - chronicle.rivals[candidate.name].grudge)} / record {chronicle.rivals[candidate.name].playerWins}-{chronicle.rivals[candidate.name].rivalWins}</p><p className="mt-1 text-xs italic leading-5 text-vault-text-dim">"{rivalTaunt(candidate.name, chronicle.rivals[candidate.name])}"</p></>}
                  {candidate.gadget && <p className="mt-1 font-mono text-[9px] uppercase text-oxide-green">{candidate.gadget.replace('-', ' ')} {candidate.gadgetReady ? 'ready' : 'spent'}</p>}
                </article>
              ))}
            </div>
          </section>

          {state.state === 'ACTIVE' ? (
            <section className="border border-vault-border bg-vault-surface p-5 sm:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Commit one concealed action</p>
              {state.roundHistory.length === 0 && (
                <p className="mt-3 border-l-2 border-oxide-green bg-oxide-green/10 px-4 py-3 text-sm leading-6 text-vault-text">
                  First move: Pick races now, Search builds permanent Pick odds, and Sabotage costs a rival their next turn. Everyone reveals together.
                </p>
              )}
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  [SIM_ACTION.PICK, 'Pick', `${getPickChance(player, state.rules)}% base`, 'Attack the next lock.'],
                  [SIM_ACTION.SEARCH, 'Search', `${getSearchChance(player, state.rules)}% base`, 'Build future Pick odds.'],
                  [SIM_ACTION.SABOTAGE, 'Sabotage', 'One-round stun', 'Stop a rival and steal one tool when available.'],
                ].map(([id, label, metric, detail]) => (
                  <button key={id} type="button" aria-pressed={selectedAction === id} onClick={() => setSelectedAction(id)} className={`min-h-[118px] border p-4 text-left ${selectedAction === id ? 'border-tungsten bg-tungsten/10' : 'border-vault-border bg-vault-dark/35'}`}>
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="font-display text-3xl uppercase text-vault-text">{label}</span>
                        <span className="mt-2 block font-mono text-[10px] uppercase text-oxide-green">{metric}</span>
                      </span>
                      <img src={ACTION_ART[id]} alt="" width="512" height="512" className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]" />
                    </span>
                    <span className="mt-3 block text-sm text-vault-text-dim">{detail}</span>
                  </button>
                ))}
              </div>

              {selectedAction === SIM_ACTION.SABOTAGE && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {state.players.slice(1).map((candidate) => (
                    <button key={candidate.id} type="button" onClick={() => setTarget(candidate.id)} className={`min-h-[44px] border px-4 font-mono text-xs uppercase ${target === candidate.id ? 'border-signal-red bg-signal-red/10 text-signal-red' : 'border-vault-border text-vault-text'}`}>{candidate.name} / {candidate.locksCracked} locks</button>
                  ))}
                </div>
              )}

              <div className="instant-action-commit -mx-5 mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-vault-border bg-vault-surface/95 px-5 py-4 backdrop-blur sm:mx-0 sm:flex sm:flex-wrap sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0">
                <button type="button" disabled={isResolving} onClick={() => resolve(false)} className="min-h-[52px] flex-1 bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-vault-dark disabled:cursor-wait disabled:opacity-60">{isResolving ? 'Revealing...' : 'Commit and reveal'}</button>
                <button type="button" disabled={isResolving} onClick={() => resolve(true)} title="The game chooses a recommended move for you this round." aria-label="Auto-play this round" className="min-h-[52px] border border-vault-border px-4 font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim disabled:opacity-50"><span className="hidden sm:inline">Auto-play this round</span><span className="sm:hidden">Auto</span></button>
              </div>

              <div className="mt-5 border-l-2 border-tungsten bg-vault-dark/50 p-4" aria-live="polite">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-tungsten">Tactical preview</p>
                <p className="mt-2 text-sm leading-6 text-vault-text">{preview}</p>
              </div>
            </section>
          ) : (
            <section className="instant-complete relative overflow-hidden border border-tungsten/45 bg-vault-dark px-7 py-10 text-left sm:px-10">
              <img src="/images/victory-breach.webp" alt="" width="1024" height="420" className="absolute inset-0 h-full w-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-r from-vault-dark via-vault-dark/90 to-vault-dark/20" />
              <div className="relative z-10 max-w-2xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-tungsten">Final briefing</p>
                <h2 className="mt-3 font-display text-5xl uppercase leading-[0.92] text-vault-text">{winner?.name} breached the vault</h2>
                <p className="mt-4 max-w-xl leading-6 text-vault-text-dim">Completed in {state.currentRound} rounds. {state.winner === 'player-1' ? `You earned 125 XP and defended your ${rank} rank.` : `${winner?.name} stole the final opening. You earned 50 XP and new intel for the rematch.`}</p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[.14em] text-signal-red">Rivalry chronicle updated. They will remember this.</p>
                {salvageReward?.length > 0 && <div className="mt-5 border border-oxide-green/45 bg-oxide-green/10 p-4"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-oxide-green">Workshop salvage recovered</p><div className="mt-3 flex flex-wrap gap-2">{salvageReward.map(({ materialId, amount }) => { const material = CRAFTING_MATERIALS.find((item) => item.id === materialId); return <span key={materialId} className="inline-flex items-center gap-2 border border-vault-border bg-vault-dark/70 px-3 py-2 font-mono text-xs uppercase text-vault-text"><img src={material?.image} alt="" className="h-7 w-7 object-contain" />+{amount} {material?.label}</span>; })}</div></div>}
                {challengeTarget && <p className={`mt-3 font-mono text-xs uppercase tracking-[0.16em] ${state.currentRound < challengeTarget && state.winner === 'player-1' ? 'text-oxide-green' : 'text-tungsten'}`}>{state.currentRound < challengeTarget && state.winner === 'player-1' ? `Challenge beaten by ${challengeTarget - state.currentRound} rounds` : `Challenge target: under ${challengeTarget} rounds`}</p>}
              </div>
              <div className="relative z-10 mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={() => begin(`rematch-${Date.now()}`)} className="min-h-[50px] bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase text-vault-dark">Instant rematch</button>
                <button type="button" onClick={share} className="min-h-[50px] border border-tungsten/45 px-5 font-mono text-xs uppercase text-tungsten">Share score challenge</button>
                <Link to="/replays" className="inline-flex min-h-[50px] items-center border border-vault-border px-5 font-mono text-xs uppercase text-vault-text">Watch replays</Link>
                <Link to="/workshop" className="inline-flex min-h-[50px] items-center border border-oxide-green/45 px-5 font-mono text-xs uppercase text-oxide-green">Visit workshop</Link>
              </div>
            </section>
          )}

          {latestOutcomes.length > 0 && (
            <section className="border border-vault-border bg-vault-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-vault-text-dim">Last resolution</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {latestOutcomes.map((event) => <p key={event.id} className="border border-vault-border bg-vault-dark/50 px-3 py-2 text-sm text-vault-text">{event.message}</p>)}
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-4">
          {state.roundHistory.length > 1 && <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-oxide-green">First-operation guide</p>
            <ol className="mt-4 space-y-3">
              {[
                ['Choose', state.roundHistory.length > 0, 'Read the odds and commit one move.'],
                ['Resolve', state.roundHistory.length > 0, 'Every operator reveals together.'],
                ['Counter', state.roundHistory.length > 1, 'React to tools, stuns, and leaders.'],
                ['Breach', state.state === 'COMPLETE', 'Crack the final lock first.'],
              ].map(([label, done, detail], index) => (
                <li key={label} className="flex gap-3">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center border font-mono text-[10px] ${done ? 'border-oxide-green bg-oxide-green/10 text-oxide-green' : 'border-vault-border text-vault-text-dim'}`}>{done ? 'OK' : index + 1}</span>
                  <div><p className="font-display uppercase text-vault-text">{label}</p><p className="mt-1 text-xs leading-5 text-vault-text-dim">{detail}</p></div>
                </li>
              ))}
            </ol>
          </section>}

          {state.state === 'ACTIVE' && (
          <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Current plan</p>
            <p className="mt-2 font-display text-2xl uppercase text-vault-text">{selectedAction}</p>
            <p className="mt-3 text-sm leading-6 text-vault-text-dim">{preview}</p>
            <p className="mt-4 border-t border-vault-border pt-3 font-mono text-xs text-oxide-green">Progress saves automatically on this device.</p>
          </section>
          )}

          {mode === 'tactical' && <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Workshop loadout</p>
            <div className="mt-3 grid grid-cols-[78px_minmax(0,1fr)] items-center gap-3"><GadgetVisual gadget={practiceBlueprint} compact masteryLevel={getGadgetMastery(readInventory(), gadget).level} /><div><p className="font-display text-xl uppercase text-vault-text">{practiceBlueprint.name}</p><p className="mt-1 text-xs leading-5 text-vault-text-dim">{practiceBlueprint.effectName} / {practiceBlueprint.protocolLabel}</p></div></div>
          </section>}

          {state.state === 'COMPLETE' && <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Season identity</p>
            <p className="mt-2 font-display text-2xl uppercase text-tungsten-bright">{rank}</p>
            <label className="mt-4 grid gap-2">
              <span className="font-mono text-[10px] uppercase text-vault-text-dim">Operator name</span>
              <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value.slice(0, 20) }))} onBlur={() => localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))} className="min-h-[44px] border border-vault-border bg-vault-dark px-3 text-vault-text" />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="XP" value={profile.xp} />
              <Stat label="Streak" value={profile.streak} />
              <Stat label="Wins" value={profile.wins} />
              <Stat label="Games" value={profile.games} />
            </div>
            <div className="mt-3 h-2 bg-vault-dark"><div className="h-2 bg-oxide-green" style={{ width: `${(profile.xp % 500) / 5}%` }} /></div>
            <p className="mt-2 font-mono text-[9px] uppercase text-vault-text-dim">Level {Math.floor(profile.xp / 500) + 1} / next rank in {500 - (profile.xp % 500)} XP</p>
          </section>}

          {state.state === 'COMPLETE' && <section className="border border-vault-border bg-vault-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tungsten">Next operation</p>
            <div className="mt-3 grid gap-2">
              <Link to="/#live-operations" className="min-h-[44px] border border-tungsten/45 px-3 py-3 font-mono text-[10px] uppercase text-tungsten">Take it onchain</Link>
              <Link to="/trailer" className="min-h-[44px] border border-vault-border px-3 py-3 font-mono text-[10px] uppercase text-vault-text">Watch gameplay trailer</Link>
              <Link to="/sessions" className="min-h-[44px] border border-vault-border px-3 py-3 font-mono text-[10px] uppercase text-vault-text">Spectate live sessions</Link>
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
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-vault-text-dim">{label}</p>
      <p className="mt-1 font-display text-2xl text-vault-text">{value}</p>
    </div>
  );
}

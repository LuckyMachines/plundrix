import { buildStrategyActionMap, createInitialSimulation, resolveSimulationRound } from './plundrixEngine';
import { localWeeklyChallenge } from './weeklyChallenge';

export const VAULT_RUN_STORAGE_KEY = 'plundrix-vault-run-v1';

export const VAULT_RUN_STAGES = Object.freeze([
  { id: 'outer-ring', label: 'Outer Ring', eyebrow: 'Vault 01', locks: 3, rival: 'Rook', note: 'A brisk lock sprint with room to improvise.' },
  { id: 'signal-gallery', label: 'Signal Gallery', eyebrow: 'Vault 02', locks: 4, rival: 'Mara', note: 'Tools matter and the air is full of useful lies.' },
  { id: 'crown-vault', label: 'Crown Vault', eyebrow: 'Vault 03', locks: 5, rival: 'Vesper', note: 'Every lead attracts attention. Every mistake gets a witness.' },
]);

export const VAULT_ROUTES = Object.freeze([
  { id: 'hot-entry', label: 'Kick the hinge', tone: 'Reckless', trade: '+12 Pick odds; rivals gain a tool; +25% score and +50% salvage.', heat: 1, multiplier: 1.25, salvageMultiplier: 1.5 },
  { id: 'inside-route', label: 'Bribe the map', tone: 'Cunning', trade: 'Begin with a tool; Search odds lose 10 points; +5% stage score.', heat: 0, multiplier: 1.05, salvageMultiplier: 1 },
  { id: 'ghost-route', label: 'Become a rumor', tone: 'Careful', trade: 'Longer Sabotage protection; -5 Pick odds; -5% score and -25% salvage.', heat: -1, multiplier: 0.95, salvageMultiplier: 0.75 },
]);

function safeRun(value) {
  return value && value.version === 1 && VAULT_RUN_STAGES[value.stageIndex] && ['ROUTE', 'ACTIVE'].includes(value.status);
}

export function createVaultRun({ seed, weekly = false, gadget = 'precision-kit', operatorName = 'Operator', date = new Date() } = {}) {
  const challenge = localWeeklyChallenge(date);
  const runSeed = seed || (weekly ? challenge.seed : `vault-run-${Date.now()}`);
  return {
    version: 1,
    runId: `vr-${Math.abs(hashString(`${runSeed}:${gadget}`)).toString(36)}`,
    seed: runSeed,
    weekly: Boolean(weekly),
    challengeId: weekly ? challenge.id : null,
    gadget,
    operatorName: String(operatorName || 'Operator').slice(0, 20),
    status: 'ROUTE',
    stageIndex: 0,
    lives: 2,
    heat: 0,
    score: 0,
    carryTools: weekly && challenge.modifier === 'Deep Pockets' ? 1 : 0,
    path: [],
    currentMatch: null,
    currentRoute: null,
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function startVaultStage(run, routeId) {
  if (!run || run.status !== 'ROUTE') return run;
  const stage = VAULT_RUN_STAGES[run.stageIndex];
  const route = VAULT_ROUTES.find((candidate) => candidate.id === routeId) || VAULT_ROUTES[1];
  const challenge = run.weekly ? localWeeklyChallenge() : null;
  const pickPenalty = challenge?.modifier === 'Hot Locks' ? 5 : 0;
  const match = createInitialSimulation({
    seed: `${run.seed}:${stage.id}:${run.path.length}`,
    gameId: `${run.runId}-${stage.id}-${run.path.length}`,
    playerCount: 4,
    names: [run.operatorName, 'Rook', 'Mara', 'Vesper'],
    gadgets: [run.gadget, 'firewall', 'signal-scanner', 'precision-kit'],
    playerPatches: [
      { tools: Math.min(5, run.carryTools + (route.id === 'inside-route' ? 1 : 0)) },
      { tools: route.id === 'hot-entry' ? 1 : 0 },
      { tools: route.id === 'hot-entry' ? 1 : 0 },
      { tools: route.id === 'hot-entry' ? 1 : 0 },
    ],
    rules: {
      totalLocks: stage.locks,
      pickBaseChance: 40 + (route.id === 'hot-entry' ? 12 : 0) - (route.id === 'ghost-route' ? 5 : 0) - pickPenalty,
      searchChance: 60 - (route.id === 'inside-route' ? 10 : 0),
      sabotageCooldownRounds: challenge?.modifier === 'Loose Wires' ? 0 : route.id === 'ghost-route' ? 2 : 1,
      roundTimeoutSeconds: 90,
    },
  });
  return {
    ...run,
    status: 'ACTIVE',
    heat: Math.max(0, Math.min(5, run.heat + route.heat)),
    currentRoute: route.id,
    currentMatch: match,
  };
}

export function buildVaultActionMap(run, playerAction) {
  const map = buildStrategyActionMap(
    run.currentMatch,
    ['human', run.stageIndex === 0 ? 'picker' : 'leader-hunter', 'tool-hoarder', 'saboteur'],
    { aggression: 58 + run.heat * 5, searchGreed: 45, sabotageThreshold: 56 - run.heat * 3, riskTolerance: 62 },
  );
  map['player-1'] = playerAction;
  return map;
}

export function applyVaultRound(run, actionMap) {
  if (!run || run.status !== 'ACTIVE' || !run.currentMatch) return run;
  const match = resolveSimulationRound(run.currentMatch, actionMap);
  if (match.state !== 'COMPLETE') return { ...run, currentMatch: match };
  const won = match.winner === 'player-1';
  const stage = VAULT_RUN_STAGES[run.stageIndex];
  const route = VAULT_ROUTES.find((candidate) => candidate.id === run.currentRoute) || VAULT_ROUTES[1];
  const weeklyBoost = run.weekly && localWeeklyChallenge().modifier === 'Hot Locks' ? 1.1 : 1;
  const stageScore = won
    ? Math.max(250, Math.round((1500 + stage.locks * 240 + match.players[0].tools * 50 - match.currentRound * 45) * route.multiplier * weeklyBoost))
    : Math.max(0, 300 - match.currentRound * 20);
  const bargainOutcomes = match.roundHistory.flatMap((round) => {
    const bargainEvent = round.events.find((event) => event.type === 'BargainResolved' && event.actor === 'player-1');
    const actionOutcome = round.events.find((event) => event.type === 'ActionOutcome' && event.actor === 'player-1');
    return bargainEvent ? [{ id: bargainEvent.bargain, success: Boolean(actionOutcome?.success) }] : [];
  });
  const entry = {
    stageId: stage.id,
    routeId: route.id,
    won,
    rounds: match.currentRound,
    score: stageScore,
    bargainIds: bargainOutcomes.map((item) => item.id),
    bargainOutcomes,
    salvageMultiplier: route.salvageMultiplier,
    gadgetActivated: match.players[0].gadgetReady === false,
  };
  const nextStage = won ? run.stageIndex + 1 : run.stageIndex;
  const lives = won ? run.lives : run.lives - 1;
  const status = won && nextStage >= VAULT_RUN_STAGES.length ? 'COMPLETE' : lives <= 0 ? 'FAILED' : 'ROUTE';
  return {
    ...run,
    status,
    stageIndex: Math.min(nextStage, VAULT_RUN_STAGES.length - 1),
    lives,
    score: run.score + stageScore,
    carryTools: won ? Math.min(2, match.players[0].tools) : 0,
    path: [...run.path, entry],
    currentMatch: match,
  };
}

export function readVaultRun(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(VAULT_RUN_STORAGE_KEY));
    return safeRun(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeVaultRun(run, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return run;
  if (['COMPLETE', 'FAILED'].includes(run?.status)) storage.removeItem(VAULT_RUN_STORAGE_KEY);
  else storage.setItem(VAULT_RUN_STORAGE_KEY, JSON.stringify(run));
  return run;
}

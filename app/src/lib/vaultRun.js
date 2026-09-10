import { SIM_ACTION, buildStrategyActionMap, createInitialSimulation, resolveSimulationRound } from './plundrixEngine';
import { localWeeklyChallenge } from './weeklyChallenge';
import { buildReplayProof } from './replayDirector';

export const VAULT_RUN_STORAGE_KEY = 'plundrix-vault-run-v1';
export const VAULT_RUN_HISTORY_KEY = 'plundrix-vault-run-history-v1';

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

export const VAULT_CONTRABAND = Object.freeze([
  { id: 'tension-ratchet', label: 'Tension Ratchet', effect: '+6 Pick odds for the rest of this run.', kind: 'pick', value: 6 },
  { id: 'whisper-lens', label: 'Whisper Lens', effect: '+8 Search odds for the rest of this run.', kind: 'search', value: 8 },
  { id: 'false-bottom', label: 'False Bottom', effect: 'Carry one extra tool into every remaining vault.', kind: 'tools', value: 1 },
  { id: 'cooling-vial', label: 'Cooling Vial', effect: 'Erase one Heat immediately.', kind: 'heat', value: -1 },
  { id: 'spare-alibi', label: 'Spare Alibi', effect: 'Recover one life, up to three.', kind: 'life', value: 1 },
  { id: 'insulated-line', label: 'Insulated Line', effect: 'Gain one extra round of anti-chain-stun protection.', kind: 'cooldown', value: 1 },
]);

export const VAULT_HEAT_STATES = Object.freeze([
  { min: 4, label: 'Hunted', consequence: 'Rivals begin with a tool and pursue leaders more aggressively.' },
  { min: 2, label: 'Watched', consequence: 'Rivals begin each vault with one tool.' },
  { min: 0, label: 'Cool', consequence: 'No additional rival advantage.' },
]);

function safeRun(value) {
  return value && [1, 2].includes(value.version) && VAULT_RUN_STAGES[value.stageIndex] && ['ROUTE', 'ACTIVE', 'LOOT'].includes(value.status);
}

function normalizeRun(value) {
  if (!safeRun(value)) return null;
  return {
    ...value,
    version: 2,
    contraband: Array.isArray(value.contraband) ? value.contraband.filter((id) => VAULT_CONTRABAND.some((item) => item.id === id)) : [],
    lootChoices: Array.isArray(value.lootChoices) ? value.lootChoices.filter((id) => VAULT_CONTRABAND.some((item) => item.id === id)) : [],
    challengeModifier: value.weekly ? (value.challengeModifier || localWeeklyChallenge().modifier) : null,
    rivalGrudges: Object.fromEntries(['Rook', 'Mara', 'Vesper'].map((name) => [name, Math.max(0, Math.min(5, Number(value.rivalGrudges?.[name]) || 0))])),
  };
}

export function createVaultRun({ seed, weekly = false, gadget = 'precision-kit', operatorName = 'Operator', rivalGrudges = {}, runNonce, date = new Date() } = {}) {
  const challenge = localWeeklyChallenge(date);
  const runSeed = seed || (weekly ? challenge.seed : `vault-run-${Date.now()}`);
  const nonce = runNonce || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  return {
    version: 2,
    runId: `vr-${Math.abs(hashString(`${runSeed}:${gadget}:${nonce}`)).toString(36)}-${String(nonce).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24)}`,
    seed: runSeed,
    weekly: Boolean(weekly),
    challengeId: weekly ? challenge.id : null,
    challengeModifier: weekly ? challenge.modifier : null,
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
    contraband: [],
    lootChoices: [],
    rivalGrudges: Object.fromEntries(['Rook', 'Mara', 'Vesper'].map((name) => [
      name,
      weekly ? 0 : Math.max(0, Math.min(5, Number(rivalGrudges[name]) || 0)),
    ])),
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
  const challenge = run.weekly ? { modifier: run.challengeModifier || localWeeklyChallenge().modifier } : null;
  const pickPenalty = challenge?.modifier === 'Hot Locks' ? 5 : 0;
  const nextHeat = Math.max(0, Math.min(5, run.heat + route.heat));
  const heatState = getVaultHeatState(nextHeat);
  const contraband = run.contraband || [];
  const contrabandPick = contraband.filter((id) => id === 'tension-ratchet').length * 6;
  const contrabandSearch = contraband.filter((id) => id === 'whisper-lens').length * 8;
  const contrabandTools = contraband.filter((id) => id === 'false-bottom').length;
  const contrabandCooldown = contraband.filter((id) => id === 'insulated-line').length;
  const rivalTools = heatState.min >= 2 ? 1 : 0;
  const match = createInitialSimulation({
    seed: `${run.seed}:${stage.id}:${run.path.length}`,
    gameId: run.weekly
      ? `${run.challengeId}-${stage.id}-${run.path.length}`
      : `${run.runId}-${stage.id}-${run.path.length}`,
    playerCount: 4,
    names: [run.operatorName, 'Rook', 'Mara', 'Vesper'],
    gadgets: [run.gadget, 'firewall', 'signal-scanner', 'precision-kit'],
    playerPatches: [
      { tools: Math.min(5, run.carryTools + contrabandTools + (route.id === 'inside-route' ? 1 : 0)) },
      { tools: Math.min(5, rivalTools + (route.id === 'hot-entry' ? 1 : 0)) },
      { tools: Math.min(5, rivalTools + (route.id === 'hot-entry' ? 1 : 0)) },
      { tools: Math.min(5, rivalTools + (route.id === 'hot-entry' ? 1 : 0)) },
    ],
    rules: {
      totalLocks: stage.locks,
      pickBaseChance: 40 + contrabandPick + (route.id === 'hot-entry' ? 12 : 0) - (route.id === 'ghost-route' ? 5 : 0) - pickPenalty,
      searchChance: 60 + contrabandSearch + (challenge?.modifier === 'Searchlight' ? 10 : 0) - (route.id === 'inside-route' ? 10 : 0),
      sabotageCooldownRounds: challenge?.modifier === 'Loose Wires' ? 0 : (route.id === 'ghost-route' ? 2 : 1) + contrabandCooldown + (challenge?.modifier === 'Long Fuse' ? 1 : 0),
      catchUpDoublePickGap: challenge?.modifier === 'Brittle Seams' ? 1 : 2,
      roundTimeoutSeconds: 90,
    },
  });
  return {
    ...run,
    status: 'ACTIVE',
    heat: nextHeat,
    currentRoute: route.id,
    currentMatch: match,
  };
}

export function buildVaultActionMap(run, playerAction) {
  const map = buildStrategyActionMap(
    run.currentMatch,
    ['human', run.stageIndex === 0 ? 'picker' : 'leader-hunter', 'tool-hoarder', 'saboteur'],
    { aggression: 58 + run.heat * 5 + (run.heat >= 4 ? 10 : 0), searchGreed: 45, sabotageThreshold: 56 - run.heat * 3, riskTolerance: 62 },
  );
  const rivalName = VAULT_RUN_STAGES[run.stageIndex]?.rival;
  const rivalId = { Rook: 'player-2', Mara: 'player-3', Vesper: 'player-4' }[rivalName];
  if ((run.rivalGrudges?.[rivalName] || 0) >= 3 && run.currentMatch.currentRound === 2 && rivalId) {
    map[rivalId] = { action: SIM_ACTION.SABOTAGE, sabotageTarget: 'player-1' };
  }
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
  const weeklyBoost = run.weekly && run.challengeModifier === 'Hot Locks' ? 1.1 : 1;
  const revengeBonus = won && !run.weekly && (run.rivalGrudges?.[stage.rival] || 0) >= 3 ? 200 : 0;
  const stageScore = won
    ? Math.max(250, Math.round((1500 + stage.locks * 240 + match.players[0].tools * 50 - match.currentRound * 45) * route.multiplier * weeklyBoost)) + revengeBonus
    : Math.max(0, 300 - match.currentRound * 20);
  const bargainOutcomes = match.roundHistory.flatMap((round) => {
    const bargainEvent = round.events.find((event) => event.type === 'BargainResolved' && event.actor === 'player-1');
    const actionOutcome = round.events.find((event) => event.type === 'ActionOutcome' && event.actor === 'player-1');
    return bargainEvent ? [{ id: bargainEvent.bargain, success: Boolean(actionOutcome?.success) }] : [];
  });
  const actionMix = match.roundHistory.reduce((counts, round) => {
    const outcome = round.events.find((event) => event.type === 'ActionOutcome' && event.actor === 'player-1');
    if (outcome) counts[outcome.action] = (counts[outcome.action] || 0) + 1;
    return counts;
  }, {});
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
    actionMix,
    revengeBonus,
    contrabandBefore: [...(run.contraband || [])],
    heatAtStart: run.heat,
    replayProof: buildReplayProof(match),
  };
  const nextStage = won ? run.stageIndex + 1 : run.stageIndex;
  const lives = won ? run.lives : run.lives - 1;
  const complete = won && nextStage >= VAULT_RUN_STAGES.length;
  const status = complete ? 'COMPLETE' : lives <= 0 ? 'FAILED' : won ? 'LOOT' : 'ROUTE';
  const lootChoices = status === 'LOOT' ? contrabandChoices(run, stage.id) : [];
  return {
    ...run,
    status,
    stageIndex: Math.min(nextStage, VAULT_RUN_STAGES.length - 1),
    lives,
    score: run.score + stageScore,
    carryTools: won ? Math.min(2, match.players[0].tools) : 0,
    path: [...run.path, entry],
    currentMatch: match,
    lootChoices,
  };
}

function contrabandChoices(run, stageId) {
  const start = hashString(`${run.seed}:${stageId}:${run.path.length}`) % VAULT_CONTRABAND.length;
  return [0, 2, 5].map((offset) => VAULT_CONTRABAND[(start + offset) % VAULT_CONTRABAND.length].id);
}

export function chooseVaultContraband(run, contrabandId) {
  if (!run || run.status !== 'LOOT' || !run.lootChoices?.includes(contrabandId)) return run;
  const item = VAULT_CONTRABAND.find((candidate) => candidate.id === contrabandId);
  if (!item) return run;
  return {
    ...run,
    status: 'ROUTE',
    contraband: [...(run.contraband || []), item.id],
    lootChoices: [],
    heat: item.kind === 'heat' ? Math.max(0, run.heat + item.value) : run.heat,
    lives: item.kind === 'life' ? Math.min(3, run.lives + item.value) : run.lives,
  };
}

export function getVaultHeatState(heat = 0) {
  const value = Math.max(0, Math.min(5, Number(heat) || 0));
  return VAULT_HEAT_STATES.find((state) => value >= state.min) || VAULT_HEAT_STATES.at(-1);
}

export function readVaultRun(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(VAULT_RUN_STORAGE_KEY));
    return normalizeRun(value);
  } catch {
    return null;
  }
}

export function writeVaultRun(run, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return run;
  if (['COMPLETE', 'FAILED'].includes(run?.status)) {
    recordVaultRunHistory(run, storage);
    storage.removeItem(VAULT_RUN_STORAGE_KEY);
  } else storage.setItem(VAULT_RUN_STORAGE_KEY, JSON.stringify(run));
  return run;
}

export function readVaultRunHistory(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return [];
  try {
    const value = JSON.parse(storage.getItem(VAULT_RUN_HISTORY_KEY));
    return Array.isArray(value) ? value.filter((item) => item?.runId).slice(0, 20) : [];
  } catch {
    return [];
  }
}

export function recordVaultRunHistory(run, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage || !run?.runId || !['COMPLETE', 'FAILED'].includes(run.status)) return readVaultRunHistory(storage);
  const current = readVaultRunHistory(storage);
  if (current.some((item) => item.runId === run.runId)) return current;
  const record = {
    runId: run.runId,
    status: run.status,
    score: run.score,
    stages: run.path.length,
    rounds: run.path.reduce((sum, item) => sum + item.rounds, 0),
    weekly: run.weekly,
    gadget: run.gadget,
    contraband: run.contraband || [],
    completedAt: new Date().toISOString(),
  };
  const next = [record, ...current].slice(0, 20);
  storage.setItem(VAULT_RUN_HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function buildVaultRunProof(run) {
  if (!run || run.status !== 'COMPLETE' || !run.weekly) return null;
  return {
    version: 1,
    challengeId: run.challengeId,
    runId: run.runId,
    seed: run.seed,
    modifier: run.challengeModifier,
    gadget: run.gadget,
    result: 'complete',
    score: run.score,
    rounds: run.path.reduce((sum, item) => sum + item.rounds, 0),
    path: run.path.map((entry) => ({
      stageId: entry.stageId,
      routeId: entry.routeId,
      won: entry.won,
      rounds: entry.rounds,
      score: entry.score,
      contrabandBefore: entry.contrabandBefore || [],
      heatAtStart: entry.heatAtStart || 0,
      replayProof: entry.replayProof,
    })),
  };
}

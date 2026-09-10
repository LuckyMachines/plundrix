import { rebuildStateFromReplayProof } from '../app/src/lib/replayDirector.js';
import { GADGET_CHASSIS_BY_ID } from '../app/src/data/gadgetInventory.js';

const submissions = new Map();

const STAGES = Object.freeze([
  { id: 'outer-ring', locks: 3 },
  { id: 'signal-gallery', locks: 4 },
  { id: 'crown-vault', locks: 5 },
]);
const ROUTES = Object.freeze({
  'hot-entry': { heat: 1, multiplier: 1.25 },
  'inside-route': { heat: 0, multiplier: 1.05 },
  'ghost-route': { heat: -1, multiplier: 0.95 },
});
const CONTRABAND = Object.freeze(['tension-ratchet', 'whisper-lens', 'false-bottom', 'cooling-vial', 'spare-alibi', 'insulated-line']);

export function getIsoWeek(date = new Date()) {
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  current.setUTCDate(current.getUTCDate() + 4 - (current.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  return { year: current.getUTCFullYear(), week: Math.ceil((((current - yearStart) / 86400000) + 1) / 7) };
}

export function weeklyChallengeForDate(date = new Date()) {
  const { year, week } = getIsoWeek(date);
  const variants = [
    { modifier: 'Hot Locks', note: 'Pick odds start 5 points lower. Scores run 10% hotter.' },
    { modifier: 'Loose Wires', note: 'Sabotage protection cools down immediately.' },
    { modifier: 'Deep Pockets', note: 'The run opens with one carried tool.' },
    { modifier: 'Searchlight', note: 'Search odds gain 10 points in every vault.' },
    { modifier: 'Long Fuse', note: 'Anti-chain-stun protection lasts one extra round.' },
    { modifier: 'Brittle Seams', note: 'Table pressure cracks two locks when only one lock behind.' },
  ];
  return {
    id: `${year}-w${String(week).padStart(2, '0')}`,
    seed: `weekly-vault-${year}-${week}`,
    title: `Weekly Vault ${String(week).padStart(2, '0')}`,
    ...variants[week % variants.length],
  };
}

const BUILT_INS = Object.freeze([
  { alias: 'Mara', score: 6420, rounds: 13, verified: 'house-rival' },
  { alias: 'Vesper', score: 5980, rounds: 15, verified: 'house-rival' },
  { alias: 'Rook', score: 5510, rounds: 17, verified: 'house-rival' },
]);

function boardPayload(date = new Date()) {
  const challenge = weeklyChallengeForDate(date);
  const playerScores = submissions.get(challenge.id) || [];
  return {
    challenge,
    scores: [...BUILT_INS, ...playerScores].sort((a, b) => b.score - a.score || a.rounds - b.rounds).slice(0, 100),
    durability: 'service-session-beta',
    verification: 'exact-replay-verified',
  };
}

export function getWeeklyVaultBoard(date = new Date()) {
  return boardPayload(date);
}

export function submitWeeklyVaultScore(body, date = new Date()) {
  const challenge = weeklyChallengeForDate(date);
  if (!body || body.challengeId !== challenge.id) throw new Error('Challenge is not the current weekly vault');
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(String(body.runId || ''))) throw new Error('Invalid run id');
  const alias = String(body.alias || '').trim();
  if (!/^[A-Za-z0-9 _-]{1,20}$/.test(alias)) throw new Error('Alias must use 1-20 letters, numbers, spaces, dashes, or underscores');
  const score = Number(body.score);
  const rounds = Number(body.rounds);
  if (!Number.isInteger(score) || score < 0 || score > 1_000_000) throw new Error('Score is outside the accepted range');
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 200) throw new Error('Rounds are outside the accepted range');
  if (body.result !== 'complete') throw new Error('Only completed weekly runs can be submitted');
  const verified = verifyWeeklyVaultProof(body, challenge);
  if (verified.score !== score || verified.rounds !== rounds) throw new Error('Submitted result does not match replay proof');
  const current = submissions.get(challenge.id) || [];
  if (current.some((entry) => entry.runId === body.runId)) throw new Error('This run was already submitted');
  current.push({ runId: body.runId, alias, score, rounds, verified: 'exact-replay' });
  submissions.set(challenge.id, current.slice(-250));
  return boardPayload(date);
}

export function verifyWeeklyVaultProof(body, challenge = weeklyChallengeForDate()) {
  const proof = body?.proof;
  if (!proof || proof.version !== 1 || proof.challengeId !== challenge.id || proof.seed !== challenge.seed || proof.modifier !== challenge.modifier || proof.runId !== body.runId) {
    throw new Error('A matching weekly replay proof is required');
  }
  if (!Array.isArray(proof.path) || proof.path.length < 3 || proof.path.length > 8) throw new Error('Weekly replay path is invalid');
  if (!GADGET_CHASSIS_BY_ID[proof.gadget]) throw new Error('Weekly gadget is invalid');

  let stageIndex = 0;
  let score = 0;
  let rounds = 0;
  let heat = 0;
  let lives = 2;
  let carryTools = challenge.modifier === 'Deep Pockets' ? 1 : 0;
  let expectedContraband = [];
  let previousEntry = null;

  proof.path.forEach((entry, attemptIndex) => {
    const stage = STAGES[stageIndex];
    const route = ROUTES[entry.routeId];
    if (!stage || entry.stageId !== stage.id || !route) throw new Error('Weekly replay route is invalid');
    if (!Array.isArray(entry.contrabandBefore) || entry.contrabandBefore.some((id) => !CONTRABAND.includes(id))) throw new Error('Weekly contraband is invalid');

    if (previousEntry?.won) {
      if (entry.contrabandBefore.length !== expectedContraband.length + 1) throw new Error('Weekly contraband progression is invalid');
      const selected = entry.contrabandBefore.at(-1);
      if (!contrabandOffers(challenge.seed, previousEntry.stageId, attemptIndex - 1).includes(selected)) throw new Error('Weekly contraband choice was not offered');
      expectedContraband = [...expectedContraband, selected];
      if (selected === 'cooling-vial') heat = Math.max(0, heat - 1);
      if (selected === 'spare-alibi') lives = Math.min(3, lives + 1);
    } else if (entry.contrabandBefore.length !== expectedContraband.length) {
      throw new Error('Weekly contraband changed without a cleared vault');
    }
    if (entry.contrabandBefore.join('|') !== expectedContraband.join('|')) throw new Error('Weekly contraband order is invalid');

    heat = Math.max(0, Math.min(5, heat + route.heat));
    if (Number(entry.heatAtStart) !== heat) throw new Error('Weekly Heat state is invalid');
    validateStageProof(entry, proof, challenge, stage, route, heat, carryTools, expectedContraband, attemptIndex);
    const match = rebuildStateFromReplayProof(entry.replayProof);
    if (match.state !== 'COMPLETE') throw new Error('Weekly replay did not reach a result');
    const won = match.winner === 'player-1';
    if (Boolean(entry.won) !== won || Number(entry.rounds) !== match.currentRound) throw new Error('Weekly replay outcome is invalid');
    const weeklyBoost = challenge.modifier === 'Hot Locks' ? 1.1 : 1;
    const stageScore = won
      ? Math.max(250, Math.round((1500 + stage.locks * 240 + match.players[0].tools * 50 - match.currentRound * 45) * route.multiplier * weeklyBoost))
      : Math.max(0, 300 - match.currentRound * 20);
    if (Number(entry.score) !== stageScore) throw new Error('Weekly stage score is invalid');
    score += stageScore;
    rounds += match.currentRound;
    carryTools = won ? Math.min(2, match.players[0].tools) : 0;
    if (!won) {
      lives -= 1;
      if (lives <= 0 && attemptIndex < proof.path.length - 1) throw new Error('Weekly replay continued after all lives were spent');
    }
    previousEntry = entry;
    if (won) stageIndex += 1;
  });

  if (stageIndex !== STAGES.length || previousEntry?.won !== true) throw new Error('Weekly proof did not clear all vaults');
  if (Number(proof.score) !== score || Number(proof.rounds) !== rounds || proof.result !== 'complete') throw new Error('Weekly proof summary is invalid');
  return { score, rounds };
}

function validateStageProof(entry, proof, challenge, stage, route, heat, carryTools, contraband, attemptIndex) {
  const replay = entry.replayProof;
  if (!replay || replay.version !== 2 || replay.seed !== `${challenge.seed}:${stage.id}:${attemptIndex}` || replay.gameId !== `${challenge.id}-${stage.id}-${attemptIndex}`) throw new Error('Weekly replay identity is invalid');
  if (!Array.isArray(replay.players) || replay.players.length !== 4 || replay.players.some((player) => Number(player.locksCracked) !== 0)) throw new Error('Weekly opening table is invalid');
  const pickBonus = contraband.filter((id) => id === 'tension-ratchet').length * 6;
  const searchBonus = contraband.filter((id) => id === 'whisper-lens').length * 8;
  const toolBonus = contraband.filter((id) => id === 'false-bottom').length;
  const cooldownBonus = contraband.filter((id) => id === 'insulated-line').length;
  const expectedPick = 40 + pickBonus + (entry.routeId === 'hot-entry' ? 12 : 0) - (entry.routeId === 'ghost-route' ? 5 : 0) - (challenge.modifier === 'Hot Locks' ? 5 : 0);
  const expectedSearch = 60 + searchBonus + (challenge.modifier === 'Searchlight' ? 10 : 0) - (entry.routeId === 'inside-route' ? 10 : 0);
  const expectedCooldown = challenge.modifier === 'Loose Wires' ? 0 : (entry.routeId === 'ghost-route' ? 2 : 1) + cooldownBonus + (challenge.modifier === 'Long Fuse' ? 1 : 0);
  const rules = replay.rules || {};
  const expectedRules = { totalLocks: stage.locks, maxTools: 5, pickBaseChance: expectedPick, pickToolBonus: 15, pickChanceCap: 95, catchUpBonusPerLock: 6, catchUpBonusCap: 18, catchUpDoublePickGap: challenge.modifier === 'Brittle Seams' ? 1 : 2, searchChance: expectedSearch, stunnedSearchChance: 30, sabotageCooldownRounds: expectedCooldown, roundTimeoutSeconds: 90 };
  Object.entries(expectedRules).forEach(([key, value]) => {
    if (Number(rules[key]) !== value) throw new Error(`Weekly rule ${key} is invalid`);
  });
  const rivalTools = heat >= 2 ? 1 : 0;
  const routeTool = entry.routeId === 'hot-entry' ? 1 : 0;
  const expectedPlayerTools = Math.min(5, carryTools + toolBonus + (entry.routeId === 'inside-route' ? 1 : 0));
  if (Number(replay.players[0].tools) !== expectedPlayerTools || replay.players[0].gadget !== proof.gadget) throw new Error('Weekly operator loadout is invalid');
  if (replay.players.slice(1).some((player) => Number(player.tools) !== Math.min(5, rivalTools + routeTool))) throw new Error('Weekly rival loadout is invalid');
}

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function contrabandOffers(seed, stageId, pathLength) {
  const start = hashString(`${seed}:${stageId}:${pathLength}`) % CONTRABAND.length;
  return [0, 2, 5].map((offset) => CONTRABAND[(start + offset) % CONTRABAND.length]);
}

export function resetWeeklyVaultScores() {
  submissions.clear();
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getIsoWeek,
  getWeeklyVaultBoard,
  resetWeeklyVaultScores,
  submitWeeklyVaultScore,
  weeklyChallengeForDate,
} from '../weekly-challenge.mjs';
import { SIM_ACTION, createInitialSimulation, resolveSimulationRound } from '../../app/src/lib/plundrixEngine.js';
import { buildReplayProof } from '../../app/src/lib/replayDirector.js';

const NOW = new Date('2026-09-06T12:00:00.000Z');

const CONTRABAND = ['tension-ratchet', 'whisper-lens', 'false-bottom', 'cooling-vial', 'spare-alibi', 'insulated-line'];

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function exactWeeklyEntry(challenge) {
  const runId = 'vr-test-run-001';
  const stages = [{ id: 'outer-ring', locks: 3 }, { id: 'signal-gallery', locks: 4 }, { id: 'crown-vault', locks: 5 }];
  let contraband = [];
  let carryTools = challenge.modifier === 'Deep Pockets' ? 1 : 0;
  let score = 0;
  let rounds = 0;
  const path = stages.map((stage, attemptIndex) => {
    const pickBonus = contraband.filter((id) => id === 'tension-ratchet').length * 6;
    const searchBonus = contraband.filter((id) => id === 'whisper-lens').length * 8;
    const toolBonus = contraband.filter((id) => id === 'false-bottom').length;
    const cooldownBonus = contraband.filter((id) => id === 'insulated-line').length;
    let match = createInitialSimulation({
      seed: `${challenge.seed}:${stage.id}:${attemptIndex}`,
      gameId: `${challenge.id}-${stage.id}-${attemptIndex}`,
      playerCount: 4,
      names: ['Operator', 'Rook', 'Mara', 'Vesper'],
      gadgets: ['precision-kit', 'firewall', 'signal-scanner', 'precision-kit'],
      playerPatches: [{ tools: Math.min(5, carryTools + toolBonus + 1) }, { tools: 0 }, { tools: 0 }, { tools: 0 }],
      rules: {
        totalLocks: stage.locks,
        pickBaseChance: 40 + pickBonus - (challenge.modifier === 'Hot Locks' ? 5 : 0),
        searchChance: 50 + searchBonus,
        sabotageCooldownRounds: challenge.modifier === 'Loose Wires' ? 0 : 1 + cooldownBonus,
        roundTimeoutSeconds: 90,
      },
    });
    for (let round = 0; round < 100 && match.state === 'ACTIVE'; round += 1) {
      match = resolveSimulationRound(match, { 'player-1': { action: SIM_ACTION.PICK } });
    }
    assert.equal(match.winner, 'player-1');
    const stageScore = Math.max(250, Math.round((1500 + stage.locks * 240 + match.players[0].tools * 50 - match.currentRound * 45) * 1.05 * (challenge.modifier === 'Hot Locks' ? 1.1 : 1)));
    const entry = { stageId: stage.id, routeId: 'inside-route', won: true, rounds: match.currentRound, score: stageScore, contrabandBefore: [...contraband], heatAtStart: 0, replayProof: buildReplayProof(match) };
    score += stageScore;
    rounds += match.currentRound;
    carryTools = Math.min(2, match.players[0].tools);
    if (attemptIndex < stages.length - 1) {
      const start = hashString(`${challenge.seed}:${stage.id}:${attemptIndex}`) % CONTRABAND.length;
      contraband = [...contraband, CONTRABAND[start]];
    }
    return entry;
  });
  const proof = { version: 1, challengeId: challenge.id, runId, seed: challenge.seed, modifier: challenge.modifier, gadget: 'precision-kit', result: 'complete', score, rounds, path };
  return { challengeId: challenge.id, runId, alias: 'Brass Fox', score, rounds, result: 'complete', proof };
}

test('weekly challenge is deterministic across the same ISO week', () => {
  assert.deepEqual(getIsoWeek(NOW), getIsoWeek(new Date('2026-09-02T02:00:00.000Z')));
  assert.deepEqual(weeklyChallengeForDate(NOW), weeklyChallengeForDate(new Date('2026-09-02T02:00:00.000Z')));
});

test('weekly board accepts a bounded completed score and sorts it', () => {
  resetWeeklyVaultScores();
  const challenge = weeklyChallengeForDate(NOW);
  const entry = exactWeeklyEntry(challenge);
  const board = submitWeeklyVaultScore(entry, NOW);
  assert.equal(board.scores.find((score) => score.runId === entry.runId).verified, 'exact-replay');
  assert.equal(board.verification, 'exact-replay-verified');
  assert.throws(() => submitWeeklyVaultScore(entry, NOW), /already submitted/);
});

test('weekly board rejects unsafe or impossible submissions', () => {
  resetWeeklyVaultScores();
  const challenge = weeklyChallengeForDate(NOW);
  const unknownGadget = exactWeeklyEntry(challenge);
  unknownGadget.proof.gadget = 'unlisted-lockpick';
  unknownGadget.proof.path.forEach((entry) => { entry.replayProof.players[0].gadget = 'unlisted-lockpick'; });
  assert.throws(() => submitWeeklyVaultScore({ challengeId: challenge.id, runId: 'short', alias: '<script>', score: 1_000_001, rounds: 0, result: 'loss' }, NOW));
  assert.throws(() => submitWeeklyVaultScore({ challengeId: challenge.id, runId: 'vr-no-proof-001', alias: 'No Proof', score: 5000, rounds: 12, result: 'complete' }, NOW), /proof/);
  assert.throws(() => submitWeeklyVaultScore(unknownGadget, NOW), /gadget/);
  assert.equal(getWeeklyVaultBoard(NOW).scores.length, 3);
});

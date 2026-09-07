import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getIsoWeek,
  getWeeklyVaultBoard,
  resetWeeklyVaultScores,
  submitWeeklyVaultScore,
  weeklyChallengeForDate,
} from '../weekly-challenge.mjs';

const NOW = new Date('2026-09-06T12:00:00.000Z');

test('weekly challenge is deterministic across the same ISO week', () => {
  assert.deepEqual(getIsoWeek(NOW), getIsoWeek(new Date('2026-09-02T02:00:00.000Z')));
  assert.deepEqual(weeklyChallengeForDate(NOW), weeklyChallengeForDate(new Date('2026-09-02T02:00:00.000Z')));
});

test('weekly board accepts a bounded completed score and sorts it', () => {
  resetWeeklyVaultScores();
  const challenge = weeklyChallengeForDate(NOW);
  const board = submitWeeklyVaultScore({
    challengeId: challenge.id,
    runId: 'vr-test-run-001',
    alias: 'Brass Fox',
    score: 7000,
    rounds: 12,
    result: 'complete',
  }, NOW);
  assert.equal(board.scores[0].alias, 'Brass Fox');
  assert.equal(board.verification, 'practice-self-reported');
  assert.throws(() => submitWeeklyVaultScore({ challengeId: challenge.id, runId: 'vr-test-run-001', alias: 'Brass Fox', score: 7000, rounds: 12, result: 'complete' }, NOW), /already submitted/);
});

test('weekly board rejects unsafe or impossible submissions', () => {
  resetWeeklyVaultScores();
  const challenge = weeklyChallengeForDate(NOW);
  assert.throws(() => submitWeeklyVaultScore({ challengeId: challenge.id, runId: 'short', alias: '<script>', score: 1_000_001, rounds: 0, result: 'loss' }, NOW));
  assert.equal(getWeeklyVaultBoard(NOW).scores.length, 3);
});

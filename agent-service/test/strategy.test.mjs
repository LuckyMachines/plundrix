import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAvailableActions, recommendAction } from '../strategy.mjs';

function makeSnapshot(overrides = {}) {
  return {
    gameId: 1,
    paused: false,
    allActionsSubmitted: false,
    constants: {
      totalLocks: 5,
      maxTools: 5,
      maxGamePlayers: 4,
      minGamePlayers: 2,
      roundTimeout: 300,
    },
    automation: {
      autoResolveEnabled: false,
      autoResolveDelay: 300,
      requireExternalEntropy: false,
    },
    game: {
      state: 'ACTIVE',
      stateCode: 1,
      currentRound: 2,
      playerCount: 2,
      roundStartTime: 1000,
      roundEndsAt: 1300,
      winner: '0x0000000000000000000000000000000000000000',
    },
    players: [
      {
        index: 1,
        address: '0x1111111111111111111111111111111111111111',
        locksCracked: 0,
        tools: 0,
        stunned: false,
        registered: true,
        actionSubmitted: false,
      },
      {
        index: 2,
        address: '0x2222222222222222222222222222222222222222',
        locksCracked: 0,
        tools: 0,
        stunned: false,
        registered: true,
        actionSubmitted: false,
      },
    ],
    ...overrides,
  };
}

test('buildAvailableActions exposes gameplay actions for ready player', () => {
  const snapshot = makeSnapshot();
  const availableActions = buildAvailableActions(
    snapshot,
    '0x1111111111111111111111111111111111111111',
    1100
  );

  assert.equal(availableActions.status, 'ready');
  assert.equal(availableActions.canSubmitAction, true);
  assert.deepEqual(availableActions.availableActions, ['PICK', 'SEARCH', 'SABOTAGE']);
  assert.deepEqual(availableActions.sabotageTargets, [
    '0x2222222222222222222222222222222222222222',
  ]);
});

test('buildAvailableActions allows round resolution after timeout', () => {
  const snapshot = makeSnapshot();
  const availableActions = buildAvailableActions(
    snapshot,
    '0x1111111111111111111111111111111111111111',
    1400
  );

  assert.equal(availableActions.canResolveRound, true);
});

test('recommendAction searches when pick odds are weak', () => {
  const snapshot = makeSnapshot();
  const recommendation = recommendAction(
    snapshot,
    '0x1111111111111111111111111111111111111111',
    1100
  );

  assert.equal(recommendation.actionable, true);
  assert.equal(recommendation.action, 'SEARCH');
});

test('recommendAction sabotages a rival on match point', () => {
  const snapshot = makeSnapshot({
    players: [
      {
        index: 1,
        address: '0x1111111111111111111111111111111111111111',
        locksCracked: 2,
        tools: 1,
        stunned: false,
        registered: true,
        actionSubmitted: false,
      },
      {
        index: 2,
        address: '0x2222222222222222222222222222222222222222',
        locksCracked: 4,
        tools: 2,
        stunned: false,
        registered: true,
        actionSubmitted: false,
      },
    ],
  });

  const recommendation = recommendAction(
    snapshot,
    '0x1111111111111111111111111111111111111111',
    1100
  );

  assert.equal(recommendation.action, 'SABOTAGE');
  assert.equal(
    recommendation.target,
    '0x2222222222222222222222222222222222222222'
  );
});

test('recommendAction blocks when player already submitted', () => {
  const snapshot = makeSnapshot({
    players: [
      {
        index: 1,
        address: '0x1111111111111111111111111111111111111111',
        locksCracked: 2,
        tools: 2,
        stunned: false,
        registered: true,
        actionSubmitted: true,
      },
      {
        index: 2,
        address: '0x2222222222222222222222222222222222222222',
        locksCracked: 1,
        tools: 0,
        stunned: false,
        registered: true,
        actionSubmitted: false,
      },
    ],
  });

  const recommendation = recommendAction(
    snapshot,
    '0x1111111111111111111111111111111111111111',
    1100
  );

  assert.equal(recommendation.actionable, false);
  assert.equal(recommendation.action, null);
});

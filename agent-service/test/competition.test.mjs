import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompetitionIndexFromGames,
  classifyQueue,
  derivePointsForSession,
} from '../competition.mjs';

test('classifyQueue distinguishes open, mixed, and agent ladder sessions', () => {
  assert.equal(
    classifyQueue([
      { type: 'human' },
      { type: 'human' },
    ]),
    'open'
  );
  assert.equal(
    classifyQueue([
      { type: 'human' },
      { type: 'agent' },
    ]),
    'mixed'
  );
  assert.equal(
    classifyQueue([
      { type: 'agent' },
      { type: 'bot' },
    ]),
    'agent_ladder'
  );
});

test('derivePointsForSession rewards wins, locks, sabotages, and clean play', () => {
  const points = derivePointsForSession(
    {
      state: 'COMPLETE',
      queue: 'agent_ladder',
      winner: '0x1000000000000000000000000000000000000001',
    },
    {
      address: '0x1000000000000000000000000000000000000001',
      locksCracked: 3,
      toolsFound: 2,
      sabotages: 1,
      noSubmissions: 0,
    }
  );

  assert.equal(points, 12 + 42 + 6 + 6 + 90 + 10 + 8);
});

test('buildCompetitionIndexFromGames produces leaderboard, badges, and agent ladder', () => {
  const registry = {
    profiles: [
      {
        address: '0x1000000000000000000000000000000000000001',
        displayName: 'Captain Lock',
        type: 'human',
        team: null,
        bio: null,
        labels: [],
      },
      {
        address: '0x2000000000000000000000000000000000000002',
        displayName: 'VaultBot',
        type: 'agent',
        team: 'Lucky Machines',
        bio: null,
        labels: ['bot'],
      },
    ],
  };

  const sessions = [
    {
      gameId: 11,
      state: 'COMPLETE',
      queue: 'open',
      season: {
        id: 'season-2',
      },
      createdAt: 1739000000,
      startedAt: 1739000100,
      completedAt: 1739000600,
      winner: '0x1000000000000000000000000000000000000001',
      players: [
        {
          address: '0x1000000000000000000000000000000000000001',
          displayName: 'Captain Lock',
          type: 'human',
          points: 120,
          locksCracked: 4,
          toolsFound: 2,
          sabotages: 1,
          stunsReceived: 0,
          noSubmissions: 0,
        },
        {
          address: '0x3000000000000000000000000000000000000003',
          displayName: 'Rival',
          type: 'human',
          points: 35,
          locksCracked: 1,
          toolsFound: 1,
          sabotages: 0,
          stunsReceived: 1,
          noSubmissions: 1,
        },
      ],
    },
    {
      gameId: 12,
      state: 'COMPLETE',
      queue: 'agent_ladder',
      season: {
        id: 'season-2',
      },
      createdAt: 1739001000,
      startedAt: 1739001100,
      completedAt: 1739001800,
      winner: '0x2000000000000000000000000000000000000002',
      players: [
        {
          address: '0x2000000000000000000000000000000000000002',
          displayName: 'VaultBot',
          type: 'agent',
          points: 138,
          locksCracked: 3,
          toolsFound: 2,
          sabotages: 2,
          stunsReceived: 0,
          noSubmissions: 0,
        },
        {
          address: '0x4000000000000000000000000000000000000004',
          displayName: 'Crawler',
          type: 'bot',
          points: 61,
          locksCracked: 2,
          toolsFound: 1,
          sabotages: 1,
          stunsReceived: 2,
          noSubmissions: 0,
        },
      ],
    },
  ];

  const index = buildCompetitionIndexFromGames(sessions, registry, 1739002000);

  assert.equal(index.leaderboard[0].displayName, 'VaultBot');
  assert.equal(index.leaderboard[1].displayName, 'Captain Lock');
  assert.equal(index.agentLadder[0].displayName, 'VaultBot');

  const captain = index.profiles.find(
    (profile) =>
      profile.address === '0x1000000000000000000000000000000000000001'
  );
  assert.ok(captain.badges.find((badge) => badge.id === 'first-win'));

  const vaultBot = index.profiles.find(
    (profile) =>
      profile.address === '0x2000000000000000000000000000000000000002'
  );
  assert.equal(vaultBot.type, 'agent');
  assert.equal(vaultBot.season.ladderWins, 1);
});

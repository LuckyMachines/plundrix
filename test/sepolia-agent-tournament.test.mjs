import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTION,
  TOURNAMENT_AGENTS,
  buildTournamentSchedule,
  chooseAgentAction,
  summarizeTournament,
} from '../ops/sepolia-agent-tournament-lib.mjs';

const state = (self = {}, opponent = {}, round = 1) => ({
  self: { locks: 0, tools: 0, stunned: false, ...self },
  opponent: { locks: 0, tools: 0, stunned: false, ...opponent },
  round,
});

test('buildTournamentSchedule creates 50 balanced round-robin games', () => {
  const schedule = buildTournamentSchedule(5);
  assert.equal(schedule.length, 50);
  for (const agent of TOURNAMENT_AGENTS) {
    assert.equal(schedule.filter((game) => game.seatA === agent.id || game.seatB === agent.id).length, 20);
    assert.equal(schedule.filter((game) => game.seatA === agent.id).length, 10);
  }
  assert.equal(new Set(schedule.map(({ pairing }) => pairing)).size, 10);
});

test('agents expose materially different decisions', () => {
  assert.equal(chooseAgentAction('lock-rusher', state()).action, ACTION.PICK);
  assert.equal(chooseAgentAction('tool-hoarder', state()).action, ACTION.SEARCH);
  assert.equal(chooseAgentAction('leader-hunter', state({}, { locks: 4 })).action, ACTION.SABOTAGE);
  assert.equal(chooseAgentAction('saboteur', state({}, { tools: 2 })).action, ACTION.SABOTAGE);
  assert.equal(chooseAgentAction('adaptive', state({ tools: 2 })).action, ACTION.PICK);
});

test('closing policies prevent permanent disruption loops', () => {
  assert.equal(chooseAgentAction('saboteur', state({ tools: 1 }, { tools: 2 }, 12)).action, ACTION.PICK);
  assert.equal(chooseAgentAction('tool-hoarder', state({ locks: 4, tools: 3 })).action, ACTION.PICK);
});

test('summarizeTournament computes wins and action totals', () => {
  const summary = summarizeTournament({ games: [{
    status: 'complete',
    roundCount: 1,
    winnerAgentId: 'adaptive',
    seatA: { agentId: 'adaptive' },
    seatB: { agentId: 'lock-rusher' },
    rounds: [{ seatA: { actionName: 'SEARCH' }, seatB: { actionName: 'PICK' } }],
  }] });
  assert.equal(summary[0].id, 'adaptive');
  assert.equal(summary[0].wins, 1);
  assert.equal(summary[0].actions.SEARCH, 1);
});

import assert from 'node:assert/strict';
import { buildOutcomeNarrative } from '../src/lib/outcomeNarrative.js';
import { performanceBucket, performanceRating } from '../src/lib/performanceTelemetry.js';
import { SIM_ACTION, SIM_OUTCOME_REASON } from '../src/lib/plundrixEngine.js';
import { buildReplayCardModel } from '../src/lib/replayShareCard.js';

const players = [
  { id: 'player-1', name: 'Operator' },
  { id: 'player-2', name: 'Rook' },
];

const picked = buildOutcomeNarrative({
  actor: 'player-1', action: SIM_ACTION.PICK, success: true, chance: 58,
  locksBefore: 1, locksCracked: 3, toolsBefore: 2, tools: 2,
}, { players, totalLocks: 5 });
assert.equal(picked.headline, 'You cracked 2 locks.');
assert.equal(picked.cause, 'Pick landed at 58% odds.');
assert.equal(picked.consequence, '1 -> 3 of 5 locks open.');

const searched = buildOutcomeNarrative({
  actor: 'player-1', action: 'SEARCH', success: true, chance: 70,
  locksCracked: 0, toolsBefore: 0, tools: 2,
}, { players });
assert.equal(searched.headline, 'You found 2 tools.');
assert.match(searched.consequence, /Pick gains up to 30 points/);

const sabotaged = buildOutcomeNarrative({
  actor: 'player-1', target: 'player-2', action: SIM_ACTION.SABOTAGE, success: true,
  reason: SIM_OUTCOME_REASON.SABOTAGE_SUCCESS_STEAL, toolsBefore: 0, tools: 1,
}, { players });
assert.equal(sabotaged.headline, 'You stunned Rook.');
assert.match(sabotaged.cause, /stole one tool/);

const managedFailure = buildOutcomeNarrative({
  actor: 'player-1', action: 'pick', success: false, reasonCode: 2,
  locksCracked: 2, tools: 1,
}, { players });
assert.match(managedFailure.headline, /while stunned/);
assert.match(managedFailure.consequence, /2 of 5/);

assert.equal(performanceRating('lcp', 2499), 'good');
assert.equal(performanceRating('lcp', 2501), 'needs-improvement');
assert.equal(performanceRating('inp', 501), 'poor');
assert.equal(performanceRating('cls', 0.1), 'good');
assert.equal(performanceBucket('lcp', 4200), '4s+');
assert.equal(performanceBucket('inp', 180), '101-200ms');
assert.equal(performanceBucket('cls', 0.2), '.11-.25');

assert.deepEqual(buildReplayCardModel({
  id: 'test', title: 'The quiet breach', subtitle: 'Rook blinked', description: 'A real operation.',
  summary: { winnerName: 'Operator', rounds: 7 }, dramaticScore: 84.26,
  highlights: [{ socialLabel: 'Last-lock reversal', description: 'Search became a final double breach.' }],
}), {
  title: 'The quiet breach', subtitle: 'Last-lock reversal', winner: 'Operator', rounds: 7,
  score: 84.3, moment: 'Search became a final double breach.',
});

console.log('Player experience tests passed');

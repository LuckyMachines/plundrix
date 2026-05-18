import assert from 'node:assert/strict';
import {
  buildFunProof,
  buildFunTelemetry,
  buildMomentTags,
  deriveOperatorReaction,
  deriveTableMood,
  deriveVaultReaction,
  getActionIdentity,
  getFlavorLine,
  getMomentTag,
  scoreFunTelemetry,
} from '../src/lib/funSystems.js';

const baseState = {
  state: 'ACTIVE',
  currentRound: 3,
  rules: { totalLocks: 5 },
  players: [
    { id: 'player-1', locksCracked: 1, tools: 2 },
    { id: 'player-2', locksCracked: 4, tools: 0 },
  ],
  events: [],
  roundHistory: [{}, {}, {}],
};

assert.equal(getActionIdentity(1).id, 'pick');
assert.equal(getActionIdentity('search').role, 'Preparation');
assert.equal(getActionIdentity('sabotage').role, 'Drama');
assert.equal(getActionIdentity('committed').id, 'committed');

assert.equal(deriveTableMood(baseState).id, 'final-lock');
assert.equal(deriveTableMood({ ...baseState, winner: 'player-2' }).id, 'victory');
assert.equal(deriveTableMood({
  ...baseState,
  players: [{ locksCracked: 1 }, { locksCracked: 2 }],
  latestRoundEvents: [
    { name: 'PlayerSabotaged' },
    { name: 'PlayerSabotaged' },
    { name: 'ToolFound' },
    { name: 'LockCracked' },
  ],
}).id, 'chaos');
assert.equal(deriveTableMood({ currentRound: 1, events: [] }).id, 'calm');

assert.equal(deriveVaultReaction({ locksCracked: 4, rules: { totalLocks: 5 } }).id, 'almost-open');
assert.equal(deriveVaultReaction({ latestEvent: { name: 'LockCracked' } }).id, 'cracking');
assert.equal(deriveVaultReaction({ actionIntent: 'sabotage' }).id, 'angry');
assert.equal(deriveVaultReaction({ actionIntent: 'pick' }).id, 'resisting');
assert.equal(deriveVaultReaction({ state: 'COMPLETE' }).id, 'breached');

assert.equal(deriveOperatorReaction({ locksCracked: 5, totalLocks: 5 }).id, 'finished');
assert.equal(deriveOperatorReaction({ stunned: true }).id, 'stunned');
assert.equal(deriveOperatorReaction({ locksCracked: 4, totalLocks: 5 }).id, 'threatening');
assert.equal(deriveOperatorReaction({ tools: 2 }).id, 'armed');
assert.equal(deriveOperatorReaction({ targeted: true }).id, 'marked');
assert.equal(deriveOperatorReaction({ actionSubmitted: true }).id, 'committed');

assert.equal(getMomentTag({ name: 'GameWon', args: { winner: '0x1' } }).id, 'clean-breach');
assert.equal(getMomentTag({ type: 'LockCracked', locksCracked: 4 }, { totalLocks: 5 }).id, 'final-lock');
assert.equal(getMomentTag({ type: 'ToolFound', tools: 2 }).id, 'tool-spike');
assert.ok(buildMomentTags([
  { type: 'PlayerSabotaged' },
  { type: 'ActionOutcome', action: 1, success: false },
]).some((tag) => tag.id === 'near-miss'));

const flavorA = getFlavorLine('final-lock', { seed: 'same', round: 5 });
const flavorB = getFlavorLine('final-lock', { seed: 'same', round: 5 });
assert.equal(flavorA, flavorB);

const funEvents = [
  { type: 'ActionOutcome', action: 1, success: true },
  { type: 'LockCracked', locksCracked: 1 },
  { type: 'ActionOutcome', action: 2, success: true },
  { type: 'ToolFound', tools: 2 },
  { type: 'PlayerSabotaged' },
  { type: 'ActionOutcome', action: 3, success: true, reason: 'SABOTAGE_SUCCESS_STEAL' },
  { type: 'ActionOutcome', action: 1, success: false, reason: 'PICK_FAILED_ROLL' },
  { type: 'LockCracked', locksCracked: 4 },
  { type: 'GameWon' },
];
const telemetry = buildFunTelemetry({
  events: funEvents,
  rounds: 9,
  nearWinMoments: 1,
  leadChanges: 2,
  comeback: true,
});
assert.equal(telemetry.actionKinds, 3);
assert.equal(telemetry.actions.pick, 2);
assert.equal(telemetry.actions.search, 1);
assert.equal(telemetry.actions.sabotage, 1);

const score = scoreFunTelemetry(telemetry);
assert.ok(score.score >= 70);
assert.ok(score.dimensions.variety >= 90);

const proof = buildFunProof({ funTelemetry: telemetry, funScore: score });
assert.ok(proof.summary.includes('/100'));
assert.ok(proof.strongestTags.length > 0);

console.log(`Fun systems tests passed with ${score.score}/100 fun score.`);

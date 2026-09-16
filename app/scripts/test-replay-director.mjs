import assert from 'node:assert/strict';
import {
  buildPairedReplayComparison,
  buildReplayCapturePlan,
  buildReplayFromSeed,
  buildReplayTimeline,
  exportReplayCsv,
  exportReplayJson,
  exportReplayMarkdown,
  loadReplayFromSearch,
  parseReplayPayload,
  scoreReplayDrama,
  selectDefiningMoment,
  validateReplay,
} from '../src/lib/replayDirector.js';
import { runSimulation } from '../src/lib/plundrixEngine.js';

const replay = buildReplayFromSeed({
  seed: 'replay-test',
  scenarioId: 'comeback-test',
  maxRounds: 18,
});

validateReplay(replay);
assert.ok(replay.timeline.length > 0, 'timeline created');
assert.ok(replay.highlights.length > 0, 'highlights created');
assert.ok(replay.dramaticScore >= 0, 'dramatic score created');
assert.ok(replay.funScore.score >= 0, 'fun score created');
assert.ok(replay.momentTags.length > 0, 'moment tags created');
assert.ok(replay.definingMoment?.text, 'one truthful defining moment created');
assert.notEqual(replay.definingMoment?.type, 'finalRound', 'a distinctive event outranks the generic finish when available');
if (replay.definingMoment?.type === 'clutchPick') assert.match(replay.definingMoment.text, /final lock and breached the vault/);
assert.ok(replay.shareUrl.includes('replay='), 'share url encodes replay');

const payload = parseReplayPayload(replay.shareUrl.slice(replay.shareUrl.indexOf('?')));
assert.equal(payload.seed, replay.seed);
assert.equal(payload.scenarioId, replay.scenarioId);
assert.equal(payload.version, 2, 'share payload uses exact replay proof');
assert.equal(payload.rounds.length, replay.summary.rounds, 'share payload preserves every round');
const sharedReplay = loadReplayFromSearch(replay.shareUrl.slice(replay.shareUrl.indexOf('?')));
assert.equal(sharedReplay.summary.winner, replay.summary.winner, 'shared proof preserves winner');
assert.equal(sharedReplay.timeline.length, replay.timeline.length, 'shared proof preserves timeline');
assert.equal(loadReplayFromSearch('?replay=not-valid-base64'), null, 'invalid shared proof fails closed');

const state = runSimulation({ seed: 'timeline-test', scenarioId: 'new-player-table', maxRounds: 12 });
const timeline = buildReplayTimeline(state);
assert.ok(timeline.every((item) => item.round >= 1), 'timeline rounds valid');
assert.equal(typeof scoreReplayDrama(state, timeline), 'number');
assert.deepEqual(selectDefiningMoment([
  { type: 'finalRound', round: 8, replayLabel: 'Final round', socialLabel: 'Final vault crack', text: 'Operator won.' },
  { type: 'sabotageSwing', round: 5, replayLabel: 'Sabotage swing', socialLabel: 'Sabotage changes everything', text: 'Rook stole the leader\'s tool.' },
]), {
  type: 'sabotageSwing', round: 5, label: 'Sabotage swing', socialLabel: 'Sabotage changes everything', text: 'Rook stole the leader\'s tool.',
});

const markdown = exportReplayMarkdown(replay);
const json = exportReplayJson(replay);
const csv = exportReplayCsv(replay);
assert.ok(markdown.includes('# '), 'markdown title');
assert.ok(JSON.parse(json).id, 'json export');
assert.ok(csv.includes('id,title,score'), 'csv header');

const capturePlan = buildReplayCapturePlan({
  id: replay.id,
  shareUrl: replay.shareUrl,
  highlights: replay.highlights,
  timeline: replay.timeline,
});
assert.ok(capturePlan.screenshots.length >= 2, 'capture plan screenshots');

const paired = buildPairedReplayComparison({
  seed: 'paired-test',
  scenarioId: 'new-player-table',
  games: 4,
  candidateRules: { totalLocks: 6, pickBaseChance: 35 },
});
assert.ok(paired.timelineComparison.length > 0, 'paired comparison timeline');

console.log('Replay Director tests passed');

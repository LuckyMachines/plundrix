import assert from 'node:assert/strict';
import {
  buildPairedReplayComparison,
  buildReplayCapturePlan,
  buildReplayFromSeed,
  buildReplayTimeline,
  exportReplayCsv,
  exportReplayJson,
  exportReplayMarkdown,
  parseReplayPayload,
  scoreReplayDrama,
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
assert.ok(replay.shareUrl.includes('replay='), 'share url encodes replay');

const payload = parseReplayPayload(replay.shareUrl.slice(replay.shareUrl.indexOf('?')));
assert.equal(payload.seed, replay.seed);
assert.equal(payload.scenarioId, replay.scenarioId);

const state = runSimulation({ seed: 'timeline-test', scenarioId: 'new-player-table', maxRounds: 12 });
const timeline = buildReplayTimeline(state);
assert.ok(timeline.every((item) => item.round >= 1), 'timeline rounds valid');
assert.equal(typeof scoreReplayDrama(state, timeline), 'number');

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

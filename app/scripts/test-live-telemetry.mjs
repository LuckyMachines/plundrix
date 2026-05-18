import assert from 'node:assert/strict';
import {
  buildLiveHealthReport,
  normalizeLiveEvent,
  summarizeLiveEvents,
} from '../src/lib/liveTelemetry.js';
import {
  analyzeLiveDataStatus,
  generateOracleReport,
} from '../src/lib/liveOpsOracle.js';

const events = [
  { type: 'GameCreated', gameId: 'game-1', timestamp: '2026-05-18T00:00:00.000Z' },
  { type: 'PlayerJoined', gameId: 'game-1', player: '0x1', timestamp: '2026-05-18T00:00:01.000Z' },
  { type: 'ActionSubmitted', gameId: 'game-1', round: 1, player: '0x1', action: 'search', timestamp: '2026-05-18T00:00:02.000Z' },
  { type: 'ToolFound', gameId: 'game-1', round: 1, player: '0x1', timestamp: '2026-05-18T00:00:03.000Z' },
  { type: 'ActionSubmitted', gameId: 'game-1', round: 2, player: '0x1', action: 'pick', timestamp: '2026-05-18T00:00:04.000Z' },
  { type: 'LockCracked', gameId: 'game-1', round: 2, player: '0x1', timestamp: '2026-05-18T00:00:05.000Z' },
  { type: 'GameWon', gameId: 'game-1', round: 2, player: '0x1', timestamp: '2026-05-18T00:00:06.000Z' },
  { type: 'ReplayGenerated', gameId: 'game-1', round: 2, timestamp: '2026-05-18T00:00:07.000Z' },
];

assert.equal(normalizeLiveEvent({ name: 'ActionSubmitted', args: { gameID: 4, action: 1 } }).action, 'pick');
const summary = summarizeLiveEvents(events);
assert.equal(summary.sessionsObserved, 1);
assert.equal(summary.completedGames, 1);
assert.equal(summary.actionCounts.search, 1);
assert.equal(summary.actionCounts.pick, 1);
assert.equal(summary.replayGenerated, 1);

const health = buildLiveHealthReport(events);
assert.equal(health.connected, true);
assert.ok(health.score > 50);

const liveStatus = analyzeLiveDataStatus({ liveEvents: events });
assert.equal(liveStatus.connected, true);
assert.equal(liveStatus.retentionFunnel.available, true);

const oracle = generateOracleReport({
  seed: 'live-telemetry-test',
  files: {},
  packageJson: { scripts: {} },
  liveEvents: events,
});
assert.equal(oracle.liveDataStatus.connected, true);
assert.ok(!oracle.risks.some((risk) => risk.id === 'risk-live-data'));

console.log('Live telemetry tests passed');

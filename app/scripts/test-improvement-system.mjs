import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  activateExperiment,
  archiveExpiredExperiments,
  attachExperimentEvidence,
  buildImprovementSnapshot,
  decideExperiment,
  evidenceIsValid,
  exportImprovementMarkdown,
  importObservedSessions,
  importMetricBundle,
  recordMetricMeasurement,
  tierMeets,
  validateImprovementLedger,
} from '../src/lib/improvementLoop.js';
import { latencyBucket } from '../src/lib/analytics.js';
import { normalizeObservation, summarizeObservations } from '../src/lib/observationStore.js';
import { createLocalProfile, markProfilePlayed, playerCohort } from '../src/lib/playerCareer.js';

const ledger = JSON.parse(await readFile(resolve('improvement', 'ledger.json'), 'utf8'));
const fixedNow = '2026-09-08T00:00:00.000Z';

assert.equal(validateImprovementLedger(ledger).ok, true);
assert.equal(ledger.experiments.filter((item) => item.status === 'active').length, 1);
assert.equal(tierMeets('T3', 'T2'), true);
assert.equal(tierMeets('T1', 'T3'), false);
assert.equal(evidenceIsValid({ tier: 'T3', source: 'playtest', capturedAt: fixedNow }), false);
assert.equal(evidenceIsValid({ tier: 'T3', source: 'playtest', capturedAt: fixedNow, humanVerified: true }), true);
assert.equal(evidenceIsValid({ tier: 'T4', source: 'analytics', capturedAt: fixedNow, production: false }), false);
assert.equal(latencyBucket(29_000), '0-30s');
assert.equal(latencyBucket(61_000), '61-120s');

const normalizedObservation = normalizeObservation({ observerConfirmed: true, understoodWhy: true, joyScore: 9, secondsToFirstAction: 42 });
assert.equal(normalizedObservation.joyScore, 5);
assert.equal(normalizedObservation.understoodWhy, true);
const observationSummary = summarizeObservations([normalizedObservation]);
assert.equal(observationSummary.whyRate, 100);
assert.equal(observationSummary.averageJoy, 5);
const firstProfile = markProfilePlayed(createLocalProfile(), '2026-09-01T00:00:00.000Z');
assert.equal(playerCohort(firstProfile, '2026-09-01T00:00:00.000Z'), 'new');
assert.equal(playerCohort({ ...firstProfile, games: 1 }, '2026-09-08T00:00:00.000Z'), 'returning-7d');

let next = activateExperiment(ledger, 'production-funnel-baseline', fixedNow);
assert.equal(next.experiments.find((item) => item.id === 'production-funnel-baseline').status, 'active');
assert.equal(next.experiments.find((item) => item.id === 'first-run-comprehension').status, 'paused');

next = recordMetricMeasurement(next, 'first-operation-completion', {
  tier: 'T4',
  source: 'plausible-production',
  capturedAt: fixedNow,
  production: true,
  value: 72,
  sampleSize: 40,
});
next = attachExperimentEvidence(next, 'production-funnel-baseline', {
  tier: 'T4',
  source: 'plausible-production',
  capturedAt: fixedNow,
  production: true,
  summary: 'The first-operation funnel cleared its target.',
  sampleSize: 40,
});

let snapshot = buildImprovementSnapshot({ ledger: next, generatedAt: fixedNow, buildSha: 'abc123' });
assert.equal(snapshot.scorecard.find((item) => item.id === 'first-operation-completion').state, 'pass');
assert.match(snapshot.nextAction.action, /Decide/);

next = decideExperiment(next, 'production-funnel-baseline', { outcome: 'ship', reason: 'Completion exceeded the target.' }, fixedNow);
assert.equal(validateImprovementLedger(next).ok, true);
assert.equal(next.experiments.find((item) => item.id === 'production-funnel-baseline').decision.outcome, 'ship');

const observed = importObservedSessions(ledger, {
  records: Array.from({ length: 4 }, (_, index) => ({
    observerConfirmed: true,
    completedFirstAction: true,
    understoodGoal: index !== 3,
    understoodWhy: true,
    wantedReplay: index !== 3,
    secondsToFirstAction: 35 + index * 5,
  })),
}, { source: 'facilitated-test', capturedAt: fixedNow, humanVerified: true });
snapshot = buildImprovementSnapshot({ ledger: observed, generatedAt: fixedNow });
assert.equal(snapshot.scorecard.find((item) => item.id === 'first-action-completion').state, 'pass');
assert.equal(snapshot.scorecard.find((item) => item.id === 'goal-comprehension').state, 'fail');
assert.equal(snapshot.scorecard.find((item) => item.id === 'cause-comprehension').state, 'pass');
assert.throws(() => importObservedSessions(ledger, { records: [{ observerConfirmed: false }] }, { humanVerified: true }), /observerConfirmed/);

const productionMetrics = importMetricBundle(ledger, {
  evidenceTier: 'T4',
  production: true,
  source: 'aggregate-production-test',
  capturedAt: fixedNow,
  buildSha: 'abc123',
  rulesetId: 'rules-1',
  metrics: [{ id: 'client-error-rate', value: 1.5, sampleSize: 120 }],
}, { artifact: 'metrics.json', productionVerified: true });
snapshot = buildImprovementSnapshot({ ledger: productionMetrics, generatedAt: fixedNow });
assert.equal(snapshot.scorecard.find((item) => item.id === 'client-error-rate').state, 'pass');
assert.throws(() => importMetricBundle(ledger, { evidenceTier: 'T4', production: true, metrics: [{ id: 'client-error-rate', value: 1, sampleSize: 100 }] }), /--production/);

const staleLedger = {
  ...ledger,
  experiments: ledger.experiments.map((item) => item.id === 'return-loop-choice' ? { ...item, lastReviewedAt: '2026-01-01T00:00:00.000Z' } : item),
};
const archived = archiveExpiredExperiments(staleLedger, fixedNow);
assert.equal(archived.experiments.find((item) => item.id === 'return-loop-choice').status, 'archived');

const withChecks = buildImprovementSnapshot({
  ledger,
  generatedAt: fixedNow,
  checks: [{ id: 'build', label: 'Build', ok: true, durationMs: 5 }],
  runtimeMeasurements: [{
    metricId: 'automated-release-gates', tier: 'T2', source: 'test', capturedAt: fixedNow, sampleSize: 8, value: 100,
  }],
});
assert.equal(withChecks.scorecard.find((item) => item.id === 'automated-release-gates').state, 'pass');
assert.match(exportImprovementMarkdown(withChecks), /Do this next/);
assert.match(exportImprovementMarkdown(withChecks), /PASS Build/);

console.log('Improvement-system tests passed');

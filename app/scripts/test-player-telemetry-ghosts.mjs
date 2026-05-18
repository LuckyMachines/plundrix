import assert from 'node:assert/strict';
import {
  GHOST_ARCHETYPES,
  buildFocusedGhostValidation,
  buildGhostBalanceScore,
  buildGhostFairnessReport,
  buildGhostHighlights,
  buildGhostProfile,
  buildGhostReplayMetadata,
  exportGhostReportCsv,
  exportGhostReportJson,
  exportGhostReportMarkdown,
  exportGhostRosterJson,
  exportFocusedGhostValidationMarkdown,
  generateGhostRoster,
  ghostToSimulatorStrategy,
  ghostToStrategyProfile,
  importGhostRosterJson,
  inferGhostArchetype,
  runGhostBatch,
  runGhostMatch,
  validateGhostProfile,
  validateGhostReport,
  validateGhostRoster,
} from '../src/lib/playerTelemetryGhosts.js';

const profile = buildGhostProfile('reckless-picker', { seed: 'test', index: 0 });
validateGhostProfile(profile);
assert.equal(profile.archetypeId, 'reckless-picker');
assert.equal(ghostToSimulatorStrategy(profile), 'picker');
assert.ok(ghostToStrategyProfile(profile).aggression >= 0);
assert.equal(ghostToSimulatorStrategy(buildGhostProfile('tool-hoarder', { seed: 'test', index: 1 })), 'tool-hoarder');
assert.equal(ghostToSimulatorStrategy(buildGhostProfile('leader-hunter', { seed: 'test', index: 1 })), 'leader-hunter');

const rosterA = generateGhostRoster('deterministic', 4, { scenario: 'balanced-cast' });
const rosterB = generateGhostRoster('deterministic', 4, { scenario: 'balanced-cast' });
validateGhostRoster(rosterA);
assert.deepEqual(rosterA, rosterB, 'roster generation is deterministic');

const imported = importGhostRosterJson(exportGhostRosterJson(rosterA));
assert.deepEqual(imported, rosterA, 'roster import/export round trips');

const inferred = inferGhostArchetype({
  pickRate: 0.8,
  searchRate: 0.1,
  sabotageRate: 0.1,
  maxToolsHeld: 1,
  leaderTargetingRate: 0,
  comebackAttempts: 0,
  endgameAggression: 2,
});
assert.equal(inferred.id, GHOST_ARCHETYPES['reckless-picker'].id);

const match = runGhostMatch({
  scenario: 'balanced-cast',
  seed: 'ghost-test-match',
  roster: rosterA,
  maxRounds: 36,
});
assert.equal(match.behavior.length, rosterA.length);
assert.ok(match.summary.rounds > 0);
assert.ok(buildGhostReplayMetadata(match).archetypes.length > 0);
assert.ok(buildGhostHighlights(match).length > 0);

const report = runGhostBatch({
  scenario: 'balanced-cast',
  seed: 'ghost-test-batch',
  budget: 'smoke',
  games: 3,
  maxRounds: 36,
});
validateGhostReport(report);
assert.equal(report.games, 3);
assert.ok(report.archetypes.length > 0);
assert.ok(report.fairness.rows.length > 0);
assert.ok(report.fairness.overallScore >= 0);
assert.ok(report.matchups.length === 3);
assert.ok(report.recommendations.length > 0);
assert.ok(buildGhostBalanceScore(report).score >= 0);
assert.equal(buildGhostFairnessReport(report).rows.length, report.fairness.rows.length);
const focusedValidation = buildFocusedGhostValidation([report], 'tool-hoarder');
assert.equal(focusedValidation.archetypeId, 'tool-hoarder');
assert.ok(exportFocusedGhostValidationMarkdown(focusedValidation).includes('Tool Hoarder Focused Validation'));
assert.ok(exportGhostReportMarkdown(report).includes('# Plundrix Player Telemetry Ghosts'));
assert.ok(exportGhostReportMarkdown(report).includes('## Archetype Fairness'));
assert.ok(exportGhostReportJson(report).includes('"scenario"'));
assert.ok(exportGhostReportCsv(report).includes('fairnessScore'));

const tunedReport = runGhostBatch({
  scenario: 'balanced-cast',
  seed: 'ghost-test-tuned-rules',
  budget: 'smoke',
  games: 1,
  maxRounds: 36,
  rules: { totalLocks: 4, pickBaseChance: 45 },
});
assert.equal(tunedReport.matches[0].rules.totalLocks, 4);
assert.equal(tunedReport.matches[0].rules.pickBaseChance, 45);

console.log('Player Telemetry Ghosts tests passed');

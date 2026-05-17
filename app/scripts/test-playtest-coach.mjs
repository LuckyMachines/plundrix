import assert from 'node:assert/strict';
import {
  PLAYTEST_TEMPLATES,
  assignTesterRoles,
  buildFacilitatorScript,
  buildMissionFromGhostReport,
  buildMissionFromMutationReport,
  buildMissionFromReplay,
  buildObservationSheet,
  buildPassFailRubric,
  buildPlaytestMission,
  buildTesterBriefs,
  createSyntheticPlaytestSession,
  exportPlaytestBacklogCsv,
  exportPlaytestMissionJson,
  exportPlaytestMissionMarkdown,
  exportPlaytestReportMarkdown,
  generatePlaytestBacklog,
  generatePlaytestReport,
  hydrateMissionFromArtifact,
  scorePlaytestFeedback,
  selectMissionTemplate,
  summarizePlaytestSession,
  validatePlaytestMission,
  validatePlaytestReport,
  validatePlaytestSession,
} from '../src/lib/playtestCoach.js';
import { runGhostBatch } from '../src/lib/playerTelemetryGhosts.js';
import { generateMutationReport } from '../src/lib/ruleMutationTimeMachine.js';
import { buildReplayFromSeed } from '../src/lib/replayDirector.js';

const mutationReport = generateMutationReport({ seed: 'playtest-mutation-test', budget: 'smoke' });
assert.equal(selectMissionTemplate({ sourceType: 'mutation-report', artifact: mutationReport }).id, 'mutation-ab-playtest');

const ghostReport = runGhostBatch({ seed: 'playtest-ghost-test', budget: 'smoke', games: 3 });
assert.ok(selectMissionTemplate({ sourceType: 'ghost-report', artifact: ghostReport }).id);

const replay = buildReplayFromSeed({ seed: 'playtest-replay-test', scenarioId: 'comeback-test' });
assert.equal(selectMissionTemplate({ sourceType: 'replay-proof', artifact: replay }).id, 'replay-memory-check');
assert.equal(selectMissionTemplate({ sourceType: 'design-tower', category: 'pacing' }).id, 'first-match-onboarding');
assert.equal(selectMissionTemplate({ sourceType: 'design-tower', category: 'archetype-feel' }).id, 'tool-hoarder-viability');

const hydrated = hydrateMissionFromArtifact(PLAYTEST_TEMPLATES['mutation-ab-playtest'], mutationReport, { question: 'Is faster better?' });
assert.equal(hydrated.targetObservation, 'Is faster better?');
assert.ok(Array.isArray(hydrated.ruleDiff));

const mission = buildPlaytestMission({
  sourceType: 'mutation-report',
  category: 'balance',
  artifact: mutationReport,
  question: 'Does the candidate feel better than baseline?',
  testers: 4,
  seed: 'playtest-test',
});
validatePlaytestMission(mission);
assert.equal(mission.template.id, 'mutation-ab-playtest');
assert.equal(assignTesterRoles(mission, 4).length, 4);
assert.ok(buildFacilitatorScript(mission).introText.includes(mission.title));
assert.equal(buildTesterBriefs(mission).length, mission.roleAssignments.length);
assert.ok(buildObservationSheet(mission).dimensions.length > 0);
assert.ok(buildPassFailRubric(mission).pass.length > 0);

const towerMission = buildPlaytestMission({
  sourceType: 'design-tower',
  category: 'pacing',
  question: 'Does the four-lock candidate preserve comeback agency?',
  seed: 'playtest-design-tower-test',
});
validatePlaytestMission(towerMission);
assert.equal(towerMission.sourceType, 'design-tower');
assert.equal(towerMission.template.id, 'first-match-onboarding');

const scored = scorePlaytestFeedback(mission, {
  comprehension: 5,
  agency: 4,
  tension: 4,
  fairness: 4,
  frustration: 2,
  replayability: 4,
  setupFriction: 1,
  rememberedMoment: 'The final lock race.',
  wouldReplay: true,
});
assert.ok(scored.overallScore > 70);

const session = createSyntheticPlaytestSession(mission, {
  comprehension: 5,
  agency: 4,
  tension: 4,
  fairness: 4,
  frustration: 2,
  replayability: 4,
  setupFriction: 1,
  rememberedMoment: 'The final lock race.',
});
validatePlaytestSession(session);
assert.ok(summarizePlaytestSession(session).keyFinding.includes('score'));

const report = generatePlaytestReport(mission, [session]);
validatePlaytestReport(report);
assert.ok(exportPlaytestMissionMarkdown(mission).includes('# Plundrix Playtest Mission'));
assert.ok(exportPlaytestMissionJson(mission).includes('"title"'));
assert.ok(exportPlaytestReportMarkdown(report).includes('# Plundrix Playtest Report'));

const backlog = generatePlaytestBacklog({
  ghostReport,
  mutationSnapshot: { risks: mutationReport.comparison.contractImpact.requiresDeploymentNote ? [{ severity: 'yellow', title: 'Contract review', mitigation: 'Review deploy note.' }] : [] },
  launchBlockers: [{ title: 'Wallet setup risk', remediation: 'Run launch rehearsal.' }],
});
assert.ok(backlog.length > 0);
assert.ok(exportPlaytestBacklogCsv(backlog).includes('rank,sourceType,category'));

assert.ok(buildMissionFromMutationReport(mutationReport).id);
assert.ok(buildMissionFromGhostReport(ghostReport).id);
assert.ok(buildMissionFromReplay(replay).id);

console.log('Self-Teaching Playtest Coach tests passed');

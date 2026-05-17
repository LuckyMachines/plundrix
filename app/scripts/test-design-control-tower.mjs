import assert from 'node:assert/strict';
import {
  DESIGN_DECISION_STATUSES,
  DESIGN_EVIDENCE_SOURCES,
  DESIGN_HYPOTHESIS_STATES,
  attachEvidence,
  attachPlaytestReportToHypothesis,
  buildBalanceEvidence,
  buildEvidenceGaps,
  buildGhostEvidence,
  buildHypothesisFromGhostRisk,
  buildHypothesisFromMutationCandidate,
  buildHypothesisFromOracleRecommendation,
  buildHypothesisFromPlaytestReport,
  buildHypothesisFromReplay,
  buildLaunchEvidence,
  buildMutationEvidence,
  buildOracleEvidence,
  buildPlaytestEvidence,
  buildPlaytestMissionFromHypothesis,
  buildReplayEvidence,
  buildSimulatorEvidence,
  canTransitionHypothesis,
  createDesignDecision,
  createDesignHypothesis,
  exportDesignBacklogCsv,
  exportDesignPacketJson,
  exportDesignPacketMarkdown,
  generateDecisionMemo,
  generateDesignBacklog,
  generateDesignTowerSnapshot,
  rankDesignHypotheses,
  recommendNextDesignAction,
  scoreDesignHypothesis,
  summarizeEvidenceStack,
  transitionHypothesis,
  validateDesignDecision,
  validateDesignHypothesis,
  validateEvidence,
} from '../src/lib/designControlTower.js';
import { runBatch } from '../src/lib/plundrixEngine.js';
import { runAutopilotSearch } from '../src/lib/balanceAutopilot.js';
import { buildReplayFromSeed } from '../src/lib/replayDirector.js';
import { runGhostBatch } from '../src/lib/playerTelemetryGhosts.js';
import { generateMutationReport } from '../src/lib/ruleMutationTimeMachine.js';
import {
  buildPlaytestMission,
  createSyntheticPlaytestSession,
  generatePlaytestReport,
} from '../src/lib/playtestCoach.js';

assert.ok(DESIGN_HYPOTHESIS_STATES.includes('human-playtest'));
assert.ok(DESIGN_EVIDENCE_SOURCES.includes('playtest-coach'));
assert.ok(DESIGN_DECISION_STATUSES.includes('ship'));

const batch = runBatch({ games: 2, seed: 'design-test-sim', scenarioId: 'new-player-table', maxRounds: 36 });
const simulatorEvidence = buildSimulatorEvidence(batch);
validateEvidence(simulatorEvidence);

let hypothesis = createDesignHypothesis({
  title: 'Improve first match agency',
  category: 'onboarding',
  claim: 'Players should understand their choices after two rounds.',
  desiredOutcome: 'Agency score reaches 4 or higher in playtest.',
  risk: 'Onboarding clarity may not match simulator success.',
  evidence: [simulatorEvidence],
  tags: 'onboarding,agency',
});

validateDesignHypothesis(hypothesis);
assert.equal(hypothesis.schemaVersion, 1);
assert.equal(hypothesis.tags.length, 2);
assert.ok(scoreDesignHypothesis(hypothesis).total > 0);
assert.ok(buildEvidenceGaps(hypothesis).some((gap) => gap.sourceType === 'playtest-coach'));
assert.equal(recommendNextDesignAction(hypothesis).type, 'replay');

hypothesis = transitionHypothesis(hypothesis, 'queued', { operator: 'Tester', rationale: 'Ready for machine validation.' });
assert.equal(hypothesis.state, 'queued');
assert.equal(canTransitionHypothesis(hypothesis, 'simulating'), true);
assert.throws(() => transitionHypothesis(hypothesis, 'shipped'), /Invalid design transition/);

hypothesis = transitionHypothesis(hypothesis, 'simulating');
const replay = buildReplayFromSeed({ seed: 'design-test-replay', scenarioId: 'comeback-test', maxRounds: 36 });
hypothesis = attachEvidence(hypothesis, buildReplayEvidence(replay));
const evidenceStack = summarizeEvidenceStack(hypothesis);
assert.ok(evidenceStack.sources.includes('replay-director'));
assert.ok(evidenceStack.count >= 2);

const ranked = rankDesignHypotheses([
  hypothesis,
  createDesignHypothesis({ title: 'Lower impact idea', category: 'ui', claim: 'Small UI polish.', playerImpact: 1 }),
]);
assert.equal(ranked[0].rank, 1);

const autopilot = runAutopilotSearch({ budget: 'smoke', seed: 'design-test-balance', mode: 'beam', topN: 2 });
validateEvidence(buildBalanceEvidence(autopilot));

const ghostReport = runGhostBatch({ scenario: 'balanced-cast', seed: 'design-test-ghosts', budget: 'smoke', games: 2, maxRounds: 36 });
validateEvidence(buildGhostEvidence(ghostReport));
const ghostHypothesis = buildHypothesisFromGhostRisk(ghostReport.risks[0] || { title: 'Ghost risk', severity: 'yellow', mitigation: 'Retest archetype.' });
validateDesignHypothesis(ghostHypothesis);

const mutationReport = generateMutationReport({ seed: 'design-test-mutation', preset: 'faster-games', budget: 'smoke' });
validateEvidence(buildMutationEvidence(mutationReport));
validateDesignHypothesis(buildHypothesisFromMutationCandidate(mutationReport));

const playtestMission = buildPlaytestMission({
  sourceType: 'manual-design-question',
  category: 'onboarding',
  question: hypothesis.claim,
  seed: 'design-test-playtest',
});
const playtestReport = generatePlaytestReport(playtestMission, [
  createSyntheticPlaytestSession(playtestMission, {
    comprehension: 4,
    agency: 4,
    tension: 4,
    fairness: 4,
    frustration: 2,
    replayability: 4,
    setupFriction: 2,
    wouldReplay: true,
  }),
]);
validateEvidence(buildPlaytestEvidence(playtestReport));
validateDesignHypothesis(buildHypothesisFromPlaytestReport(playtestReport));
const withPlaytest = attachPlaytestReportToHypothesis(hypothesis, playtestReport);
assert.ok(summarizeEvidenceStack(withPlaytest).sources.includes('playtest-coach'));
assert.equal(buildPlaytestMissionFromHypothesis(withPlaytest).designQuestion, withPlaytest.claim);

validateDesignHypothesis(buildHypothesisFromReplay(replay));
validateDesignHypothesis(buildHypothesisFromOracleRecommendation({
  id: 'rec-design',
  title: 'Run design proof',
  category: 'balance',
  rationale: 'Balance evidence needs human validation.',
  score: 0.8,
  commands: ['npm run design:tower -- --snapshot --markdown'],
}));
validateEvidence(buildOracleEvidence({ id: 'oracle-test', health: { score: 80 }, risks: [] }));
validateEvidence(buildLaunchEvidence({ id: 'launch-test', readiness: { score: 85, blockers: [] } }));

const backlog = generateDesignBacklog({
  hypotheses: [withPlaytest],
  mutationReports: [mutationReport],
  ghostRisks: ghostReport.risks || [],
  playtestReports: [playtestReport],
  replays: [replay],
  balanceReport: autopilot,
});
assert.ok(backlog.length >= 4);
assert.ok(exportDesignBacklogCsv(backlog).includes('rank,id,title'));

const memo = generateDecisionMemo(withPlaytest);
assert.equal(memo.hypothesisId, withPlaytest.id);
assert.ok(memo.filesLikelyTouched.length > 0);

const decision = createDesignDecision(withPlaytest, {
  status: 'needs-more-data',
  operator: 'Tester',
  rationale: 'Need one more human validation pass.',
});
validateDesignDecision(decision);
assert.equal(decision.status, 'needs-more-data');

const acceptedDecision = createDesignDecision(withPlaytest, {
  status: 'accept',
  operator: 'Tester',
  rationale: 'Evidence stack is strong enough for controlled promotion.',
  acceptedRisks: ['Human evidence is synthetic in this test fixture.'],
});
validateDesignDecision(acceptedDecision);

const snapshot = generateDesignTowerSnapshot({ seed: 'design-test-snapshot' });
assert.equal(snapshot.schemaVersion, 1);
assert.ok(snapshot.topHypotheses.length > 0);
assert.ok(snapshot.packet.topBacklog.length > 0);
assert.ok(exportDesignPacketMarkdown(snapshot).includes('# Plundrix Design Control Tower'));
assert.ok(exportDesignPacketJson(snapshot).includes('"topBacklog"'));

console.log('Design Control Tower tests passed');

import assert from 'node:assert/strict';
import {
  MUTATION_PRESETS,
  applyRulePatch,
  buildMutationScenario,
  compareSimulationSummaries,
  compareTensionCurves,
  describeRuleDiff,
  diffRules,
  exportMutationMatrixCsv,
  exportMutationReportJson,
  exportMutationReportMarkdown,
  exportRuleDiffCsv,
  generateMutationMatrix,
  generateMutationReport,
  getRuleContractImpact,
  invertRulePatch,
  parseRulePatch,
  runRuleMutationComparison,
  validateMutationComparison,
  validateMutationReport,
  validateMutationScenario,
} from '../src/lib/ruleMutationTimeMachine.js';
import {
  SIM_DEFAULT_RULES,
  runSimulation,
  summarizeSimulation,
} from '../src/lib/plundrixEngine.js';

assert.ok(MUTATION_PRESETS['faster-games']);

const patched = applyRulePatch(SIM_DEFAULT_RULES, { pickBaseChance: 45 });
assert.equal(patched.pickBaseChance, 45);

const diff = diffRules(SIM_DEFAULT_RULES, patched);
assert.equal(diff.length, 1);
assert.equal(diff[0].key, 'pickBaseChance');
assert.equal(invertRulePatch(SIM_DEFAULT_RULES, patched).pickBaseChance, SIM_DEFAULT_RULES.pickBaseChance);
assert.ok(describeRuleDiff(diff).includes('Pick base chance'));
assert.equal(getRuleContractImpact(diff).level, 'contract constant change');
assert.deepEqual(parseRulePatch('{"searchChance":70}'), { searchChance: 70 });

const scenario = buildMutationScenario({
  preset: 'faster-games',
  seed: 'mutation-test',
  scenario: 'new-player-table',
  budget: 'smoke',
});
validateMutationScenario(scenario);

const comparison = runRuleMutationComparison(scenario);
validateMutationComparison(comparison);
assert.equal(comparison.scenario.seed, 'mutation-test');
assert.ok(Number.isFinite(comparison.score.total));
assert.ok(comparison.verdict);
assert.ok(comparison.replay.baseline.dramaticScore >= 0);
assert.ok(Number.isFinite(comparison.ghosts.scoreDelta));

const repeated = runRuleMutationComparison(scenario);
assert.equal(repeated.simulation.roundDelta, comparison.simulation.roundDelta, 'comparison is deterministic');
assert.equal(repeated.replay.delta.dramaticScore, comparison.replay.delta.dramaticScore, 'replay comparison is deterministic');

const baselineState = runSimulation({ seed: 'summary-test', scenarioId: 'new-player-table' });
const candidateState = runSimulation({ seed: 'summary-test', scenarioId: 'new-player-table', rules: patched });
const summaryDelta = compareSimulationSummaries(summarizeSimulation(baselineState), summarizeSimulation(candidateState));
assert.ok('roundDelta' in summaryDelta);
assert.ok(compareTensionCurves(baselineState, candidateState).rounds.length > 0);

const report = generateMutationReport({
  preset: 'more-comeback',
  seed: 'mutation-report-test',
  budget: 'smoke',
});
validateMutationReport(report);
assert.ok(exportMutationReportMarkdown(report).includes('# Plundrix Rule Mutation Time Machine'));
assert.ok(exportMutationReportJson(report).includes('"verdict"'));
assert.ok(exportRuleDiffCsv(report.comparison.ruleDiff).includes('key,before,after'));

const matrix = generateMutationMatrix({
  seed: 'mutation-matrix-test',
  budget: 'smoke',
});
assert.ok(matrix.rows.length >= 3);
assert.ok(matrix.best);
assert.ok(exportMutationMatrixCsv(matrix).includes('preset,score,verdict'));

console.log('Rule Mutation Time Machine tests passed');

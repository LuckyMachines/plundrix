import assert from 'node:assert/strict';
import {
  RULE_BOUNDS,
  RULE_STEPS,
  assessBalancePromotion,
  exportAutopilotCsv,
  exportAutopilotMarkdown,
  generateNeighborRulesets,
  generateRandomRuleset,
  normalizeAutopilotConfig,
  rotateStrategies,
  runAutopilotSearch,
  scoreCandidate,
} from '../src/lib/balanceAutopilot.js';

function assertWithinBounds(rules) {
  for (const [key, [min, max]] of Object.entries(RULE_BOUNDS)) {
    assert.ok(rules[key] >= min, `${key} below min`);
    assert.ok(rules[key] <= max, `${key} above max`);
    const offset = rules[key] - min;
    assert.equal(offset % RULE_STEPS[key], 0, `${key} not snapped to step`);
  }
}

function testCandidateGeneration() {
  const first = generateRandomRuleset({ seed: 'same-seed' });
  const second = generateRandomRuleset({ seed: 'same-seed' });
  assert.deepEqual(first, second, 'random rulesets must be deterministic');
  assertWithinBounds(first);

  const neighbors = generateNeighborRulesets(first);
  assert.ok(neighbors.length > 0, 'neighbors generated');
  for (const neighbor of neighbors) {
    assertWithinBounds(neighbor);
  }
}

function testSeatRotation() {
  const rotations = rotateStrategies(['picker', 'searcher', 'saboteur', 'balanced']);
  assert.equal(rotations.length, 4);
  const firstSeat = rotations.map((rotation) => rotation[0]).sort();
  assert.deepEqual(firstSeat, ['balanced', 'picker', 'saboteur', 'searcher']);
}

function testObjectiveScoring() {
  const config = normalizeAutopilotConfig({ budget: 'smoke', games: 4, iterations: 2 });
  const report = runAutopilotSearch({ ...config, validate: false, rerank: false, topN: 3 });
  assert.ok(report.topCandidates.length > 0, 'top candidates exist');
  const scored = scoreCandidate(report.topCandidates[0], config);
  assert.equal(typeof scored.objectiveScore, 'number');
  assert.ok(Number.isFinite(scored.objectiveScore), 'score is finite');
  const promotion = assessBalancePromotion(report.topCandidates[0], {
    firstMatch: { score: 92, runawayRate: 0.02, tooLongRate: 0.02 },
    comeback: { score: 94, runawayRate: 0.01 },
    ghostScore: 74,
    replayScore: 80,
    mutationRisk: 'contract constant change',
  });
  assert.equal(promotion.status, 'promotable');
}

function testReports() {
  const report = runAutopilotSearch({
    budget: 'smoke',
    mode: 'random',
    seed: 'test-report',
    games: 3,
    iterations: 2,
    scenarios: ['new-player-table'],
    validate: false,
    rerank: false,
    topN: 2,
  });
  const csv = exportAutopilotCsv(report);
  const markdown = exportAutopilotMarkdown(report);
  assert.ok(csv.includes('rank,id,score'), 'csv header');
  assert.ok(markdown.includes('# Plundrix Balance Autopilot Report'), 'markdown title');
}

testCandidateGeneration();
testSeatRotation();
testObjectiveScoring();
testReports();

console.log('Balance autopilot tests passed');

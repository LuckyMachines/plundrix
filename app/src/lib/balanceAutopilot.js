import {
  SIM_DEFAULT_RULES,
  SIM_DEFAULT_STRATEGY_PROFILE,
  SIM_SCENARIOS,
  compareRulesets,
  exportBatchCsv,
  normalizeRuleset,
  normalizeStrategyProfile,
  runBatch,
} from './plundrixEngine.js';
import {
  buildGhostBalanceScore,
  runGhostBatch,
} from './playerTelemetryGhosts.js';
import {
  buildMutationBalanceSummary,
} from './ruleMutationTimeMachine.js';

export const AUTOPILOT_SCHEMA_VERSION = 1;
export const AUTOPILOT_CONTRACT_METADATA = Object.freeze({
  contract: 'PlundrixGame.sol',
  constants: {
    TOTAL_LOCKS: 5,
    MAX_TOOLS: 5,
    PICK_BASE_CHANCE: 40,
    PICK_TOOL_BONUS: 15,
    PICK_CHANCE_CAP: 95,
    SEARCH_CHANCE: 60,
    STUNNED_SEARCH_CHANCE: 30,
  },
  deployedBehaviorNote:
    'Simulator tuning does not change deployed contract behavior until a contract upgrade or redeploy applies the chosen rules.',
});

export const RULE_BOUNDS = Object.freeze({
  totalLocks: [4, 7],
  maxTools: [3, 6],
  pickBaseChance: [25, 50],
  pickToolBonus: [10, 25],
  pickChanceCap: [80, 98],
  searchChance: [45, 75],
  stunnedSearchChance: [15, 45],
});

export const RULE_STEPS = Object.freeze({
  totalLocks: 1,
  maxTools: 1,
  pickBaseChance: 5,
  pickToolBonus: 5,
  pickChanceCap: 5,
  searchChance: 5,
  stunnedSearchChance: 5,
});

export const AUTOPILOT_BUDGETS = Object.freeze({
  smoke: { iterations: 4, games: 8, beamWidth: 3, rerankTop: 2, rerankGames: 12, validateTop: 1, validateGames: 16 },
  fast: { iterations: 50, games: 100, beamWidth: 6, rerankTop: 8, rerankGames: 250, validateTop: 3, validateGames: 500 },
  normal: { iterations: 200, games: 250, beamWidth: 10, rerankTop: 12, rerankGames: 750, validateTop: 5, validateGames: 1500 },
  deep: { iterations: 1000, games: 1000, beamWidth: 18, rerankTop: 20, rerankGames: 2500, validateTop: 8, validateGames: 5000 },
});

export const OBJECTIVE_PRESETS = Object.freeze({
  default: {
    id: 'default',
    label: 'Default balance',
    targetAverageRounds: 15,
    winSpreadWeight: 120,
    runawayWeight: 55,
    comebackWeight: 28,
    tensionWeight: 18,
    durationWeight: 36,
    sabotageWasteWeight: 20,
    firstPlayerWeight: 24,
    changedKnobWeight: 1.4,
  },
  faster: {
    id: 'faster',
    label: 'Faster games',
    targetAverageRounds: 11,
    winSpreadWeight: 95,
    runawayWeight: 45,
    comebackWeight: 18,
    tensionWeight: 12,
    durationWeight: 58,
    sabotageWasteWeight: 16,
    firstPlayerWeight: 20,
    changedKnobWeight: 1.2,
  },
  comeback: {
    id: 'comeback',
    label: 'Higher comeback',
    targetAverageRounds: 16,
    winSpreadWeight: 110,
    runawayWeight: 70,
    comebackWeight: 55,
    tensionWeight: 16,
    durationWeight: 30,
    sabotageWasteWeight: 18,
    firstPlayerWeight: 22,
    changedKnobWeight: 1.2,
  },
  lowSabotageWaste: {
    id: 'lowSabotageWaste',
    label: 'Lower sabotage waste',
    targetAverageRounds: 15,
    winSpreadWeight: 105,
    runawayWeight: 45,
    comebackWeight: 22,
    tensionWeight: 16,
    durationWeight: 30,
    sabotageWasteWeight: 44,
    firstPlayerWeight: 20,
    changedKnobWeight: 1.1,
  },
  minimalChange: {
    id: 'minimalChange',
    label: 'Contract-minimal changes',
    targetAverageRounds: 15,
    winSpreadWeight: 110,
    runawayWeight: 50,
    comebackWeight: 24,
    tensionWeight: 14,
    durationWeight: 30,
    sabotageWasteWeight: 18,
    firstPlayerWeight: 22,
    changedKnobWeight: 4.5,
  },
  highTension: {
    id: 'highTension',
    label: 'More tension',
    targetAverageRounds: 17,
    winSpreadWeight: 105,
    runawayWeight: 48,
    comebackWeight: 30,
    tensionWeight: 36,
    durationWeight: 26,
    sabotageWasteWeight: 16,
    firstPlayerWeight: 20,
    changedKnobWeight: 1.2,
  },
});

export const SCENARIO_WEIGHTS = Object.freeze({
  'new-player-table': 1.5,
  'human-vs-bots': 1.5,
  'comeback-test': 1.2,
  'all-aggressive': 1,
  'all-searchers': 1,
  'stall-test': 1,
});

export const STRATEGY_MATCHUPS = Object.freeze({
  mixed: ['balanced', 'picker', 'searcher', 'saboteur'],
  balanced: ['balanced', 'balanced', 'balanced', 'balanced'],
  pickerHeavy: ['picker', 'picker', 'balanced', 'searcher'],
  searcherHeavy: ['searcher', 'searcher', 'balanced', 'saboteur'],
  saboteurHeavy: ['saboteur', 'saboteur', 'balanced', 'searcher'],
  humanVsBots: ['human', 'balanced', 'searcher', 'saboteur'],
});

export const SEED_BANK = Object.freeze({
  comeback: ['comeback-test-7', 'comeback-test-19', 'plundrix-comeback-42'],
  runaway: ['all-aggressive-3', 'runaway-watch-11', 'plundrix-fast-9'],
  stall: ['stall-test-12', 'sabotage-loop-18', 'plundrix-stall-33'],
  closeFinish: ['new-player-table-5', 'close-vault-22', 'plundrix-edge-61'],
  weird: ['weird-tools-4', 'empty-sabotage-17', 'plundrix-odd-88'],
});

const DEFAULT_SCENARIOS = [
  'new-player-table',
  'all-aggressive',
  'all-searchers',
  'comeback-test',
  'stall-test',
  'human-vs-bots',
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function hashString(input) {
  let hash = 2166136261;
  const text = String(input);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

export function seededUnit(seed, salt = '') {
  return hashString(`${seed}:${salt}`) / 0xffffffff;
}

function seededInt(seed, salt, min, max) {
  return min + Math.floor(seededUnit(seed, salt) * (max - min + 1));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function variance(values) {
  if (values.length <= 1) {
    return 0;
  }
  const avg = average(values);
  return average(values.map((value) => (value - avg) ** 2));
}

function normalizeBounds(bounds = RULE_BOUNDS) {
  return Object.fromEntries(
    Object.entries(RULE_BOUNDS).map(([key, fallback]) => {
      const next = bounds[key] || fallback;
      return [key, [Number(next[0]), Number(next[1])]];
    }),
  );
}

function normalizeSteps(steps = RULE_STEPS) {
  return { ...RULE_STEPS, ...steps };
}

function normalizeLocks(lockedKeys = []) {
  return new Set(lockedKeys);
}

function snapToStep(value, key, bounds = RULE_BOUNDS, steps = RULE_STEPS) {
  const [min, max] = bounds[key] || RULE_BOUNDS[key];
  const step = steps[key] || RULE_STEPS[key] || 1;
  const snapped = min + Math.round((Number(value) - min) / step) * step;
  return clamp(snapped, min, max);
}

export function normalizeCandidateRules(
  rules = SIM_DEFAULT_RULES,
  bounds = RULE_BOUNDS,
  steps = RULE_STEPS,
) {
  const next = { ...SIM_DEFAULT_RULES };
  for (const key of Object.keys(RULE_BOUNDS)) {
    next[key] = snapToStep(rules[key] ?? SIM_DEFAULT_RULES[key], key, bounds, steps);
  }
  return normalizeRuleset(next);
}

export function getChangedKeys(rules, baselineRules = SIM_DEFAULT_RULES) {
  const normalized = normalizeRuleset(rules);
  const baseline = normalizeRuleset(baselineRules);
  return Object.keys(RULE_BOUNDS).filter((key) => normalized[key] !== baseline[key]);
}

export function getCandidateId(rules, prefix = 'candidate') {
  const normalized = normalizeRuleset(rules);
  const payload = Object.keys(RULE_BOUNDS)
    .sort()
    .map((key) => `${key}:${normalized[key]}`)
    .join('|');
  return `${prefix}-${hashString(payload).toString(16).padStart(8, '0')}`;
}

export function generateRandomRuleset(options = {}) {
  const bounds = normalizeBounds(options.bounds);
  const steps = normalizeSteps(options.steps);
  const locked = normalizeLocks(options.lockedKeys);
  const base = normalizeRuleset(options.baseRules || SIM_DEFAULT_RULES);
  const seed = options.seed || 'autopilot-random';
  const rules = { ...base };

  for (const key of Object.keys(RULE_BOUNDS)) {
    if (locked.has(key)) {
      continue;
    }
    const [min, max] = bounds[key];
    const step = steps[key];
    const slots = Math.floor((max - min) / step);
    rules[key] = min + seededInt(seed, key, 0, slots) * step;
  }

  return normalizeCandidateRules(rules, bounds, steps);
}

export function mutateRuleset(baseRules, options = {}) {
  const bounds = normalizeBounds(options.bounds);
  const steps = normalizeSteps(options.steps);
  const locked = normalizeLocks(options.lockedKeys);
  const intensity = clamp(Number(options.intensity ?? 1), 1, 4);
  const seed = options.seed || 'autopilot-mutate';
  const keys = Object.keys(RULE_BOUNDS).filter((key) => !locked.has(key));
  const rules = normalizeCandidateRules(baseRules, bounds, steps);
  const mutations = clamp(Math.round(intensity), 1, Math.max(1, keys.length));

  for (let index = 0; index < mutations; index += 1) {
    const key = keys[seededInt(seed, `key-${index}`, 0, keys.length - 1)];
    const direction = seededUnit(seed, `dir-${index}`) < 0.5 ? -1 : 1;
    rules[key] = snapToStep(rules[key] + direction * steps[key], key, bounds, steps);
  }

  return normalizeCandidateRules(rules, bounds, steps);
}

export function generateNeighborRulesets(baseRules, options = {}) {
  const bounds = normalizeBounds(options.bounds);
  const steps = normalizeSteps(options.steps);
  const locked = normalizeLocks(options.lockedKeys);
  const base = normalizeCandidateRules(baseRules, bounds, steps);
  const candidates = [];

  for (const key of Object.keys(RULE_BOUNDS)) {
    if (locked.has(key)) {
      continue;
    }
    for (const direction of [-1, 1]) {
      const rules = {
        ...base,
        [key]: snapToStep(base[key] + direction * steps[key], key, bounds, steps),
      };
      if (rules[key] !== base[key]) {
        candidates.push(normalizeCandidateRules(rules, bounds, steps));
      }
    }
  }

  return dedupeRulesets(candidates);
}

export function generateGridRulesets(options = {}) {
  const bounds = normalizeBounds(options.bounds);
  const steps = normalizeSteps(options.steps);
  const locked = normalizeLocks(options.lockedKeys);
  const base = normalizeRuleset(options.baseRules || SIM_DEFAULT_RULES);
  const keys = options.keys?.length
    ? options.keys.filter((key) => RULE_BOUNDS[key] && !locked.has(key))
    : ['pickBaseChance', 'pickToolBonus', 'searchChance', 'stunnedSearchChance'];
  const limit = Number(options.limit || 250);
  const output = [];

  function visit(index, current) {
    if (output.length >= limit) {
      return;
    }
    if (index >= keys.length) {
      output.push(normalizeCandidateRules(current, bounds, steps));
      return;
    }
    const key = keys[index];
    const [min, max] = bounds[key];
    for (let value = min; value <= max; value += steps[key]) {
      visit(index + 1, { ...current, [key]: value });
      if (output.length >= limit) {
        return;
      }
    }
  }

  visit(0, base);
  return dedupeRulesets(output);
}

function dedupeRulesets(rulesets) {
  const seen = new Set();
  const output = [];
  for (const rules of rulesets) {
    const id = getCandidateId(rules);
    if (!seen.has(id)) {
      seen.add(id);
      output.push(rules);
    }
  }
  return output;
}

export function rotateStrategies(strategies = STRATEGY_MATCHUPS.mixed) {
  const source = strategies.length ? strategies : STRATEGY_MATCHUPS.mixed;
  return source.map((_, index) => [...source.slice(index), ...source.slice(0, index)]);
}

function objectivePreset(idOrPreset = 'default') {
  if (typeof idOrPreset === 'object' && idOrPreset) {
    return { ...OBJECTIVE_PRESETS.default, ...idOrPreset };
  }
  return OBJECTIVE_PRESETS[idOrPreset] || OBJECTIVE_PRESETS.default;
}

function scoreScenarioBatch(result, options = {}) {
  const objective = objectivePreset(options.objective);
  const scorecard = result.scorecard;
  const actionValue = result.actionValue;
  const durationDistance = Math.abs(scorecard.averageRounds - objective.targetAverageRounds) / objective.targetAverageRounds;
  const firstPlayerTarget = result.playerCount ? 1 / result.playerCount : 0.25;
  const scoreComponents = {
    baseScore: scorecard.score,
    comebackBonus: scorecard.comebackRate * objective.comebackWeight,
    tensionBonus: average((result.summaries || []).map((summary) => summary.averageTension)) / 100 * objective.tensionWeight,
    runawayPenalty: -scorecard.runawayRate * objective.runawayWeight,
    winSpreadPenalty: -scorecard.winSpread * objective.winSpreadWeight,
    durationPenalty: -durationDistance * objective.durationWeight,
    wastedSabotagePenalty: -actionValue.wastedSabotageRate * objective.sabotageWasteWeight,
    firstPlayerPenalty: -Math.abs(scorecard.firstPlayerRate - firstPlayerTarget) * objective.firstPlayerWeight,
  };
  const finalScore = Object.values(scoreComponents).reduce((sum, value) => sum + value, 0);
  return { finalScore, scoreComponents };
}

export function scoreCandidate(evaluation, options = {}) {
  const objective = objectivePreset(options.objective);
  const scenarioScores = evaluation.scenarios.map((scenario) => scenario.objectiveScore);
  const weightedTotal = evaluation.scenarios.reduce(
    (sum, scenario) => sum + scenario.objectiveScore * scenario.weight,
    0,
  );
  const weightTotal = evaluation.scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
  const changedKnobs = evaluation.changedKeys.length;
  const variancePenalty = Math.sqrt(variance(scenarioScores)) * 0.22;
  const changedPenalty = changedKnobs * objective.changedKnobWeight;
  const viabilityPenalty = evaluation.viability.pass ? 0 : evaluation.viability.failures.length * 12;
  const objectiveScore = weightedTotal / Math.max(1, weightTotal) - variancePenalty - changedPenalty - viabilityPenalty;

  return {
    objectiveScore,
    scoreComponents: {
      weightedScenarioScore: weightedTotal / Math.max(1, weightTotal),
      variancePenalty: -variancePenalty,
      changedPenalty: -changedPenalty,
      viabilityPenalty: -viabilityPenalty,
    },
    scenarioScoreVariance: variance(scenarioScores),
  };
}

function analyzeViability(scenarioResults, config = {}) {
  const failures = [];
  const maxWinSpread = Number(config.maxWinSpread ?? 0.42);
  const minCompletionRate = Number(config.minCompletionRate ?? 0.98);
  const maxDominanceRate = Number(config.maxDominanceRate ?? 0.58);
  const minAverageRounds = Number(config.minAverageRounds ?? 6);
  const maxAverageRounds = Number(config.maxAverageRounds ?? 34);

  for (const scenario of scenarioResults) {
    const scorecard = scenario.batch.scorecard;
    if (scorecard.completionRate < minCompletionRate) {
      failures.push(`${scenario.scenarioId}: completion below ${(minCompletionRate * 100).toFixed(0)}%`);
    }
    if (scorecard.averageRounds < minAverageRounds) {
      failures.push(`${scenario.scenarioId}: too fast`);
    }
    if (scorecard.averageRounds > maxAverageRounds) {
      failures.push(`${scenario.scenarioId}: too long`);
    }
    if (scorecard.winSpread > maxWinSpread) {
      failures.push(`${scenario.scenarioId}: win spread too high`);
    }
    const highestWinRate = Math.max(0, ...Object.values(scorecard.winRates));
    if (highestWinRate > maxDominanceRate) {
      failures.push(`${scenario.scenarioId}: dominance above ceiling`);
    }
  }

  return { pass: failures.length === 0, failures };
}

function aggregateRotations(rotationBatches) {
  const summaries = rotationBatches.flatMap((batch) => batch.summaries || []);
  const games = rotationBatches.reduce((sum, batch) => sum + batch.games, 0);
  const completed = rotationBatches.reduce((sum, batch) => sum + batch.completed, 0);
  const winCounts = rotationBatches.reduce((counts, batch) => {
    for (const [player, wins] of Object.entries(batch.winCounts || {})) {
      counts[player] = (counts[player] || 0) + wins;
    }
    return counts;
  }, {});
  const result = {
    ...rotationBatches[0],
    games,
    completed,
    averageRounds: average(rotationBatches.map((batch) => batch.averageRounds)),
    winCounts,
    summaries,
  };
  result.scorecard = rotationBatches[0].scorecard.constructor
    ? rotationBatches[0].scorecard
    : rotationBatches[0].scorecard;
  const combined = runBatch({
    ...rotationBatches[0],
    games: 1,
  });
  return {
    ...combined,
    games,
    completed,
    winCounts,
    summaries,
    averageRounds: average(summaries.map((summary) => summary.rounds)),
  };
}

function evaluateScenario(rules, config, scenarioId, strategies) {
  const rotations = config.rotateSeats ? rotateStrategies(strategies) : [strategies];
  const rotationBatches = rotations.map((rotatedStrategies, index) =>
    runBatch({
      games: config.games,
      seed: `${config.seed}-${scenarioId}-seat-${index}`,
      scenarioId,
      playerCount: config.playerCount,
      strategies: rotatedStrategies,
      strategyProfile: config.strategyProfile,
      maxRounds: config.maxRounds,
      rules,
    }),
  );
  const batch = rotationBatches.length > 1 ? mergeBatchResults(rotationBatches) : rotationBatches[0];
  const scored = scoreScenarioBatch(batch, { objective: config.objective });
  return {
    scenarioId,
    weight: config.scenarioWeights[scenarioId] || 1,
    batch,
    objectiveScore: scored.finalScore,
    scoreComponents: scored.scoreComponents,
  };
}

function mergeBatchResults(batches) {
  const summaries = batches.flatMap((batch) => batch.summaries || []);
  const games = batches.reduce((sum, batch) => sum + batch.games, 0);
  const completed = batches.reduce((sum, batch) => sum + batch.completed, 0);
  const winCounts = batches.reduce((counts, batch) => {
    for (const [player, wins] of Object.entries(batch.winCounts || {})) {
      counts[player] = (counts[player] || 0) + wins;
    }
    return counts;
  }, {});
  const template = runBatch({
    games: 1,
    seed: 'merge-template',
    scenarioId: 'new-player-table',
    rules: batches[0].rules,
    strategies: batches[0].strategies,
    strategyProfile: batches[0].strategyProfile,
  });
  const merged = {
    ...template,
    games,
    completed,
    winCounts,
    summaries,
    rules: batches[0].rules,
    strategies: batches[0].strategies,
    strategyProfile: batches[0].strategyProfile,
    averageRounds: average(summaries.map((summary) => summary.rounds)),
  };
  merged.scorecard = computeScorecardFromSummaries(merged);
  merged.actionValue = computeActionValueFromSummaries(merged);
  merged.dashboard = {
    ...merged.dashboard,
    scorecard: merged.scorecard,
    actionValue: merged.actionValue,
    flags: buildFlags(merged),
  };
  return merged;
}

function computeScorecardFromSummaries(result) {
  const games = Math.max(1, result.games);
  const winRates = Object.fromEntries(
    Object.entries(result.winCounts || {}).map(([player, wins]) => [player, wins / games]),
  );
  const rates = Object.values(winRates);
  const averageRounds = average(result.summaries.map((summary) => summary.rounds));
  const tooFastRate = result.summaries.filter((summary) => summary.rounds < result.rules.minHealthyRounds).length / games;
  const tooLongRate = result.summaries.filter((summary) => summary.rounds > result.rules.maxHealthyRounds).length / games;
  const runawayRate = result.summaries.filter((summary) => summary.runaway).length / games;
  const comebackRate = result.summaries.filter((summary) => summary.comeback).length / games;
  const winSpread = rates.length ? Math.max(...rates) - Math.min(...rates) : 0;
  const firstPlayerRate = (result.winCounts?.['player-1'] || 0) / games;
  const score = clamp(100 - winSpread * 120 - tooFastRate * 35 - tooLongRate * 35 - runawayRate * 35 + Math.min(comebackRate, 0.3) * 20, 0, 100);
  return {
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    winRates,
    winSpread,
    averageRounds,
    medianRounds: averageRounds,
    p90Rounds: Math.max(0, ...result.summaries.map((summary) => summary.rounds)),
    tooFastRate,
    tooLongRate,
    runawayRate,
    comebackRate,
    firstPlayerRate,
    completionRate: result.completed / games,
  };
}

function computeActionValueFromSummaries(result) {
  const summaries = result.summaries || [];
  const totalSabotage = summaries.reduce((sum, summary) => sum + summary.sabotages, 0);
  const totalTools = summaries.reduce((sum, summary) => sum + summary.totalTools, 0);
  return {
    pick: average(summaries.map((summary) => summary.actionValue.pick)),
    search: average(summaries.map((summary) => summary.actionValue.search)),
    sabotage: average(summaries.map((summary) => summary.actionValue.sabotage)),
    wastedSabotageRate: summaries.reduce((sum, summary) => sum + summary.wastedSabotages, 0) / Math.max(1, totalSabotage),
    toolConversion: summaries.reduce((sum, summary) => sum + summary.totalLocks, 0) / Math.max(1, totalTools),
    averageToolsHeld: average(summaries.map((summary) => summary.totalTools)),
    averageMaxToolsHeld: average(summaries.map((summary) => summary.maxToolsHeld)),
    averageStuns: average(summaries.map((summary) => summary.stunMoments)),
  };
}

function buildFlags(result) {
  const flags = [];
  if (result.scorecard.winSpread > 0.22) flags.push('Win spread is high; compare player order and strategy dominance.');
  if (result.scorecard.tooFastRate > 0.2) flags.push('Too many games end before the healthy round target.');
  if (result.scorecard.tooLongRate > 0.2) flags.push('Too many games exceed the healthy round target.');
  if (result.scorecard.runawayRate > 0.25) flags.push('Runaway wins are common; comeback pressure may need help.');
  if (result.actionValue.wastedSabotageRate > 0.35) flags.push('Sabotage often hits empty targets; targeting incentives may need tuning.');
  return flags.length ? flags : ['No critical balance warnings under the current batch.'];
}

export function evaluateCandidate(candidateInput, options = {}) {
  const config = normalizeAutopilotConfig(options);
  const rules = normalizeCandidateRules(candidateInput.rules || candidateInput, config.bounds, config.steps);
  const changedKeys = getChangedKeys(rules, config.baselineRules);
  const strategies = config.strategies || STRATEGY_MATCHUPS.mixed;
  const scenarios = config.scenarios.map((scenarioId) =>
    evaluateScenario(rules, config, scenarioId, strategies),
  );
  const viability = analyzeViability(scenarios, config);
  const preliminary = {
    id: getCandidateId(rules),
    rules,
    changedKeys,
    contractParity: changedKeys.length === 0,
    scenarios,
    viability,
  };
  const scored = scoreCandidate(preliminary, config);
  const comparison = compareRulesets({
    games: Math.max(4, Math.floor(config.games / 2)),
    scenarioId: config.scenarios[0] || 'new-player-table',
    seed: `${config.seed}-compare-${preliminary.id}`,
    strategies,
    strategyProfile: config.strategyProfile,
    baselineRules: config.baselineRules,
    candidateRules: rules,
    maxRounds: config.maxRounds,
  });
  return enrichCandidate({
    ...preliminary,
    objectiveScore: scored.objectiveScore,
    scoreComponents: scored.scoreComponents,
    scenarioScoreVariance: scored.scenarioScoreVariance,
    comparisonDelta: comparison.deltas,
  }, config);
}

function enrichCandidate(candidate, config) {
  return {
    ...candidate,
    changedKeyCount: candidate.changedKeys.length,
    smallestChangeScore: candidate.objectiveScore / Math.max(1, candidate.changedKeys.length),
    confidence: confidenceFor(config.games, candidate.scenarios.length),
    shipReadiness: shipReadiness(candidate),
    implementationCost: implementationCost(candidate),
    riskExplanation: riskExplanation(candidate),
    solidityPatch: solidityPatchSuggestion(candidate.rules, config.baselineRules),
    replayLinks: Object.fromEntries(
      candidate.scenarios.map((scenario) => [
        scenario.scenarioId,
        buildReplayLink({
          seed: `${config.seed}-${scenario.scenarioId}`,
          playerCount: config.playerCount,
          scenarioId: scenario.scenarioId,
          strategies: config.strategies,
          rules: candidate.rules,
        }),
      ]),
    ),
  };
}

function confidenceFor(games, scenarioCount) {
  const sample = games * scenarioCount;
  if (sample >= 5000) return 'high';
  if (sample >= 750) return 'medium';
  return 'low';
}

function shipReadiness(candidate) {
  if (!candidate.viability.pass) return 'do not ship';
  if (candidate.confidence === 'high' && candidate.objectiveScore >= 85) return 'safest candidate';
  if (candidate.objectiveScore >= 78) return 'promising';
  if (candidate.objectiveScore >= 68) return 'needs validation';
  return 'exploration only';
}

function implementationCost(candidate) {
  if (candidate.changedKeys.length === 0) {
    return 'no contract change';
  }
  const hardKeys = new Set(['totalLocks', 'maxTools', 'pickBaseChance', 'pickToolBonus', 'pickChanceCap', 'searchChance', 'stunnedSearchChance']);
  return candidate.changedKeys.some((key) => hardKeys.has(key))
    ? 'contract change required'
    : 'UI-only change';
}

function riskExplanation(candidate) {
  const risks = [];
  const averageRounds = average(candidate.scenarios.map((scenario) => scenario.batch.scorecard.averageRounds));
  const winSpread = average(candidate.scenarios.map((scenario) => scenario.batch.scorecard.winSpread));
  const runawayRate = average(candidate.scenarios.map((scenario) => scenario.batch.scorecard.runawayRate));
  if (averageRounds > 24) risks.push('longer game length');
  if (averageRounds < 8) risks.push('fast finishes');
  if (winSpread > 0.25) risks.push('uneven win rates');
  if (runawayRate > 0.2) risks.push('runaway pressure');
  if (!candidate.viability.pass) risks.push('failed viability filters');
  return risks.length
    ? `Risk profile: ${risks.join(', ')}.`
    : 'Risk profile: no major statistical risk under this search budget.';
}

function solidityPatchSuggestion(rules, baseline = SIM_DEFAULT_RULES) {
  const changed = getChangedKeys(rules, baseline);
  if (!changed.length) {
    return 'No Solidity constant changes required.';
  }
  const names = {
    totalLocks: 'TOTAL_LOCKS',
    maxTools: 'MAX_TOOLS',
    pickBaseChance: 'pick base chance inside _resolvePick',
    pickToolBonus: 'tool bonus inside _resolvePick',
    pickChanceCap: 'pick chance cap inside _resolvePick',
    searchChance: 'search chance inside _resolveSearch',
    stunnedSearchChance: 'stunned search chance inside _resolveSearch',
  };
  return changed.map((key) => `${names[key]}: ${baseline[key]} -> ${rules[key]}`).join('\n');
}

export function assessBalancePromotion(candidate, evidence = {}) {
  const scenarios = candidate?.scenarios || [];
  const findScenario = (id) => scenarios.find((scenario) => scenario.scenarioId === id || scenario.scenario?.id === id);
  const firstMatch = evidence.firstMatch || findScenario('new-player-table')?.batch?.scorecard || null;
  const comeback = evidence.comeback || findScenario('comeback-test')?.batch?.scorecard || null;
  const ghostScore = evidence.ghostScore ?? evidence.ghostReport?.score?.score ?? evidence.ghostReport?.score ?? null;
  const replayScore = evidence.replayScore ?? evidence.replay?.dramaticScore ?? null;
  const funScore =
    evidence.funScore?.score ??
    evidence.funProof?.score?.score ??
    evidence.replay?.funScore?.score ??
    firstMatch?.averageFunScore ??
    evidence.funScore ??
    null;
  const mutationRisk = evidence.mutationRisk ?? evidence.mutationProof?.contractImpact?.level ?? 'unknown';
  const checks = [
    {
      id: 'first-match-score',
      label: 'First-match score is at least 90',
      pass: Boolean(firstMatch && firstMatch.score >= 90),
      value: firstMatch?.score ?? null,
    },
    {
      id: 'comeback-score',
      label: 'Comeback score is at least 90',
      pass: Boolean(comeback && comeback.score >= 90),
      value: comeback?.score ?? null,
    },
    {
      id: 'critical-warnings',
      label: 'No critical balance warning rates are open',
      pass: Boolean(firstMatch && comeback && firstMatch.runawayRate <= 0.25 && firstMatch.tooLongRate <= 0.2 && comeback.runawayRate <= 0.25),
      value: firstMatch && comeback ? `runaway ${firstMatch.runawayRate}/${comeback.runawayRate}` : null,
    },
    {
      id: 'ghost-health',
      label: 'Ghost score does not regress below 70',
      pass: ghostScore === null ? false : ghostScore >= 70,
      value: ghostScore,
    },
    {
      id: 'replay-drama',
      label: 'Replay drama remains at least 55',
      pass: replayScore === null ? false : replayScore >= 55,
      value: replayScore,
    },
    {
      id: 'fun-proof',
      label: 'Fun proof remains at least 70 when measured',
      pass: funScore === null ? true : funScore >= 70,
      value: funScore,
    },
    {
      id: 'mutation-risk',
      label: 'Mutation risk is acceptable for the target gate',
      pass: !String(mutationRisk).toLowerCase().includes('deployment-blocker'),
      value: mutationRisk,
    },
  ];
  const failed = checks.filter((check) => !check.pass);
  return {
    status: failed.length ? (failed.length <= 2 ? 'hold' : 'reject') : 'promotable',
    promotable: failed.length === 0,
    checks,
    failedCriteria: failed.map((check) => check.label),
  };
}

export function normalizeAutopilotConfig(options = {}) {
  const budgetName = typeof options.budget === 'string'
    ? options.budget
    : options.budgetName || 'fast';
  const budget = typeof options.budget === 'object' && options.budget
    ? options.budget
    : AUTOPILOT_BUDGETS[budgetName] || AUTOPILOT_BUDGETS.fast;
  const scenarios = options.scenarios?.length
    ? options.scenarios
    : DEFAULT_SCENARIOS.filter((id) => SIM_SCENARIOS.some((scenario) => scenario.id === id));
  const games = Number(options.games || budget.games);
  const iterations = Number(options.iterations || budget.iterations);
  const maxBrowserEvaluations = Number(options.maxBrowserEvaluations || 400);

  if (options.environment === 'browser' && games * iterations > maxBrowserEvaluations * 250) {
    throw new Error(`Search budget is too large for browser execution. Use CLI or reduce games/iterations.`);
  }

  return {
    schemaVersion: AUTOPILOT_SCHEMA_VERSION,
    mode: options.mode || 'random',
    tuningMode: options.tuningMode || 'future-contract',
    budgetName,
    budget,
    iterations,
    games,
    seed: options.seed || 'balance-autopilot',
    scenarios,
    scenarioWeights: { ...SCENARIO_WEIGHTS, ...(options.scenarioWeights || {}) },
    objective: options.objective || 'default',
    playerCount: Number(options.playerCount || 4),
    strategies: options.strategies || STRATEGY_MATCHUPS.mixed,
    strategyProfile: normalizeStrategyProfile(options.strategyProfile || SIM_DEFAULT_STRATEGY_PROFILE),
    baselineRules: normalizeRuleset(options.baselineRules || SIM_DEFAULT_RULES),
    bounds: normalizeBounds(options.bounds),
    steps: normalizeSteps(options.steps),
    lockedKeys: options.lockedKeys || [],
    maxRounds: Number(options.maxRounds || 40),
    rotateSeats: options.rotateSeats !== false,
    rerank: options.rerank !== false,
    validate: options.validate !== false,
    topN: Number(options.topN || 10),
    beamWidth: Number(options.beamWidth || budget.beamWidth),
    gridKeys: options.gridKeys,
    gridLimit: Number(options.gridLimit || iterations),
    minCompletionRate: Number(options.minCompletionRate ?? 0.98),
    maxWinSpread: Number(options.maxWinSpread ?? 0.42),
    maxDominanceRate: Number(options.maxDominanceRate ?? 0.58),
    minAverageRounds: Number(options.minAverageRounds ?? 6),
    maxAverageRounds: Number(options.maxAverageRounds ?? 34),
    includeGhosts: Boolean(options.includeGhosts),
    includeMutations: Boolean(options.includeMutations),
  };
}

function shouldStop(abortSignal) {
  return Boolean(abortSignal?.aborted);
}

function reportProgress(onProgress, payload) {
  if (typeof onProgress === 'function') {
    onProgress(payload);
  }
}

function addCandidateResult(results, candidate) {
  const existingIndex = results.findIndex((item) => item.id === candidate.id);
  if (existingIndex >= 0) {
    if (candidate.objectiveScore > results[existingIndex].objectiveScore) {
      results[existingIndex] = candidate;
    }
  } else {
    results.push(candidate);
  }
  results.sort((a, b) => b.objectiveScore - a.objectiveScore);
}

function nextRulesForMode(mode, index, config, frontier) {
  if (mode === 'grid') {
    return generateGridRulesets({
      baseRules: config.baselineRules,
      bounds: config.bounds,
      steps: config.steps,
      lockedKeys: config.lockedKeys,
      keys: config.gridKeys,
      limit: config.gridLimit,
    })[index];
  }
  if (mode === 'hill') {
    const base = frontier[0]?.rules || config.baselineRules;
    return mutateRuleset(base, {
      bounds: config.bounds,
      steps: config.steps,
      lockedKeys: config.lockedKeys,
      intensity: 1 + (index % 2),
      seed: `${config.seed}-hill-${index}`,
    });
  }
  if (mode === 'beam') {
    const parent = frontier[index % Math.max(1, Math.min(frontier.length, config.beamWidth))]?.rules || config.baselineRules;
    return mutateRuleset(parent, {
      bounds: config.bounds,
      steps: config.steps,
      lockedKeys: config.lockedKeys,
      intensity: 1 + (index % 3),
      seed: `${config.seed}-beam-${index}`,
    });
  }
  return generateRandomRuleset({
    baseRules: config.baselineRules,
    bounds: config.bounds,
    steps: config.steps,
    lockedKeys: config.lockedKeys,
    seed: `${config.seed}-random-${index}`,
  });
}

export function runAutopilotSearch(options = {}) {
  const config = normalizeAutopilotConfig(options);
  const startedAt = new Date().toISOString();
  const seen = new Set();
  const results = [];
  const worstCandidates = [];
  const baseline = evaluateCandidate({ rules: config.baselineRules }, config);
  addCandidateResult(results, baseline);
  seen.add(baseline.id);

  const gridRules = config.mode === 'grid'
    ? generateGridRulesets({
        baseRules: config.baselineRules,
        bounds: config.bounds,
        steps: config.steps,
        lockedKeys: config.lockedKeys,
        keys: config.gridKeys,
        limit: config.gridLimit,
      })
    : null;
  const total = config.mode === 'grid' ? Math.min(config.iterations, gridRules.length) : config.iterations;

  for (let index = 0; index < total; index += 1) {
    if (shouldStop(options.abortSignal)) {
      break;
    }
    const rules = config.mode === 'grid'
      ? gridRules[index]
      : nextRulesForMode(config.mode, index, config, results.slice(0, config.beamWidth));
    if (!rules) {
      continue;
    }
    const id = getCandidateId(rules);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    const candidate = evaluateCandidate({ rules }, config);
    addCandidateResult(results, candidate);
    worstCandidates.push(candidate);
    worstCandidates.sort((a, b) => a.objectiveScore - b.objectiveScore);
    worstCandidates.splice(8);
    reportProgress(options.onProgress, {
      type: 'progress',
      completed: index + 1,
      total,
      best: results[0],
      current: candidate,
    });
  }

  const reranked = config.rerank
    ? rerankCandidates(results.slice(0, config.budget.rerankTop), {
        ...config,
        games: config.budget.rerankGames,
        seed: `${config.seed}-rerank`,
        rerank: false,
        validate: false,
      })
    : results.slice(0, config.topN);
  const validated = config.validate
    ? rerankCandidates(reranked.slice(0, config.budget.validateTop), {
        ...config,
        games: config.budget.validateGames,
        seed: `${config.seed}-validate`,
        rerank: false,
        validate: false,
      })
    : reranked;
  const finalCandidates = mergeCandidateLists(validated, reranked, results).slice(0, config.topN);
  const completedAt = new Date().toISOString();
  const report = {
    schemaVersion: AUTOPILOT_SCHEMA_VERSION,
    generatedAt: completedAt,
    startedAt,
    simulatorVersion: 'plundrix-simulator-autopilot-1',
    contract: AUTOPILOT_CONTRACT_METADATA,
    config: publicConfig(config),
    baseline,
    topCandidates: finalCandidates.map((candidate, index) => ({ ...candidate, rank: index + 1 })),
    worstCandidates: worstCandidates.slice(0, 5),
    paretoFrontier: buildParetoFrontier(finalCandidates),
    clusters: clusterCandidates(finalCandidates),
    minimalViablePatch: selectMinimalViablePatch(finalCandidates),
    seedBank: SEED_BANK,
    promotionWorkflow: [
      'discovered',
      'reranked',
      'validated',
      'playtested',
      'approved',
      'implemented',
      'shipped',
      'monitored',
    ],
    changelogEntry: buildBalanceChangelogEntry(finalCandidates[0], baseline),
    ghostBalance: null,
    mutationSummaries: [],
  };
  if (config.includeGhosts) {
    report.ghostBalance = buildGhostAutopilotValidation(report, {
      seed: config.seed,
      games: Math.min(6, Math.max(3, Math.round(config.games / 2))),
      budget: config.budgetName === 'smoke' ? 'smoke' : 'normal',
    });
  }
  if (config.includeMutations) {
    report.mutationSummaries = buildMutationBalanceSummary(report, { limit: 3 });
  }
  report.summary = summarizeAutopilotReport(report);
  return report;
}

export function buildGhostAutopilotValidation(report, options = {}) {
  const best = report.topCandidates?.[0] || report.baseline;
  const ghostReport = runGhostBatch({
    scenario: options.scenario || 'balanced-cast',
    seed: `${options.seed || report.config?.seed || 'autopilot'}-ghosts`,
    budget: options.budget || 'smoke',
    games: options.games || 4,
    rules: best.rules,
    maxRounds: report.config?.maxRounds || 40,
  });
  const ghostBalanceScore = buildGhostBalanceScore(ghostReport);
  return {
    candidateId: best.id,
    ghostReportId: ghostReport.id,
    score: ghostBalanceScore.score,
    archetypeViability: ghostBalanceScore.archetypeViability,
    recommendations: ghostReport.recommendations,
    risks: ghostReport.risks,
    summary: `${best.id} scored ${ghostBalanceScore.score}/100 against Player Telemetry Ghosts.`,
  };
}

function publicConfig(config) {
  const { abortSignal, onProgress, ...rest } = config;
  return rest;
}

function rerankCandidates(candidates, config) {
  return candidates
    .map((candidate) => evaluateCandidate({ rules: candidate.rules }, config))
    .sort((a, b) => b.objectiveScore - a.objectiveScore);
}

function mergeCandidateLists(...lists) {
  const seen = new Set();
  const output = [];
  for (const list of lists) {
    for (const candidate of list) {
      if (!seen.has(candidate.id)) {
        seen.add(candidate.id);
        output.push(candidate);
      }
    }
  }
  return output.sort((a, b) => b.objectiveScore - a.objectiveScore);
}

export function buildParetoFrontier(candidates) {
  return candidates.filter((candidate) => {
    const candidateMetrics = candidateMetricsForPareto(candidate);
    return !candidates.some((other) => {
      if (other.id === candidate.id) return false;
      const otherMetrics = candidateMetricsForPareto(other);
      return (
        otherMetrics.score >= candidateMetrics.score &&
        otherMetrics.fairness >= candidateMetrics.fairness &&
        otherMetrics.comeback >= candidateMetrics.comeback &&
        otherMetrics.tension >= candidateMetrics.tension &&
        otherMetrics.sabotage >= candidateMetrics.sabotage &&
        Object.keys(otherMetrics).some((key) => otherMetrics[key] > candidateMetrics[key])
      );
    });
  });
}

function candidateMetricsForPareto(candidate) {
  return {
    score: candidate.objectiveScore,
    fairness: 1 - average(candidate.scenarios.map((scenario) => scenario.batch.scorecard.winSpread)),
    comeback: average(candidate.scenarios.map((scenario) => scenario.batch.scorecard.comebackRate)),
    tension: average(candidate.scenarios.map((scenario) => average(scenario.batch.summaries.map((summary) => summary.averageTension)) / 100)),
    sabotage: 1 - average(candidate.scenarios.map((scenario) => scenario.batch.actionValue.wastedSabotageRate)),
  };
}

export function clusterCandidates(candidates) {
  const clusters = [];
  for (const candidate of candidates) {
    const signature = candidate.changedKeys.sort().join(',') || 'contract-defaults';
    let cluster = clusters.find((item) => item.signature === signature);
    if (!cluster) {
      cluster = { signature, candidates: [], representative: null };
      clusters.push(cluster);
    }
    cluster.candidates.push(candidate.id);
    if (!cluster.representative || candidate.objectiveScore > cluster.representative.objectiveScore) {
      cluster.representative = candidate;
    }
  }
  return clusters.map((cluster) => ({
    signature: cluster.signature,
    size: cluster.candidates.length,
    candidateIds: cluster.candidates,
    representativeId: cluster.representative.id,
    representativeScore: cluster.representative.objectiveScore,
  }));
}

export function selectMinimalViablePatch(candidates, threshold = 75) {
  return candidates
    .filter((candidate) => candidate.viability.pass && candidate.objectiveScore >= threshold)
    .sort((a, b) => a.changedKeyCount - b.changedKeyCount || b.objectiveScore - a.objectiveScore)[0] || null;
}

function summarizeAutopilotReport(report) {
  const best = report.topCandidates[0];
  return {
    bestCandidateId: best?.id || null,
    bestScore: best?.objectiveScore || 0,
    bestReadiness: best?.shipReadiness || 'none',
    baselineScore: report.baseline.objectiveScore,
    scoreDelta: best ? best.objectiveScore - report.baseline.objectiveScore : 0,
    candidateCount: report.topCandidates.length,
    warning: AUTOPILOT_CONTRACT_METADATA.deployedBehaviorNote,
  };
}

function buildBalanceChangelogEntry(best, baseline) {
  if (!best) {
    return 'No candidate selected.';
  }
  const delta = best.objectiveScore - baseline.objectiveScore;
  return `${best.id} scored ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} vs baseline with ${best.changedKeys.length} changed knobs: ${best.changedKeys.join(', ') || 'none'}.`;
}

export function findInterestingSeeds(options = {}) {
  const config = normalizeAutopilotConfig({
    ...options,
    scenarios: options.scenarios || ['new-player-table', 'comeback-test', 'stall-test'],
    games: 1,
    rerank: false,
    validate: false,
  });
  const mode = options.kind || 'exciting';
  const iterations = Number(options.iterations || 50);
  const seeds = [];
  for (let index = 0; index < iterations; index += 1) {
    const seed = `${config.seed}-seed-${index + 1}`;
    const batch = runBatch({
      games: 1,
      seed,
      scenarioId: config.scenarios[index % config.scenarios.length],
      strategies: config.strategies,
      strategyProfile: config.strategyProfile,
      maxRounds: config.maxRounds,
      rules: config.baselineRules,
    });
    const summary = batch.summaries[0];
    const excitingScore =
      summary.leadChanges * 8 +
      summary.nearWinMoments * 5 +
      summary.averageTension +
      (summary.comeback ? 25 : 0);
    const brokenScore =
      (summary.rounds < 6 ? 40 : 0) +
      (summary.rounds > 30 ? 40 : 0) +
      (summary.runaway ? 25 : 0) +
      summary.wastedSabotages * 3;
    seeds.push({
      seed,
      scenarioId: batch.summaries[0].scenarioId,
      score: mode === 'broken' ? brokenScore : excitingScore,
      summary,
      replayLink: buildReplayLink({
        seed,
        scenarioId: batch.summaries[0].scenarioId,
        strategies: config.strategies,
        rules: config.baselineRules,
      }),
    });
  }
  return seeds.sort((a, b) => b.score - a.score).slice(0, Number(options.limit || 10));
}

export function exportAutopilotCsv(report) {
  const rows = [
    [
      'rank',
      'id',
      'score',
      'shipReadiness',
      'implementationCost',
      'changedKeys',
      'totalLocks',
      'maxTools',
      'pickBaseChance',
      'pickToolBonus',
      'pickChanceCap',
      'searchChance',
      'stunnedSearchChance',
      'scenarioVariance',
    ],
    ...report.topCandidates.map((candidate) => [
      candidate.rank,
      candidate.id,
      candidate.objectiveScore.toFixed(3),
      candidate.shipReadiness,
      candidate.implementationCost,
      candidate.changedKeys.join('|'),
      candidate.rules.totalLocks,
      candidate.rules.maxTools,
      candidate.rules.pickBaseChance,
      candidate.rules.pickToolBonus,
      candidate.rules.pickChanceCap,
      candidate.rules.searchChance,
      candidate.rules.stunnedSearchChance,
      candidate.scenarioScoreVariance.toFixed(3),
    ]),
  ];
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell);
          return text.includes(',') ? `"${text.replaceAll('"', '""')}"` : text;
        })
        .join(','),
    )
    .join('\n');
}

export function exportAutopilotJson(report) {
  return JSON.stringify(report, null, 2);
}

export function exportAutopilotMarkdown(report) {
  const best = report.topCandidates[0];
  const lines = [
    '# Plundrix Balance Autopilot Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Schema: ${report.schemaVersion}`,
    `Best candidate: ${best?.id || 'none'}`,
    `Best score: ${best ? best.objectiveScore.toFixed(2) : '0.00'}`,
    `Baseline score: ${report.baseline.objectiveScore.toFixed(2)}`,
    `Readiness: ${best?.shipReadiness || 'none'}`,
    '',
    '## Contract Note',
    '',
    report.contract.deployedBehaviorNote,
    '',
    '## Top Candidates',
    '',
    '| Rank | Candidate | Score | Readiness | Changed Knobs | Avg Scenario Score |',
    '| --- | --- | ---: | --- | --- | ---: |',
    ...report.topCandidates.map((candidate) => {
      const scenarioScore = average(candidate.scenarios.map((scenario) => scenario.objectiveScore));
      return `| ${candidate.rank} | ${candidate.id} | ${candidate.objectiveScore.toFixed(2)} | ${candidate.shipReadiness} | ${candidate.changedKeys.join(', ') || 'none'} | ${scenarioScore.toFixed(2)} |`;
    }),
    '',
    '## Best Candidate Rules',
    '',
    '```json',
    JSON.stringify(best?.rules || {}, null, 2),
    '```',
    '',
    '## Scenario Breakdown',
    '',
    ...(best?.scenarios || []).flatMap((scenario) => [
      `### ${scenario.scenarioId}`,
      '',
      `Score: ${scenario.objectiveScore.toFixed(2)}`,
      `Grade: ${scenario.batch.scorecard.grade}`,
      `Average rounds: ${scenario.batch.scorecard.averageRounds.toFixed(2)}`,
      `Win spread: ${(scenario.batch.scorecard.winSpread * 100).toFixed(1)}%`,
      `Comeback rate: ${(scenario.batch.scorecard.comebackRate * 100).toFixed(1)}%`,
      `Runaway rate: ${(scenario.batch.scorecard.runawayRate * 100).toFixed(1)}%`,
      '',
    ]),
    '## Do Not Ship Candidates',
    '',
    ...report.worstCandidates.map((candidate) => `- ${candidate.id}: ${candidate.objectiveScore.toFixed(2)} (${candidate.riskExplanation})`),
    '',
    ...(report.ghostBalance ? [
      '## Player Telemetry Ghosts',
      '',
      `Ghost balance score: ${report.ghostBalance.score}/100`,
      ...report.ghostBalance.archetypeViability.map((item) => `- ${item.label}: ${item.viable ? 'viable' : 'risk'} (${item.healthScore})`),
      '',
    ] : []),
    ...(report.mutationSummaries?.length ? [
      '## Rule Mutation Time Machine',
      '',
      ...report.mutationSummaries.map((item) => `- ${item.candidateId}: ${item.mutationScore}/100 (${item.mutationVerdict}), ghost delta ${item.ghostDelta}, drama delta ${item.dramaDelta.toFixed(1)}, ${item.contractImpact}`),
      '',
    ] : []),
    '## Promotion Workflow',
    '',
    ...report.promotionWorkflow.map((step, index) => `${index + 1}. ${step}`),
    '',
  ];
  return lines.join('\n');
}

function buildReplayLink(options = {}) {
  const params = new URLSearchParams();
  params.set('seed', options.seed || 'balance-autopilot');
  params.set('players', String(options.playerCount || 4));
  if (options.scenarioId) params.set('scenario', options.scenarioId);
  if (options.strategies?.length) params.set('strategies', options.strategies.join(','));
  if (options.rules) params.set('rules', encodePortableBase64(JSON.stringify(normalizeRuleset(options.rules))));
  return `/simulator?${params.toString()}`;
}

function encodePortableBase64(text) {
  if (typeof btoa === 'function') {
    return btoa(text);
  }
  return Buffer.from(text, 'utf8').toString('base64');
}

export function saveExperiment(name, report) {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  const key = `plundrix-autopilot-experiment:${name}`;
  localStorage.setItem(key, exportAutopilotJson(report));
  return true;
}

export function loadExperiment(name) {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const key = `plundrix-autopilot-experiment:${name}`;
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}

export function listExperiments() {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  return Object.keys(localStorage)
    .filter((key) => key.startsWith('plundrix-autopilot-experiment:'))
    .map((key) => key.replace('plundrix-autopilot-experiment:', ''));
}

export function importExperimentJson(text) {
  const parsed = JSON.parse(text);
  if (parsed.schemaVersion !== AUTOPILOT_SCHEMA_VERSION) {
    throw new Error(`Unsupported autopilot schema version: ${parsed.schemaVersion}`);
  }
  return parsed;
}

export function buildAutopilotCsvFromBatch(batchResult) {
  return exportBatchCsv(batchResult);
}

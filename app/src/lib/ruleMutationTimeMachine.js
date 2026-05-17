import {
  SIM_DEFAULT_RULES,
  buildFunCurve,
  normalizeRuleset,
  runSimulation,
  summarizeSimulation,
} from './plundrixEngine.js';
import {
  bestReplayFrame,
  buildReplayFromSimulation,
} from './replayDirector.js';
import {
  buildGhostBalanceScore,
  generateGhostRoster,
  runGhostBatch,
  runGhostMatch,
} from './playerTelemetryGhosts.js';

export const MUTATION_SCHEMA_VERSION = 1;
export const MUTATION_SESSION_KEY = 'plundrix-rule-mutation-sessions:v1';
export const MUTATION_REPORT_KEY = 'plundrix-rule-mutation-reports:v1';
export const MUTATION_PINNED_KEY = 'plundrix-rule-mutation-pinned:v1';

export const MUTATION_SOURCES = Object.freeze([
  'manual-rule-edit',
  'replay-seed',
  'ghost-cast',
  'balance-candidate',
  'launch-packet',
  'preset-experiment',
]);

export const MUTATION_DIMENSIONS = Object.freeze([
  'outcome',
  'pacing',
  'tension',
  'fairness',
  'replay-drama',
  'ghost-archetype-health',
  'launch-readiness',
  'contract-impact',
  'player-agency',
]);

export const MUTATION_BUDGETS = Object.freeze({
  smoke: {
    seeds: 1,
    presets: ['faster-games', 'more-comeback', 'less-sabotage-fatigue', 'contract-minimal'],
    ghostGames: 3,
    maxRounds: 36,
  },
  normal: {
    seeds: 4,
    presets: ['faster-games', 'slower-games', 'more-comeback', 'less-sabotage-fatigue', 'more-tool-economy', 'less-tool-hoarding', 'clutch-endings', 'safer-onboarding', 'high-drama', 'contract-minimal'],
    ghostGames: 8,
    maxRounds: 44,
  },
  deep: {
    seeds: 16,
    presets: ['faster-games', 'slower-games', 'more-comeback', 'less-sabotage-fatigue', 'more-tool-economy', 'less-tool-hoarding', 'clutch-endings', 'safer-onboarding', 'high-drama', 'contract-minimal'],
    ghostGames: 24,
    maxRounds: 60,
  },
});

export const MUTATION_PRESETS = Object.freeze({
  'faster-games': preset({
    id: 'faster-games',
    label: 'Faster games',
    description: 'Increase pick reliability so vault races resolve sooner.',
    patch: { pickBaseChance: 45, pickToolBonus: 20 },
    intendedEffect: 'Shorter games and more decisive picking.',
    expectedRisk: 'Fast finishes and reduced comeback time.',
    contractImpactEstimate: 'contract constant change',
  }),
  'slower-games': preset({
    id: 'slower-games',
    label: 'Slower games',
    description: 'Reduce pick reliability to give search and sabotage more time.',
    patch: { pickBaseChance: 35, pickToolBonus: 10 },
    intendedEffect: 'Longer strategic arc.',
    expectedRisk: 'Stalls and tool hoarding.',
    contractImpactEstimate: 'contract constant change',
  }),
  'more-comeback': preset({
    id: 'more-comeback',
    label: 'More comeback',
    description: 'Improve stunned search and reduce runaway pressure.',
    patch: { stunnedSearchChance: 45, searchChance: 65 },
    intendedEffect: 'Trailing players can rebuild agency.',
    expectedRisk: 'Rubber-banding and longer games.',
    contractImpactEstimate: 'contract constant change',
  }),
  'less-sabotage-fatigue': preset({
    id: 'less-sabotage-fatigue',
    label: 'Less sabotage fatigue',
    description: 'Lower max tools so sabotage has fewer endless theft targets.',
    patch: { maxTools: 4, stunnedSearchChance: 35 },
    intendedEffect: 'Less inventory bloat and lower repeated-stun fatigue.',
    expectedRisk: 'Tool builders may feel weaker.',
    contractImpactEstimate: 'contract constant change',
  }),
  'more-tool-economy': preset({
    id: 'more-tool-economy',
    label: 'More tool economy',
    description: 'Make searching stronger and tools more valuable.',
    patch: { searchChance: 70, pickToolBonus: 20 },
    intendedEffect: 'Clearer search payoff.',
    expectedRisk: 'Tool hoarding may dominate.',
    contractImpactEstimate: 'contract constant change',
  }),
  'less-tool-hoarding': preset({
    id: 'less-tool-hoarding',
    label: 'Less tool hoarding',
    description: 'Cap tools lower while keeping pick odds readable.',
    patch: { maxTools: 3, pickChanceCap: 90 },
    intendedEffect: 'Inventory builders must convert sooner.',
    expectedRisk: 'Search can feel less rewarding.',
    contractImpactEstimate: 'contract constant change',
  }),
  'clutch-endings': preset({
    id: 'clutch-endings',
    label: 'Clutch endings',
    description: 'Slightly increase pick cap and comeback search to create final-round swings.',
    patch: { pickChanceCap: 98, stunnedSearchChance: 40 },
    intendedEffect: 'More near-win reversals and final lock drama.',
    expectedRisk: 'Endgame volatility.',
    contractImpactEstimate: 'contract constant change',
  }),
  'safer-onboarding': preset({
    id: 'safer-onboarding',
    label: 'Safer onboarding',
    description: 'Make baseline picks and searches more forgiving.',
    patch: { pickBaseChance: 45, searchChance: 70, stunnedSearchChance: 40 },
    intendedEffect: 'New players see progress more often.',
    expectedRisk: 'Lower punishment and faster runaway wins.',
    contractImpactEstimate: 'contract constant change',
  }),
  'high-drama': preset({
    id: 'high-drama',
    label: 'High drama',
    description: 'Push search, clutch, and cap values for bigger reversals.',
    patch: { searchChance: 70, stunnedSearchChance: 45, pickChanceCap: 98 },
    intendedEffect: 'Higher replay drama and stronger comeback arcs.',
    expectedRisk: 'Swinginess can feel unfair.',
    contractImpactEstimate: 'contract constant change',
  }),
  'contract-minimal': preset({
    id: 'contract-minimal',
    label: 'Contract minimal',
    description: 'A tiny pick-base nudge for low-risk comparison.',
    patch: { pickBaseChance: 42 },
    intendedEffect: 'Measure sensitivity with the smallest practical rule change.',
    expectedRisk: 'May be too small to matter.',
    contractImpactEstimate: 'contract constant change',
  }),
});

function preset(input) {
  return Object.freeze(input);
}

function nowIso() {
  return new Date().toISOString();
}

function hashString(input) {
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function safeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function applyRulePatch(baseRules = SIM_DEFAULT_RULES, patch = {}) {
  const base = normalizeRuleset(baseRules);
  const next = { ...base };
  for (const [key, value] of Object.entries(patch || {})) {
    if (!(key in base)) continue;
    if (!Number.isFinite(Number(value))) {
      throw new Error(`Invalid rule value for ${key}: ${value}`);
    }
    next[key] = Number(value);
  }
  return normalizeRuleset(next);
}

export function diffRules(baseRules = SIM_DEFAULT_RULES, candidateRules = SIM_DEFAULT_RULES) {
  const base = normalizeRuleset(baseRules);
  const candidate = normalizeRuleset(candidateRules);
  return Object.keys(base)
    .filter((key) => base[key] !== candidate[key])
    .map((key) => ({
      key,
      before: base[key],
      after: candidate[key],
      delta: candidate[key] - base[key],
      direction: candidate[key] > base[key] ? 'up' : 'down',
    }));
}

export function invertRulePatch(baseRules, candidateRules) {
  return Object.fromEntries(diffRules(baseRules, candidateRules).map((item) => [item.key, item.before]));
}

export function describeRuleDiff(diff = []) {
  if (!diff.length) return 'No rule changes.';
  return diff.map((item) => `${ruleLabel(item.key)} ${item.before} -> ${item.after}`).join('; ');
}

function ruleLabel(key) {
  return {
    totalLocks: 'Total locks',
    maxTools: 'Max tools',
    pickBaseChance: 'Pick base chance',
    pickToolBonus: 'Pick tool bonus',
    pickChanceCap: 'Pick chance cap',
    searchChance: 'Search chance',
    stunnedSearchChance: 'Stunned search chance',
    minHealthyRounds: 'Min healthy rounds',
    maxHealthyRounds: 'Max healthy rounds',
    runawayLeadRound: 'Runaway lead round',
    runawayLeadLocks: 'Runaway lead locks',
  }[key] || key;
}

export function getRuleContractImpact(diff = []) {
  if (!diff.length) {
    return { level: 'no change', severity: 0, requiresDeploymentNote: false, summary: 'No rule change.' };
  }
  const contractConstants = new Set(['totalLocks', 'maxTools', 'pickBaseChance', 'pickToolBonus', 'pickChanceCap', 'searchChance', 'stunnedSearchChance']);
  const behaviorKeys = new Set(['totalLocks', 'maxTools']);
  const changed = diff.map((item) => item.key);
  if (changed.some((key) => behaviorKeys.has(key))) {
    return {
      level: 'contract behavior change',
      severity: 4,
      requiresDeploymentNote: true,
      summary: 'Core contract behavior changes and needs deployment review.',
    };
  }
  if (changed.some((key) => contractConstants.has(key))) {
    return {
      level: 'contract constant change',
      severity: 3,
      requiresDeploymentNote: true,
      summary: 'Contract constants change and require upgrade or redeploy before production.',
    };
  }
  return {
    level: 'UI/simulator only',
    severity: 1,
    requiresDeploymentNote: false,
    summary: 'Only simulator health thresholds changed.',
  };
}

function budgetConfig(name = 'smoke') {
  return MUTATION_BUDGETS[name] || MUTATION_BUDGETS.smoke;
}

export function buildMutationScenario(options = {}) {
  const presetId = options.preset || 'faster-games';
  const presetConfig = MUTATION_PRESETS[presetId] || MUTATION_PRESETS['faster-games'];
  const baselineRules = normalizeRuleset(options.baselineRules || SIM_DEFAULT_RULES);
  const explicitPatch = options.patch && Object.keys(options.patch).length ? options.patch : null;
  const candidateRules = normalizeRuleset(options.candidateRules || applyRulePatch(baselineRules, explicitPatch || presetConfig.patch));
  const scenario = {
    schemaVersion: MUTATION_SCHEMA_VERSION,
    id: options.id || `mutation-scenario-${hashString(JSON.stringify({ presetId, seed: options.seed || 'mutation', baselineRules, candidateRules })).toString(16)}`,
    sourceType: options.sourceType || 'preset-experiment',
    presetId,
    preset: presetConfig,
    seed: options.seed || 'mutation-time-machine',
    simulatorScenarioId: options.scenarioId || options.scenario || 'new-player-table',
    ghostScenario: options.ghostScenario || 'balanced-cast',
    strategies: options.strategies || ['balanced', 'picker', 'searcher', 'saboteur'],
    ghostRoster: options.ghostRoster || null,
    baselineRules,
    candidateRules,
    metadata: options.metadata || {},
    maxRounds: Number(options.maxRounds || budgetConfig(options.budget).maxRounds),
    budget: options.budget || 'smoke',
  };
  validateMutationScenario(scenario);
  return scenario;
}

export function runRuleMutationComparison(options = {}) {
  const scenario = options.schemaVersion === MUTATION_SCHEMA_VERSION ? options : buildMutationScenario(options);
  const baselineState = runSimulation({
    seed: scenario.seed,
    scenarioId: scenario.simulatorScenarioId,
    strategies: scenario.strategies,
    rules: scenario.baselineRules,
    maxRounds: scenario.maxRounds,
  });
  const candidateState = runSimulation({
    seed: scenario.seed,
    scenarioId: scenario.simulatorScenarioId,
    strategies: scenario.strategies,
    rules: scenario.candidateRules,
    maxRounds: scenario.maxRounds,
  });
  const baselineReplay = buildReplayFromSimulation(baselineState, {
    sourceType: 'rule mutation baseline',
    strategies: scenario.strategies,
    maxRounds: scenario.maxRounds,
  });
  const candidateReplay = buildReplayFromSimulation(candidateState, {
    sourceType: 'rule mutation candidate',
    strategies: scenario.strategies,
    maxRounds: scenario.maxRounds,
  });
  const baselineGhost = buildGhostComparisonMatch(scenario, scenario.baselineRules, 'baseline');
  const candidateGhost = buildGhostComparisonMatch(scenario, scenario.candidateRules, 'candidate');
  const simulation = compareSimulationSummaries(summarizeSimulation(baselineState), summarizeSimulation(candidateState));
  const tension = compareTensionCurves(baselineState, candidateState);
  const replay = compareReplayDrama(baselineReplay, candidateReplay);
  const ghosts = compareGhostHealth(baselineGhost, candidateGhost);
  const diff = diffRules(scenario.baselineRules, scenario.candidateRules);
  const contractImpact = getRuleContractImpact(diff);
  const comparison = {
    schemaVersion: MUTATION_SCHEMA_VERSION,
    id: `mutation-comparison-${hashString(`${scenario.id}:${scenario.seed}`).toString(16)}`,
    generatedAt: nowIso(),
    scenario,
    baseline: {
      state: baselineState,
      summary: summarizeSimulation(baselineState),
      replay: summarizeReplayForReport(baselineReplay),
      ghost: summarizeGhostForReport(baselineGhost),
    },
    candidate: {
      state: candidateState,
      summary: summarizeSimulation(candidateState),
      replay: summarizeReplayForReport(candidateReplay),
      ghost: summarizeGhostForReport(candidateGhost),
    },
    ruleDiff: diff,
    ruleDiffDescription: describeRuleDiff(diff),
    rollbackPatch: invertRulePatch(scenario.baselineRules, scenario.candidateRules),
    contractImpact,
    simulation,
    tension,
    replay,
    ghosts,
    score: null,
    verdict: null,
    recommendation: null,
    replayLinks: {
      baseline: baselineReplay.shareUrl,
      candidate: candidateReplay.shareUrl,
      better: replay.delta.dramaticScore >= 0 ? candidateReplay.shareUrl : baselineReplay.shareUrl,
    },
  };
  comparison.score = scoreMutationImpact(comparison);
  comparison.verdict = verdictForScore(comparison.score.total, contractImpact, comparison);
  comparison.recommendation = buildMutationRecommendation(comparison);
  validateMutationComparison(comparison);
  return comparison;
}

function buildGhostComparisonMatch(scenario, rules, label) {
  const roster = scenario.ghostRoster || generateGhostRoster(scenario.seed, 4, { scenario: scenario.ghostScenario });
  return runGhostMatch({
    scenario: scenario.ghostScenario,
    seed: `${scenario.seed}-${label}-ghost`,
    roster,
    simulatorScenarioId: scenario.simulatorScenarioId,
    rules,
    maxRounds: scenario.maxRounds,
  });
}

function summarizeReplayForReport(replay) {
  return {
    id: replay.id,
    title: replay.title,
    dramaticScore: replay.dramaticScore,
    highlightCount: replay.highlights.length,
    topHighlightType: replay.highlights[0]?.type || null,
    marketingUsable: Boolean(replay.marketingProof?.usable),
    storyBeatCount: replay.beats.length,
    bestFrame: bestReplayFrame(replay),
    shareUrl: replay.shareUrl,
  };
}

function summarizeGhostForReport(match) {
  return {
    matchId: match.id,
    score: match.matchScore.score,
    grade: match.matchScore.grade,
    funContribution: match.matchScore.funContribution,
    frustrationRisk: match.matchScore.frustrationRisk,
    stayedInCharacter: match.matchScore.stayedInCharacter,
    behavior: match.behavior.map((item) => ({
      archetypeId: item.declaredArchetype,
      label: item.declaredLabel,
      playerName: item.playerName,
      won: item.won,
      funContribution: item.funContribution,
      frustrationRisk: item.frustrationRisk,
      stayedInCharacterScore: item.stayedInCharacterScore,
    })),
  };
}

export function compareSimulationSummaries(baseline, candidate) {
  return {
    winnerChanged: baseline.winner !== candidate.winner,
    baselineWinner: baseline.winnerName,
    candidateWinner: candidate.winnerName,
    roundDelta: candidate.rounds - baseline.rounds,
    completionChanged: baseline.completed !== candidate.completed,
    comebackChanged: baseline.comeback !== candidate.comeback,
    runawayChanged: baseline.runaway !== candidate.runaway,
    leadChangeDelta: candidate.leadChanges - baseline.leadChanges,
    averageTensionDelta: candidate.averageTension - baseline.averageTension,
    nearWinDelta: candidate.nearWinMoments - baseline.nearWinMoments,
    stunDelta: candidate.stunMoments - baseline.stunMoments,
    actionDelta: {
      picks: candidate.picks - baseline.picks,
      searches: candidate.searches - baseline.searches,
      sabotages: candidate.sabotages - baseline.sabotages,
      wastedSabotages: candidate.wastedSabotages - baseline.wastedSabotages,
    },
    actionValueDelta: {
      pick: candidate.actionValue.pick - baseline.actionValue.pick,
      search: candidate.actionValue.search - baseline.actionValue.search,
      sabotage: candidate.actionValue.sabotage - baseline.actionValue.sabotage,
    },
  };
}

export function compareTensionCurves(baselineState, candidateState) {
  const baseline = buildFunCurve(baselineState);
  const candidate = buildFunCurve(candidateState);
  const max = Math.max(baseline.length, candidate.length);
  const rounds = Array.from({ length: max }, (_, index) => {
    const baselinePoint = baseline[index] || baseline[baseline.length - 1] || { tension: 0 };
    const candidatePoint = candidate[index] || candidate[candidate.length - 1] || { tension: 0 };
    return {
      round: index + 1,
      baselineTension: baselinePoint.tension || 0,
      candidateTension: candidatePoint.tension || 0,
      delta: (candidatePoint.tension || 0) - (baselinePoint.tension || 0),
    };
  });
  const biggest = [...rounds].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0] || null;
  return {
    rounds,
    biggestDivergenceRound: biggest?.round || null,
    biggestDivergenceDelta: biggest?.delta || 0,
    averageDelta: average(rounds.map((round) => round.delta)),
    endingDelta: (rounds[rounds.length - 1]?.delta) || 0,
  };
}

export function compareReplayDrama(baselineReplay, candidateReplay) {
  const baselineFrame = bestReplayFrame(baselineReplay);
  const candidateFrame = bestReplayFrame(candidateReplay);
  return {
    baseline: summarizeReplayForReport(baselineReplay),
    candidate: summarizeReplayForReport(candidateReplay),
    delta: {
      dramaticScore: candidateReplay.dramaticScore - baselineReplay.dramaticScore,
      highlightCount: candidateReplay.highlights.length - baselineReplay.highlights.length,
      storyBeatCount: candidateReplay.beats.length - baselineReplay.beats.length,
      marketingUsable: Number(Boolean(candidateReplay.marketingProof?.usable)) - Number(Boolean(baselineReplay.marketingProof?.usable)),
    },
    topHighlightChanged: baselineReplay.highlights[0]?.type !== candidateReplay.highlights[0]?.type,
    bestCaptureFrameChanged: baselineFrame?.frame !== candidateFrame?.frame,
  };
}

export function compareGhostHealth(baselineMatch, candidateMatch) {
  const byArchetype = new Map();
  for (const item of baselineMatch.behavior) {
    byArchetype.set(item.declaredArchetype, { archetypeId: item.declaredArchetype, label: item.declaredLabel, baseline: item, candidate: null });
  }
  for (const item of candidateMatch.behavior) {
    const entry = byArchetype.get(item.declaredArchetype) || { archetypeId: item.declaredArchetype, label: item.declaredLabel, baseline: null, candidate: null };
    entry.candidate = item;
    byArchetype.set(item.declaredArchetype, entry);
  }
  const archetypeDeltas = [...byArchetype.values()].map((entry) => ({
    archetypeId: entry.archetypeId,
    label: entry.label,
    healthDelta: ghostHealth(entry.candidate) - ghostHealth(entry.baseline),
    winRateDelta: Number(Boolean(entry.candidate?.won)) - Number(Boolean(entry.baseline?.won)),
    funDelta: (entry.candidate?.funContribution || 0) - (entry.baseline?.funContribution || 0),
    frustrationDelta: (entry.candidate?.frustrationRisk || 0) - (entry.baseline?.frustrationRisk || 0),
    characterDelta: (entry.candidate?.stayedInCharacterScore || 0) - (entry.baseline?.stayedInCharacterScore || 0),
  }));
  const baselineScore = baselineMatch.matchScore.score;
  const candidateScore = candidateMatch.matchScore.score;
  const baselineHealthiest = [...baselineMatch.behavior].sort((a, b) => ghostHealth(b) - ghostHealth(a))[0];
  const candidateHealthiest = [...candidateMatch.behavior].sort((a, b) => ghostHealth(b) - ghostHealth(a))[0];
  const baselineRiskiest = [...baselineMatch.behavior].sort((a, b) => b.frustrationRisk - a.frustrationRisk)[0];
  const candidateRiskiest = [...candidateMatch.behavior].sort((a, b) => b.frustrationRisk - a.frustrationRisk)[0];
  return {
    baselineScore,
    candidateScore,
    scoreDelta: candidateScore - baselineScore,
    frustrationDelta: candidateMatch.matchScore.frustrationRisk - baselineMatch.matchScore.frustrationRisk,
    archetypeDeltas,
    healthiestArchetypeChanged: baselineHealthiest?.declaredArchetype !== candidateHealthiest?.declaredArchetype,
    riskiestArchetypeChanged: baselineRiskiest?.declaredArchetype !== candidateRiskiest?.declaredArchetype,
    baselineHealthiest: baselineHealthiest?.declaredLabel || null,
    candidateHealthiest: candidateHealthiest?.declaredLabel || null,
    baselineRiskiest: baselineRiskiest?.declaredLabel || null,
    candidateRiskiest: candidateRiskiest?.declaredLabel || null,
  };
}

function ghostHealth(item) {
  if (!item) return 0;
  return clamp(item.funContribution * 0.4 + item.stayedInCharacterScore * 0.3 + (100 - item.frustrationRisk) * 0.3, 0, 100);
}

export function scoreMutationImpact(comparison) {
  const roundTarget = 14;
  const pacingDelta = -Math.abs(roundTarget - comparison.candidate.summary.rounds) + Math.abs(roundTarget - comparison.baseline.summary.rounds);
  const funDelta = comparison.simulation.averageTensionDelta + comparison.simulation.nearWinDelta * 3 + comparison.simulation.leadChangeDelta * 4;
  const fairnessDelta = (comparison.simulation.runawayChanged && comparison.candidate.summary.runaway ? -12 : 0) + (comparison.candidate.summary.comeback ? 6 : 0);
  const dramaDelta = comparison.replay.delta.dramaticScore;
  const ghostHealthDelta = comparison.ghosts.scoreDelta;
  const frustrationDelta = -comparison.ghosts.frustrationDelta;
  const contractRiskPenalty = comparison.contractImpact.severity * 5;
  const launchReadinessPenalty = comparison.contractImpact.requiresDeploymentNote ? 8 : 0;
  const total = Math.round(clamp(
    55 +
      funDelta * 0.22 +
      pacingDelta * 2 +
      fairnessDelta +
      dramaDelta * 0.28 +
      ghostHealthDelta * 0.32 +
      frustrationDelta * 0.22 -
      contractRiskPenalty -
      launchReadinessPenalty,
    0,
    100,
  ));
  return {
    total,
    components: {
      funDelta,
      pacingDelta,
      fairnessDelta,
      dramaDelta,
      ghostHealthDelta,
      frustrationDelta,
      contractRiskPenalty,
      launchReadinessPenalty,
    },
  };
}

function verdictForScore(score, contractImpact, comparison) {
  if (score >= 82 && contractImpact.severity <= 2) return 'ship candidate';
  if (score >= 72) return 'playtest candidate';
  if (score >= 58 && comparison.ghosts.frustrationDelta <= 12) return 'investigate';
  if (score >= 42) return 'risky';
  return 'reject';
}

export function buildMutationRecommendation(comparison) {
  const improvements = [];
  const regressions = [];
  if (comparison.replay.delta.dramaticScore > 0) improvements.push(`replay drama +${comparison.replay.delta.dramaticScore.toFixed(1)}`);
  if (comparison.ghosts.scoreDelta > 0) improvements.push(`ghost health +${comparison.ghosts.scoreDelta}`);
  if (comparison.simulation.averageTensionDelta > 0) improvements.push(`tension +${comparison.simulation.averageTensionDelta.toFixed(1)}`);
  if (comparison.ghosts.frustrationDelta > 0) regressions.push(`frustration +${comparison.ghosts.frustrationDelta}`);
  if (comparison.candidate.summary.runaway && !comparison.baseline.summary.runaway) regressions.push('new runaway outcome');
  if (comparison.contractImpact.requiresDeploymentNote) regressions.push(comparison.contractImpact.level);
  const archetypeChanges = comparison.ghosts.archetypeDeltas
    .filter((item) => Math.abs(item.healthDelta) >= 8)
    .map((item) => `${item.label} ${item.healthDelta >= 0 ? '+' : ''}${Math.round(item.healthDelta)}`);
  return {
    summary: `${comparison.verdict}: ${improvements.join(', ') || 'no major gains'}; ${regressions.join(', ') || 'no major regressions'}.`,
    improved: improvements,
    regressed: regressions,
    archetypeChanges,
    deeperValidation: comparison.verdict === 'playtest candidate' || comparison.verdict === 'investigate',
    contractWorkRequired: comparison.contractImpact.requiresDeploymentNote,
    nextCommand: comparison.verdict === 'reject'
      ? 'npm run mutate:matrix -- --budget smoke --markdown'
      : 'npm run mutate:rules -- --budget normal --markdown',
  };
}

export function generateMutationReport(options = {}) {
  const comparison = runRuleMutationComparison(options);
  const report = {
    schemaVersion: MUTATION_SCHEMA_VERSION,
    id: `mutation-report-${hashString(`${comparison.id}:${comparison.generatedAt}`).toString(16)}`,
    generatedAt: comparison.generatedAt,
    scenario: comparison.scenario,
    comparison,
    score: comparison.score,
    verdict: comparison.verdict,
    recommendation: comparison.recommendation,
    exports: {},
  };
  report.exports = {
    markdown: exportMutationReportMarkdown(report),
    json: exportMutationReportJson(report),
    ruleDiffCsv: exportRuleDiffCsv(report.comparison.ruleDiff),
  };
  validateMutationReport(report);
  return report;
}

export function generateMutationMatrix(options = {}) {
  const budget = budgetConfig(options.budget || 'smoke');
  const presetIds = options.presets || budget.presets;
  const rows = presetIds.map((presetId) => {
    const report = generateMutationReport({
      ...options,
      preset: presetId,
      budget: options.budget || 'smoke',
      seed: `${options.seed || 'mutation-matrix'}-${presetId}`,
    });
    return {
      preset: presetId,
      label: MUTATION_PRESETS[presetId]?.label || presetId,
      reportId: report.id,
      score: report.score.total,
      verdict: report.verdict,
      roundDelta: report.comparison.simulation.roundDelta,
      dramaDelta: report.comparison.replay.delta.dramaticScore,
      ghostDelta: report.comparison.ghosts.scoreDelta,
      frustrationDelta: report.comparison.ghosts.frustrationDelta,
      contractImpact: report.comparison.contractImpact.level,
      recommendation: report.recommendation.summary,
      report,
    };
  }).sort((a, b) => b.score - a.score);
  return {
    schemaVersion: MUTATION_SCHEMA_VERSION,
    id: `mutation-matrix-${hashString(`${options.seed || 'matrix'}:${presetIds.join('|')}`).toString(16)}`,
    generatedAt: nowIso(),
    budget: options.budget || 'smoke',
    rows,
    best: rows[0] || null,
    worst: rows[rows.length - 1] || null,
    safestContractMinimal: rows.find((row) => row.contractImpact !== 'contract behavior change') || rows[0] || null,
    highestDrama: [...rows].sort((a, b) => b.dramaDelta - a.dramaDelta)[0] || null,
    lowestFrustration: [...rows].sort((a, b) => a.frustrationDelta - b.frustrationDelta)[0] || null,
  };
}

export function buildMutationBalanceSummary(autopilotReport, options = {}) {
  const top = autopilotReport.topCandidates?.slice(0, options.limit || 3) || [];
  return top.map((candidate) => {
    const report = generateMutationReport({
      seed: `${autopilotReport.config?.seed || 'autopilot'}-${candidate.id}`,
      scenario: autopilotReport.config?.scenarios?.[0] || 'new-player-table',
      baselineRules: autopilotReport.baseline.rules,
      candidateRules: candidate.rules,
      sourceType: 'balance-candidate',
      metadata: { candidateId: candidate.id },
      budget: 'smoke',
    });
    return {
      candidateId: candidate.id,
      mutationScore: report.score.total,
      mutationVerdict: report.verdict,
      contractImpact: report.comparison.contractImpact.level,
      ghostDelta: report.comparison.ghosts.scoreDelta,
      dramaDelta: report.comparison.replay.delta.dramaticScore,
      summary: report.recommendation.summary,
    };
  });
}

export function buildMutationOracleSnapshot(options = {}) {
  const matrix = generateMutationMatrix({
    seed: options.seed || 'oracle-mutations',
    budget: 'smoke',
    scenario: options.scenario || 'new-player-table',
    ghostScenario: options.ghostScenario || 'balanced-cast',
  });
  return {
    bestCurrentMutation: matrix.best,
    worstCurrentMutation: matrix.worst,
    safestContractMinimal: matrix.safestContractMinimal,
    highestDramaMutation: matrix.highestDrama,
    lowestFrustrationMutation: matrix.lowestFrustration,
    risks: buildMutationRisks(matrix),
    recommendations: buildMutationRecommendations(matrix),
  };
}

function buildMutationRisks(matrix) {
  const risks = [];
  for (const row of matrix.rows) {
    if (row.score >= 70 && row.contractImpact.includes('contract')) {
      risks.push({
        id: `mutation-contract-${row.preset}`,
        severity: 'yellow',
        category: 'mutations',
        title: `${row.label} improves enough to consider but requires contract review`,
        evidence: [`Score ${row.score}`, row.contractImpact],
        mitigation: 'Attach deployment note and rollback patch before launch promotion.',
      });
    }
    if (row.ghostDelta < -10) {
      risks.push({
        id: `mutation-ghost-regression-${row.preset}`,
        severity: 'orange',
        category: 'mutations',
        title: `${row.label} hurts ghost archetype health`,
        evidence: [`Ghost delta ${row.ghostDelta}`],
        mitigation: 'Run normal ghost validation before considering the rule patch.',
      });
    }
  }
  return risks.slice(0, 6);
}

function buildMutationRecommendations(matrix) {
  const recs = [];
  if (matrix.best) {
    recs.push({
      id: 'mutation-playtest-best',
      title: `Playtest ${matrix.best.label}`,
      rationale: matrix.best.recommendation,
      command: `npm run mutate:rules -- --preset ${matrix.best.preset} --budget normal --markdown`,
    });
  }
  if (matrix.highestDrama && matrix.highestDrama.preset !== matrix.best?.preset) {
    recs.push({
      id: 'mutation-drama-check',
      title: `Review ${matrix.highestDrama.label} for replay proof`,
      rationale: `Drama delta ${matrix.highestDrama.dramaDelta.toFixed(1)}.`,
      command: `npm run mutate:rules -- --preset ${matrix.highestDrama.preset} --markdown`,
    });
  }
  return recs;
}

export function buildMutationLaunchProof(options = {}) {
  const report = generateMutationReport({
    seed: options.seed || 'launch-mutation',
    preset: options.preset || 'contract-minimal',
    budget: 'smoke',
    baselineRules: options.baselineRules,
    candidateRules: options.candidateRules,
  });
  return {
    reportId: report.id,
    score: report.score.total,
    verdict: report.verdict,
    contractImpact: report.comparison.contractImpact,
    rollbackPatch: report.comparison.rollbackPatch,
    selectedMutation: report.scenario.presetId,
    proof: report.recommendation.summary,
  };
}

export function exportMutationReportMarkdown(report) {
  const comparison = report.comparison;
  return [
    '# Plundrix Rule Mutation Time Machine',
    '',
    `Generated: ${report.generatedAt}`,
    `Preset: ${comparison.scenario.preset.label}`,
    `Scenario: ${comparison.scenario.simulatorScenarioId}`,
    `Verdict: ${report.verdict}`,
    `Score: ${report.score.total}/100`,
    `Contract impact: ${comparison.contractImpact.level}`,
    '',
    '## Recommendation',
    '',
    report.recommendation.summary,
    '',
    '## Rule Diff',
    '',
    ...(comparison.ruleDiff.length
      ? comparison.ruleDiff.map((item) => `- ${ruleLabel(item.key)}: ${item.before} -> ${item.after}`)
      : ['- No rule changes.']),
    '',
    '## Simulation Delta',
    '',
    `Winner changed: ${comparison.simulation.winnerChanged}`,
    `Rounds delta: ${comparison.simulation.roundDelta}`,
    `Average tension delta: ${comparison.simulation.averageTensionDelta.toFixed(2)}`,
    `Lead change delta: ${comparison.simulation.leadChangeDelta}`,
    '',
    '## Replay Delta',
    '',
    `Drama delta: ${comparison.replay.delta.dramaticScore.toFixed(2)}`,
    `Highlight delta: ${comparison.replay.delta.highlightCount}`,
    `Better replay: ${comparison.replayLinks.better}`,
    '',
    '## Ghost Delta',
    '',
    `Ghost score delta: ${comparison.ghosts.scoreDelta}`,
    `Frustration delta: ${comparison.ghosts.frustrationDelta}`,
    ...comparison.ghosts.archetypeDeltas.map((item) => `- ${item.label}: health ${Math.round(item.healthDelta)}, fun ${item.funDelta}, frustration ${item.frustrationDelta}`),
    '',
    '## Rollback Patch',
    '',
    '```json',
    JSON.stringify(comparison.rollbackPatch, null, 2),
    '```',
    '',
  ].join('\n');
}

export function exportMutationReportJson(report) {
  return JSON.stringify(report, null, 2);
}

export function exportMutationMatrixCsv(matrix) {
  const rows = [
    ['preset', 'score', 'verdict', 'roundDelta', 'dramaDelta', 'ghostDelta', 'frustrationDelta', 'contractImpact', 'recommendation'],
    ...matrix.rows.map((row) => [
      row.label,
      row.score,
      row.verdict,
      row.roundDelta,
      row.dramaDelta.toFixed(3),
      row.ghostDelta,
      row.frustrationDelta,
      row.contractImpact,
      row.recommendation,
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

export function exportRuleDiffCsv(diff = []) {
  const rows = [
    ['key', 'before', 'after', 'delta', 'direction'],
    ...diff.map((item) => [item.key, item.before, item.after, item.delta, item.direction]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function validateMutationScenario(scenario) {
  const required = ['schemaVersion', 'id', 'sourceType', 'seed', 'simulatorScenarioId', 'baselineRules', 'candidateRules'];
  for (const key of required) {
    if (!(key in scenario)) throw new Error(`Mutation scenario missing required field: ${key}`);
  }
  if (scenario.schemaVersion !== MUTATION_SCHEMA_VERSION) {
    throw new Error(`Unsupported mutation schema version: ${scenario.schemaVersion}`);
  }
  if (!MUTATION_SOURCES.includes(scenario.sourceType)) {
    throw new Error(`Unsupported mutation source: ${scenario.sourceType}`);
  }
  return true;
}

export function validateMutationComparison(comparison) {
  const required = ['schemaVersion', 'id', 'scenario', 'ruleDiff', 'contractImpact', 'simulation', 'tension', 'replay', 'ghosts', 'score', 'verdict'];
  for (const key of required) {
    if (!(key in comparison)) throw new Error(`Mutation comparison missing required field: ${key}`);
  }
  return true;
}

export function validateMutationReport(report) {
  const required = ['schemaVersion', 'id', 'generatedAt', 'scenario', 'comparison', 'score', 'verdict', 'recommendation'];
  for (const key of required) {
    if (!(key in report)) throw new Error(`Mutation report missing required field: ${key}`);
  }
  if (report.schemaVersion !== MUTATION_SCHEMA_VERSION) {
    throw new Error(`Unsupported mutation report schema version: ${report.schemaVersion}`);
  }
  return true;
}

export function migrateMutationReport(report) {
  if (report.schemaVersion === MUTATION_SCHEMA_VERSION) return report;
  return { ...report, schemaVersion: MUTATION_SCHEMA_VERSION, exports: report.exports || {} };
}

function readStorage(key) {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeStorage(key, value) {
  if (typeof localStorage === 'undefined') return false;
  localStorage.setItem(key, JSON.stringify(value));
  return true;
}

export function saveMutationSession(session) {
  const entry = { id: session.id || `mutation-session-${hashString(JSON.stringify(session)).toString(16)}`, savedAt: nowIso(), ...session };
  const sessions = [entry, ...readStorage(MUTATION_SESSION_KEY).filter((item) => item.id !== entry.id)].slice(0, 50);
  writeStorage(MUTATION_SESSION_KEY, sessions);
  return sessions;
}

export function listMutationSessions() {
  return readStorage(MUTATION_SESSION_KEY);
}

export function saveMutationReport(report) {
  validateMutationReport(report);
  const reports = [report, ...readStorage(MUTATION_REPORT_KEY).filter((item) => item.id !== report.id)].slice(0, 40);
  writeStorage(MUTATION_REPORT_KEY, reports);
  return reports;
}

export function listMutationReports() {
  return readStorage(MUTATION_REPORT_KEY).map(migrateMutationReport);
}

export function pinMutationCandidate(report) {
  validateMutationReport(report);
  const pinned = [report, ...readStorage(MUTATION_PINNED_KEY).filter((item) => item.id !== report.id)].slice(0, 24);
  writeStorage(MUTATION_PINNED_KEY, pinned);
  return pinned;
}

export function listPinnedMutationCandidates() {
  return readStorage(MUTATION_PINNED_KEY).map(migrateMutationReport);
}

export function exportMutationReports() {
  return JSON.stringify(listMutationReports(), null, 2);
}

export function importMutationReports(text) {
  const reports = JSON.parse(text).map(migrateMutationReport);
  reports.forEach(validateMutationReport);
  writeStorage(MUTATION_REPORT_KEY, reports);
  return reports;
}

export function parseRulePatch(text = '') {
  if (!text.trim()) return {};
  return JSON.parse(text);
}

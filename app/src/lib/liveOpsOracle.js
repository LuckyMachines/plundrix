import {
  runBatch,
} from './plundrixEngine.js';
import {
  exportAutopilotMarkdown,
  runAutopilotSearch,
} from './balanceAutopilot.js';
import {
  buildReplayFromSeed,
  buildReplayGalleryData,
  buildReplaysFromAutopilot,
  listReplayLibrary,
} from './replayDirector.js';
import {
  buildGhostBalanceScore,
  runGhostBatch,
} from './playerTelemetryGhosts.js';
import {
  buildMutationOracleSnapshot,
} from './ruleMutationTimeMachine.js';
import {
  buildPlaytestMission,
  generatePlaytestBacklog,
} from './playtestCoach.js';
import {
  generateDesignBacklog,
} from './designControlTower.js';

export const ORACLE_SCHEMA_VERSION = 1;
export const ORACLE_SNAPSHOT_KEY = 'plundrix-live-ops-oracle-snapshots:v1';
export const ORACLE_DECISION_LOG_KEY = 'plundrix-live-ops-oracle-decisions:v1';

export const ORACLE_HEALTH_WEIGHTS = Object.freeze({
  balance: 0.16,
  replay: 0.13,
  ghosts: 0.1,
  mutations: 0.08,
  playtest: 0.07,
  design: 0.08,
  readiness: 0.15,
  documentation: 0.08,
  marketing: 0.07,
  operations: 0.08,
});

export const EXPERIMENT_LIFECYCLE = Object.freeze([
  'discovered',
  'reranked',
  'validated',
  'playtested',
  'approved',
  'implemented',
  'shipped',
  'monitored',
  'archived',
]);

export const REPLAY_LIFECYCLE = Object.freeze([
  'generated',
  'reviewed',
  'pinned',
  'gallery',
  'marketing',
  'archived',
]);

export const RELEASE_GATES = Object.freeze([
  'prototype',
  'internal playtest',
  'public testnet',
  'launch candidate',
  'mainnet ready',
  'post-launch',
]);

export const TELEMETRY_INPUTS = Object.freeze([
  'games created',
  'games completed',
  'action distribution',
  'round duration',
  'player retention',
  'wallet/session funnel',
  'replay shares',
]);

const KEY_DOCS = [
  'docs/dev/balance-autopilot.mdx',
  'docs/dev/replay-director.mdx',
  'docs/simulator-improvement-report.md',
  'docs/dev/playtest-coach.mdx',
  'docs/playtest-coach-latest.md',
  'docs/dev/design-control-tower.mdx',
  'docs/design-control-tower-latest.md',
  'docs/dev/deployment.mdx',
  'docs/dev/local-dev.mdx',
  'docs/dev/mechanics.mdx',
];

const KEY_SCRIPTS = [
  'simulate',
  'simulate:auto-balance',
  'replay:direct',
  'replay:capture',
  'test:autopilot',
  'test:replay',
  'playtest:coach',
  'test:playtest',
  'design:tower',
  'test:design',
];

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

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function scoreStatus(score) {
  if (score >= 85) return 'green';
  if (score >= 70) return 'yellow';
  if (score >= 50) return 'orange';
  return 'red';
}

function recommendationScore({ impact, effort, confidence, urgency }) {
  return (impact * confidence) / Math.max(1, effort) + urgency;
}

export function parseChecklist(markdown = '') {
  const lines = markdown.split(/\r?\n/);
  const items = lines
    .map((line) => {
      const match = line.match(/^\s*[-*]\s+\[(x|X| )\]\s+(.*)$/);
      if (!match) return null;
      return {
        done: match[1].toLowerCase() === 'x',
        text: match[2].trim(),
        critical: /mainnet|launch|security|deploy|contract|legal|wallet|fund/i.test(match[2]),
      };
    })
    .filter(Boolean);
  const completed = items.filter((item) => item.done).length;
  return {
    total: items.length,
    completed,
    completionRate: items.length ? completed / items.length : 1,
    uncheckedCritical: items.filter((item) => !item.done && item.critical),
    items,
  };
}

export function summarizeMarkdown(markdown = '') {
  const headings = markdown
    .split(/\r?\n/)
    .filter((line) => /^#{1,4}\s+/.test(line))
    .map((line) => line.replace(/^#+\s+/, '').trim());
  const checklist = parseChecklist(markdown);
  return {
    headings,
    checklist,
    excerpt: markdown.replace(/\s+/g, ' ').trim().slice(0, 360),
  };
}

function sourceFreshness(source, generatedAt, maxAgeHours = 72) {
  if (!generatedAt) {
    return { source, generatedAt: null, ageHours: null, stale: true };
  }
  const ageHours = Math.max(0, (Date.now() - new Date(generatedAt).getTime()) / 36e5);
  return {
    source,
    generatedAt,
    ageHours,
    stale: ageHours > maxAgeHours,
  };
}

export function collectOracleSources(config = {}) {
  const files = config.files || {};
  const packageJson = config.packageJson || {};
  const reportDate = config.generatedAt || nowIso();
  const useFreshSamples = config.heavy || config.freshSamples;

  const simulatorBatch = config.simulatorBatch || runBatch({
    games: useFreshSamples ? 12 : 4,
    seed: config.seed || 'oracle-smoke',
    scenarioId: config.scenarioId || 'new-player-table',
    maxRounds: 40,
  });

  const autopilotReport = config.autopilotReport || runAutopilotSearch({
    budget: 'smoke',
    seed: config.seed || 'oracle-autopilot',
    scenarios: ['new-player-table'],
    games: useFreshSamples ? 6 : 3,
    iterations: useFreshSamples ? 3 : 1,
    rerank: false,
    validate: false,
    topN: 3,
  });

  const replayLibrary = config.replayLibrary || safeReplayLibrary();
  const ghostReport = config.ghostReport || runGhostBatch({
    scenario: config.ghostScenario || 'balanced-cast',
    seed: config.seed || 'oracle-ghosts',
    budget: 'smoke',
    games: useFreshSamples ? 6 : 3,
    maxRounds: 36,
  });
  const mutationSnapshot = config.mutationSnapshot || buildMutationOracleSnapshot({
    seed: config.seed || 'oracle-mutations',
    scenario: config.scenarioId || 'new-player-table',
    ghostScenario: config.ghostScenario || 'balanced-cast',
  });
  const playtestBacklog = config.playtestBacklog || generatePlaytestBacklog({
    ghostReport,
    mutationSnapshot,
  });
  const galleryReplays = config.galleryReplays || [
    buildReplayFromSeed({ seed: 'oracle-gallery-1', scenarioId: 'comeback-test', maxRounds: 24 }),
    buildReplayFromSeed({ seed: 'oracle-gallery-2', scenarioId: 'new-player-table', maxRounds: 24 }),
    buildReplayFromSeed({ seed: 'oracle-gallery-3', scenarioId: 'stall-test', maxRounds: 24 }),
  ];
  const autopilotReplays = config.autopilotReplays || buildReplaysFromAutopilot(autopilotReport, { limit: 3 });
  const designBacklog = config.designBacklog || generateDesignBacklog({
    hypotheses: config.designHypotheses || [],
    ghostRisks: ghostReport.risks || [],
    replays: galleryReplays.slice(0, 2),
    balanceReport: autopilotReport,
    oracleRecommendations: config.designOracleRecommendations || [],
  });

  const docSummaries = Object.fromEntries(
    Object.entries(files).map(([path, text]) => [path, summarizeMarkdown(text)]),
  );

  return {
    collectedAt: reportDate,
    files,
    packageJson,
    simulatorBatch,
    autopilotReport,
    replayLibrary,
    ghostReport,
    mutationSnapshot,
    playtestBacklog,
    designBacklog,
    galleryReplays,
    autopilotReplays,
    docSummaries,
    freshness: [
      sourceFreshness('oracle report', reportDate, 24),
      sourceFreshness('balance autopilot', autopilotReport.generatedAt, 72),
    ],
  };
}

function safeReplayLibrary() {
  try {
    return listReplayLibrary();
  } catch {
    return [];
  }
}

export function analyzeSimulatorStatus(sources) {
  const scorecard = sources.simulatorBatch.scorecard;
  const warnings = [];
  if (scorecard.completionRate < 0.98) warnings.push('Some simulator games did not complete.');
  if (scorecard.runawayRate > 0.25) warnings.push('Runaway rate is high.');
  if (scorecard.averageRounds > 24) warnings.push('Average rounds are long.');
  if (scorecard.comebackRate < 0.08) warnings.push('Comeback rate is low.');
  const score = Math.max(0, Math.min(100, scorecard.score));
  return {
    score,
    status: scoreStatus(score),
    completionRate: scorecard.completionRate,
    avgRounds: scorecard.averageRounds,
    runawayRate: scorecard.runawayRate,
    comebackRate: scorecard.comebackRate,
    warnings,
  };
}

export function analyzeBalanceStatus(sources) {
  const report = sources.autopilotReport;
  const best = report.topCandidates?.[0];
  const scoreDelta = best ? best.objectiveScore - report.baseline.objectiveScore : 0;
  const allDoNotShip = (report.topCandidates || []).every((candidate) => candidate.shipReadiness === 'do not ship');
  const score = Math.max(0, Math.min(100, 55 + scoreDelta + (best?.viability?.pass ? 15 : -10)));
  const topRisks = [];
  if (!best) topRisks.push('No candidate available.');
  if (allDoNotShip) topRisks.push('All candidates are marked do not ship.');
  if (scoreDelta <= 0) topRisks.push('Best candidate does not improve baseline.');
  return {
    score,
    status: scoreStatus(score),
    bestCandidate: best || null,
    scoreDelta,
    readiness: best?.shipReadiness || 'none',
    topRisks,
    recommendedNextRun: 'npm run simulate:auto-balance -- --mode beam --budget normal --objective default',
    experimentStatus: (report.topCandidates || []).map((candidate) => ({
      id: candidate.id,
      lifecycle: candidate.shipReadiness === 'promising' ? 'reranked' : 'discovered',
      score: candidate.objectiveScore,
      readiness: candidate.shipReadiness,
    })),
  };
}

export function analyzeReplayStatus(sources) {
  const replays = [...sources.replayLibrary, ...sources.galleryReplays, ...sources.autopilotReplays];
  const gallery = buildReplayGalleryData(replays);
  const top = [...replays].sort((a, b) => b.dramaticScore - a.dramaticScore)[0] || null;
  const marketingReady = replays.filter((replay) => replay.marketingProof?.usable || replay.dramaticScore >= 65);
  const tags = new Set(replays.flatMap((replay) => replay.tags || []));
  const missingTags = ['comeback', 'close-finish', 'sabotage-heavy', 'high-tension'].filter((tag) => !tags.has(tag));
  const score = Math.min(100, 25 + Math.min(35, replays.length * 7) + Math.min(30, marketingReady.length * 10) + (top?.dramaticScore || 0) * 0.1);
  return {
    score,
    status: scoreStatus(score),
    replayCount: replays.length,
    topReplayScore: top?.dramaticScore || 0,
    topReplay: top,
    marketingReadyCount: marketingReady.length,
    missingTags,
    gallery,
    recommendedReplayAction: 'npm run replay:direct -- --batch 20 --scenario comeback-test --csv',
    replayStatus: replays.map((replay) => ({
      id: replay.id,
      lifecycle: replay.library?.officialState || 'generated',
      score: replay.dramaticScore,
      title: replay.title,
    })),
  };
}

export function analyzeGhostStatus(sources) {
  const report = sources.ghostReport;
  const balance = buildGhostBalanceScore(report);
  const warnings = [];
  if (balance.archetypeViability.some((item) => !item.viable)) {
    warnings.push('One or more player archetypes need viability review.');
  }
  if (report.score.frustrationRisk > 55) {
    warnings.push('Ghost cast frustration risk is elevated.');
  }
  return {
    score: balance.score,
    status: scoreStatus(balance.score),
    reportId: report.id,
    healthiestArchetype: report.healthiestArchetype,
    riskiestArchetype: report.riskiestArchetype,
    mostDramaticArchetype: report.mostDramaticArchetype,
    archetypeViability: balance.archetypeViability,
    warnings,
    recommendedGhostAction: 'npm run ghosts:run -- --budget smoke --markdown',
  };
}

export function analyzeMutationStatus(sources) {
  const snapshot = sources.mutationSnapshot;
  const best = snapshot.bestCurrentMutation;
  const worst = snapshot.worstCurrentMutation;
  const score = best?.score || 0;
  const warnings = [];
  if (snapshot.risks.length) warnings.push(`${snapshot.risks.length} mutation risks detected.`);
  if (best?.contractImpact?.includes('contract')) warnings.push('Best mutation requires contract review.');
  return {
    score,
    status: scoreStatus(score),
    bestCurrentMutation: best,
    worstCurrentMutation: worst,
    safestContractMinimal: snapshot.safestContractMinimal,
    highestDramaMutation: snapshot.highestDramaMutation,
    lowestFrustrationMutation: snapshot.lowestFrustrationMutation,
    risks: snapshot.risks,
    recommendations: snapshot.recommendations,
    warnings,
    recommendedMutationAction: 'npm run mutate:matrix -- --budget smoke --markdown',
  };
}

export function analyzePlaytestStatus(sources) {
  const backlog = sources.playtestBacklog || [];
  const topMission = backlog[0]?.mission || buildPlaytestMission({
    sourceType: 'manual-design-question',
    category: 'onboarding',
    question: 'Can a new player understand the first match?',
  });
  const score = backlog.length ? Math.max(45, Math.min(90, 72 - Math.max(0, backlog.length - 3) * 4 + (backlog[0]?.score || 0))) : 72;
  return {
    score,
    status: scoreStatus(score),
    topMission,
    backlog: backlog.slice(0, 8),
    lastOutcome: 'not recorded',
    machineSignalConfirmed: false,
    recommendedPlaytestAction: 'npm run playtest:coach -- --markdown',
  };
}

export function analyzeDesignStatus(sources) {
  const backlog = sources.designBacklog || [];
  const topHypothesis = backlog[0] || null;
  const humanValidationGapCount = backlog.reduce((count, item) => (
    count + ((item.evidenceGaps || []).some((gap) => gap.sourceType === 'playtest-coach') ? 1 : 0)
  ), 0);
  const launchProofGapCount = backlog.reduce((count, item) => (
    count + ((item.evidenceGaps || []).some((gap) => gap.sourceType === 'launch-copilot') ? 1 : 0)
  ), 0);
  const averageConfidence = Math.round(average(backlog.map((item) => item.score?.confidence || 0)));
  const averageScore = Math.round(average(backlog.map((item) => item.score?.total || 0)));
  const score = Math.max(30, Math.min(95, averageScore + Math.min(12, backlog.length * 2) - humanValidationGapCount * 2));
  return {
    score,
    status: scoreStatus(score),
    topHypothesis,
    backlog: backlog.slice(0, 8),
    averageConfidence,
    humanValidationGapCount,
    launchProofGapCount,
    recommendedDesignAction: 'npm run design:tower -- --snapshot --markdown',
  };
}

export function analyzeDocsStatus(sources) {
  const present = KEY_DOCS.filter((path) => sources.files[path]);
  const missing = KEY_DOCS.filter((path) => !sources.files[path]);
  const stale = Object.entries(sources.docSummaries)
    .filter(([, summary]) => !summary.headings.length)
    .map(([path]) => path);
  const score = Math.round((present.length / KEY_DOCS.length) * 100 - stale.length * 5);
  return {
    score: Math.max(0, score),
    status: scoreStatus(score),
    present,
    missing,
    stale,
  };
}

export function analyzeReleaseReadiness(sources) {
  const checklistText = sources.files['docs/go-live-checklist.md'] || '';
  const checklist = parseChecklist(checklistText);
  const baseScore = checklist.total ? checklist.completionRate * 100 : 45;
  const blockerPenalty = checklist.uncheckedCritical.length * 8;
  const score = Math.max(0, Math.min(100, baseScore - blockerPenalty));
  const blockers = checklist.uncheckedCritical.map((item) => item.text);
  const warnings = [];
  if (!checklist.total) warnings.push('Go-live checklist was not available to the Oracle source collector.');
  if (blockers.length) warnings.push('Critical go-live checklist items remain open.');
  const nextGate = score >= 90 ? 'launch candidate' : score >= 70 ? 'public testnet' : 'internal playtest';
  return {
    score,
    status: scoreStatus(score),
    blockers,
    warnings,
    checks: checklist,
    nextGate,
  };
}

export function analyzeMarketingProof(sources, replayStatus) {
  const proofAssets = Object.keys(sources.files).filter((path) => /screenshots|replays|public\/replays/i.test(path));
  const strongestReplays = [...sources.galleryReplays, ...sources.replayLibrary, ...sources.autopilotReplays]
    .sort((a, b) => b.dramaticScore - a.dramaticScore)
    .slice(0, 3);
  const missingAssets = [];
  if (!strongestReplays.length) missingAssets.push('No replay stories available.');
  if (!proofAssets.length) missingAssets.push('No generated replay screenshot assets found.');
  const score = Math.min(100, replayStatus.score * 0.65 + Math.min(30, proofAssets.length * 10));
  return {
    score,
    status: scoreStatus(score),
    strongestReplays,
    missingAssets,
    recommendedPlacements: ['homepage proof strip', 'press page replay embed', 'social launch card'],
    socialHooks: strongestReplays.map((replay) => replay.highlights?.[0]?.socialLabel || replay.title),
    pressHooks: [
      'Plundrix uses simulator-backed balance search to tune on-chain gameplay.',
      'Replay Director turns simulated vault races into shareable proof clips.',
    ],
  };
}

export function analyzeOperationsStatus(sources) {
  const scripts = sources.packageJson?.scripts || {};
  const presentScripts = KEY_SCRIPTS.filter((script) => scripts[script]);
  const missingScripts = KEY_SCRIPTS.filter((script) => !scripts[script]);
  const workflowExists = Boolean(sources.files['.github/workflows/balance-autopilot-smoke.yml']);
  const gitignore = sources.files['.gitignore'] || '';
  const protectsArtifacts = /public\/replays|reports\/balance-autopilot|app\/\*\.log/.test(gitignore);
  const score = Math.min(100, (presentScripts.length / KEY_SCRIPTS.length) * 70 + (workflowExists ? 15 : 0) + (protectsArtifacts ? 15 : 0));
  return {
    score,
    status: scoreStatus(score),
    scripts: { present: presentScripts, missing: missingScripts },
    workflowExists,
    protectsArtifacts,
  };
}

export function analyzeLiveDataStatus() {
  return {
    score: 20,
    status: 'orange',
    connected: false,
    statusText: 'waiting for indexed live data',
    expectedInputs: TELEMETRY_INPUTS,
    simulatorVsLive: {
      available: false,
      drift: null,
      message: 'Simulator-vs-live drift reports will activate when indexed game events are connected.',
    },
    archetypeDrift: {
      available: false,
      message: 'Player archetype drift is waiting for observed action distributions.',
    },
    retentionFunnel: {
      available: false,
      slots: ['landing to wallet connect', 'wallet connect to game join', 'game join to completion', 'completion to replay share'],
    },
  };
}

function makeRecommendation(input) {
  const recommendation = {
    owner: 'product',
    status: 'open',
    dependsOn: [],
    commands: [],
    files: [],
    evidence: [],
    dueBy: 'before next playtest',
    ...input,
  };
  return {
    ...recommendation,
    score: recommendationScore(recommendation),
  };
}

export function buildRisks(statuses) {
  const risks = [];
  const add = (risk) => risks.push({ status: 'open', ...risk });
  if (statuses.balance.readiness === 'none' || statuses.balance.topRisks.length) {
    add({
      id: 'risk-balance-candidates',
      severity: statuses.balance.topRisks.length > 1 ? 'orange' : 'yellow',
      category: 'balance',
      title: 'Balance candidates need stronger validation',
      evidence: statuses.balance.topRisks,
      impact: 'Rules may look promising in smoke runs but fail broader scenario coverage.',
      mitigation: statuses.balance.recommendedNextRun,
    });
  }
  if (statuses.replay.marketingReadyCount < 2) {
    add({
      id: 'risk-replay-proof',
      severity: 'yellow',
      category: 'replay',
      title: 'Replay proof library is thin',
      evidence: [`Marketing-ready replays: ${statuses.replay.marketingReadyCount}`],
      impact: 'Website and launch materials have fewer concrete gameplay moments.',
      mitigation: statuses.replay.recommendedReplayAction,
    });
  }
  if (statuses.ghosts?.warnings?.length) {
    add({
      id: 'risk-ghost-archetypes',
      severity: statuses.ghosts.score < 60 ? 'orange' : 'yellow',
      category: 'ghosts',
      title: 'Player archetype health needs review',
      evidence: statuses.ghosts.warnings,
      impact: 'The game may be fun for one play style but weak or frustrating for another.',
      mitigation: statuses.ghosts.recommendedGhostAction,
    });
  }
  if (statuses.mutations?.risks?.length) {
    for (const risk of statuses.mutations.risks.slice(0, 3)) {
      add({
        id: `risk-${risk.id}`,
        severity: risk.severity || 'yellow',
        category: 'mutations',
        title: risk.title,
        evidence: risk.evidence || [],
        impact: 'Rule changes may improve one dimension while regressing another.',
        mitigation: risk.mitigation || statuses.mutations.recommendedMutationAction,
      });
    }
  }
  if (statuses.playtest?.backlog?.length > 4) {
    add({
      id: 'risk-human-validation-backlog',
      severity: 'yellow',
      category: 'playtest',
      title: 'Human validation backlog is growing',
      evidence: [`Open playtest missions: ${statuses.playtest.backlog.length}`],
      impact: 'Machine signals may not be validated by real player behavior before launch decisions.',
      mitigation: statuses.playtest.recommendedPlaytestAction,
    });
  }
  if (statuses.design?.humanValidationGapCount > 3) {
    add({
      id: 'risk-design-memory-validation',
      severity: 'yellow',
      category: 'design',
      title: 'Design backlog needs human evidence',
      evidence: [`Human validation gaps: ${statuses.design.humanValidationGapCount}`],
      impact: 'Design direction may drift toward machine-only wins without player confirmation.',
      mitigation: statuses.design.recommendedDesignAction,
    });
  }
  if (statuses.release.blockers.length) {
    add({
      id: 'risk-release-blockers',
      severity: 'red',
      category: 'release',
      title: 'Critical release checklist items remain open',
      evidence: statuses.release.blockers,
      impact: 'Public testnet or launch candidate should wait.',
      mitigation: 'Close critical go-live checklist items.',
    });
  }
  if (!statuses.operations.workflowExists) {
    add({
      id: 'risk-ci-smoke',
      severity: 'orange',
      category: 'operations',
      title: 'Smoke workflow missing',
      evidence: ['GitHub workflow was not found in collected sources.'],
      impact: 'Tool health may regress unnoticed.',
      mitigation: 'Add CI smoke workflow for autopilot and replay commands.',
    });
  }
  if (!statuses.live.connected) {
    add({
      id: 'risk-live-data',
      severity: 'yellow',
      category: 'live-data',
      title: 'Live data is not connected yet',
      evidence: [statuses.live.statusText],
      impact: 'Simulator predictions cannot yet be calibrated against real play.',
      mitigation: 'Connect indexed game events when live traffic exists.',
    });
  }
  return risks;
}

export function buildOpportunities(statuses) {
  const opportunities = [];
  if (statuses.replay.topReplayScore >= 70) {
    opportunities.push({
      id: 'opp-promote-replay',
      category: 'marketing',
      title: 'Promote strongest replay proof',
      evidence: [`Top replay score: ${statuses.replay.topReplayScore.toFixed(1)}`],
      whyNow: 'Replay Director has a shareable gameplay moment ready.',
      action: 'Add the top replay to gallery or marketing proof strip.',
    });
  }
  if (statuses.ghosts?.mostDramaticArchetype) {
    opportunities.push({
      id: 'opp-ghost-story-proof',
      category: 'ghosts',
      title: `Promote ${statuses.ghosts.mostDramaticArchetype.label} proof`,
      evidence: [`Ghost score: ${statuses.ghosts.score}`],
      whyNow: 'Player Telemetry Ghosts found a readable archetype story.',
      action: statuses.ghosts.recommendedGhostAction,
    });
  }
  if (statuses.mutations?.bestCurrentMutation) {
    opportunities.push({
      id: 'opp-rule-mutation',
      category: 'mutations',
      title: `Playtest ${statuses.mutations.bestCurrentMutation.label}`,
      evidence: [`Mutation score: ${statuses.mutations.bestCurrentMutation.score}`],
      whyNow: 'Rule Mutation Time Machine found a higher-scoring candidate under smoke comparison.',
      action: statuses.mutations.recommendedMutationAction,
    });
  }
  if (statuses.playtest?.topMission) {
    opportunities.push({
      id: 'opp-playtest-mission',
      category: 'playtest',
      title: statuses.playtest.topMission.title,
      evidence: [`Mission category: ${statuses.playtest.topMission.category}`],
      whyNow: 'The Playtest Coach converted machine signals into a human validation script.',
      action: statuses.playtest.recommendedPlaytestAction,
    });
  }
  if (statuses.design?.topHypothesis) {
    opportunities.push({
      id: 'opp-design-control',
      category: 'design',
      title: statuses.design.topHypothesis.title,
      evidence: [`Design score: ${statuses.design.topHypothesis.score?.total || 0}`],
      whyNow: 'The Design Control Tower has a ranked hypothesis with attached evidence and next action.',
      action: statuses.design.recommendedDesignAction,
    });
  }
  if (statuses.balance.scoreDelta > 0) {
    opportunities.push({
      id: 'opp-validate-candidate',
      category: 'balance',
      title: 'Validate improved balance candidate',
      evidence: [`Smoke delta: ${statuses.balance.scoreDelta.toFixed(1)}`],
      whyNow: 'A candidate improved the smoke baseline.',
      action: statuses.balance.recommendedNextRun,
    });
  }
  if (statuses.docs.score >= 80 && statuses.operations.score >= 80) {
    opportunities.push({
      id: 'opp-public-testnet-proof',
      category: 'release',
      title: 'Prepare public testnet proof bundle',
      evidence: ['Docs and ops surfaces are in good shape.'],
      whyNow: 'Core tooling has smoke coverage and documentation.',
      action: 'Generate daily brief, release notes, and marketing proof bundle.',
    });
  }
  return opportunities;
}

export function buildRecommendations(statuses, risks, opportunities) {
  const recommendations = [
    makeRecommendation({
      id: 'rec-normal-autopilot',
      category: 'balance',
      title: 'Run normal Balance Autopilot validation',
      rationale: 'Smoke candidates are useful for direction, but broader scenario coverage is needed before promotion.',
      expectedImpact: 'Higher confidence balance candidate.',
      impact: 4,
      effort: 3,
      confidence: 0.8,
      urgency: statuses.balance.readiness === 'do not ship' ? 2 : 1,
      owner: 'design',
      commands: [statuses.balance.recommendedNextRun],
      files: ['app/src/lib/balanceAutopilot.js', 'docs/balance-autopilot-latest.md'],
      evidence: statuses.balance.topRisks,
      dueBy: 'before next playtest',
    }),
    makeRecommendation({
      id: 'rec-replay-proof',
      category: 'replay',
      title: 'Promote or generate replay proof',
      rationale: 'Replay-worthy moments make balance and gameplay easier to evaluate and market.',
      expectedImpact: 'Stronger public proof of gameplay moments.',
      impact: 4,
      effort: 2,
      confidence: 0.8,
      urgency: statuses.replay.marketingReadyCount < 2 ? 2 : 1,
      owner: 'marketing',
      commands: [statuses.replay.recommendedReplayAction],
      files: ['app/src/lib/replayDirector.js', 'docs/replay-director-latest.md'],
      evidence: [`Marketing-ready replays: ${statuses.replay.marketingReadyCount}`],
      dueBy: 'today',
    }),
    makeRecommendation({
      id: 'rec-ghost-smoke',
      category: 'ghosts',
      title: 'Run Player Telemetry Ghosts smoke',
      rationale: 'Archetype health shows whether the game works across recognizable player personalities, not just generic bots.',
      expectedImpact: 'Clearer balance and replay proof by play style.',
      impact: 4,
      effort: 2,
      confidence: 0.8,
      urgency: statuses.ghosts?.warnings?.length ? 2 : 1,
      owner: 'design',
      commands: [statuses.ghosts?.recommendedGhostAction || 'npm run ghosts:run -- --budget smoke --markdown'],
      files: ['app/src/lib/playerTelemetryGhosts.js', 'docs/player-telemetry-ghosts-latest.md'],
      evidence: statuses.ghosts?.warnings || [],
      dueBy: 'before next playtest',
    }),
    makeRecommendation({
      id: 'rec-mutation-matrix',
      category: 'mutations',
      title: 'Run Rule Mutation Time Machine matrix',
      rationale: 'Fast causal comparisons show which rule patches improve fun, replay drama, and ghost health before deeper validation.',
      expectedImpact: 'Clearer candidate rules with rollback patches and contract-impact notes.',
      impact: 4,
      effort: 2,
      confidence: 0.75,
      urgency: statuses.mutations?.warnings?.length ? 2 : 1,
      owner: 'design',
      commands: [statuses.mutations?.recommendedMutationAction || 'npm run mutate:matrix -- --budget smoke --markdown'],
      files: ['app/src/lib/ruleMutationTimeMachine.js', 'docs/rule-mutation-time-machine-latest.md'],
      evidence: statuses.mutations?.warnings || [],
      dueBy: 'before next balance candidate promotion',
    }),
    makeRecommendation({
      id: 'rec-playtest-mission',
      category: 'playtest',
      title: statuses.playtest?.topMission?.title || 'Run Playtest Coach mission',
      rationale: 'Machine signals need a fast human validation loop before design or launch decisions harden.',
      expectedImpact: 'Validated player comprehension, agency, fairness, and replay memory.',
      impact: 5,
      effort: 2,
      confidence: 0.85,
      urgency: 2,
      owner: 'product',
      commands: [statuses.playtest?.recommendedPlaytestAction || 'npm run playtest:coach -- --markdown'],
      files: ['app/src/lib/playtestCoach.js', 'docs/playtest-coach-latest.md'],
      evidence: [statuses.playtest?.topMission?.designQuestion || 'No playtest mission has been run yet.'],
      dueBy: 'before next human playtest',
    }),
    makeRecommendation({
      id: 'rec-design-control',
      category: 'design',
      title: statuses.design?.topHypothesis?.title || 'Generate Design Control Tower snapshot',
      rationale: 'The project needs a durable design memory connecting machine evidence, human validation, and shipped decisions.',
      expectedImpact: 'Clearer next design action and fewer repeated design debates.',
      impact: 5,
      effort: 2,
      confidence: 0.82,
      urgency: statuses.design?.humanValidationGapCount > 3 ? 2 : 1,
      owner: 'product',
      commands: [statuses.design?.recommendedDesignAction || 'npm run design:tower -- --snapshot --markdown'],
      files: ['app/src/lib/designControlTower.js', 'docs/design-control-tower-latest.md'],
      evidence: [statuses.design?.topHypothesis?.claim || 'No design snapshot has been generated yet.'],
      dueBy: 'before next design decision',
    }),
    makeRecommendation({
      id: 'rec-release-checklist',
      category: 'release',
      title: 'Close critical release checklist items',
      rationale: 'Release readiness is gated by unchecked critical launch and deployment work.',
      expectedImpact: 'Clearer path to the next release gate.',
      impact: 5,
      effort: Math.min(5, Math.max(2, statuses.release.blockers.length || 2)),
      confidence: 1,
      urgency: statuses.release.blockers.length ? 3 : 1,
      owner: 'ops',
      commands: [],
      files: ['docs/go-live-checklist.md'],
      evidence: statuses.release.blockers,
      dueBy: 'before public testnet',
    }),
    makeRecommendation({
      id: 'rec-capture-proof',
      category: 'marketing',
      title: 'Capture replay screenshots deliberately',
      rationale: 'Capture scripts are ready, but generated media should be run only when desired to avoid local resource spikes.',
      expectedImpact: 'Reusable website and social proof assets.',
      impact: 3,
      effort: 2,
      confidence: 0.7,
      urgency: 1,
      owner: 'marketing',
      commands: ['npm run replay:capture -- --seed clip-1 --scenario comeback-test --preset desktop'],
      files: ['app/public/replays/'],
      evidence: statuses.marketing.missingAssets,
      dueBy: 'before launch',
    }),
    makeRecommendation({
      id: 'rec-live-data',
      category: 'live-data',
      title: 'Prepare indexed live data adapter',
      rationale: 'The Oracle is ready to compare simulator predictions against real games once event data exists.',
      expectedImpact: 'Simulator calibration and player behavior drift detection.',
      impact: 3,
      effort: 4,
      confidence: 0.5,
      urgency: 1,
      owner: 'engineering',
      commands: [],
      files: ['app/src/lib/liveOpsOracle.js'],
      evidence: statuses.live.expectedInputs,
      dueBy: 'post-launch',
    }),
  ];

  for (const opportunity of opportunities) {
    recommendations.push(makeRecommendation({
      id: `rec-${opportunity.id}`,
      category: opportunity.category,
      title: opportunity.title,
      rationale: opportunity.whyNow,
      expectedImpact: opportunity.action,
      impact: 3,
      effort: 2,
      confidence: 0.8,
      urgency: 1,
      owner: opportunity.category === 'marketing' ? 'marketing' : 'product',
      commands: opportunity.action.startsWith('npm ') ? [opportunity.action] : [],
      evidence: opportunity.evidence,
      dueBy: 'today',
    }));
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .map((recommendation, index) => ({ ...recommendation, rank: index + 1 }));
}

export function buildActionPlan(recommendations) {
  return {
    now: recommendations.filter((item) => item.rank <= 3),
    next: recommendations.filter((item) => item.rank > 3 && item.rank <= 6),
    later: recommendations.filter((item) => item.rank > 6),
  };
}

function healthScore(statuses) {
  const score =
    statuses.balance.score * ORACLE_HEALTH_WEIGHTS.balance +
    statuses.replay.score * ORACLE_HEALTH_WEIGHTS.replay +
    statuses.ghosts.score * ORACLE_HEALTH_WEIGHTS.ghosts +
    statuses.mutations.score * ORACLE_HEALTH_WEIGHTS.mutations +
    statuses.playtest.score * ORACLE_HEALTH_WEIGHTS.playtest +
    statuses.design.score * ORACLE_HEALTH_WEIGHTS.design +
    statuses.release.score * ORACLE_HEALTH_WEIGHTS.readiness +
    statuses.docs.score * ORACLE_HEALTH_WEIGHTS.documentation +
    statuses.marketing.score * ORACLE_HEALTH_WEIGHTS.marketing +
    statuses.operations.score * ORACLE_HEALTH_WEIGHTS.operations;
  return Math.round(score);
}

function healthExplanation(score, statuses) {
  const strengths = [];
  const gaps = [];
  if (statuses.operations.score >= 80) strengths.push('strong tooling');
  if (statuses.replay.marketingReadyCount > 0) strengths.push('replay proof exists');
  if (statuses.ghosts?.score >= 75) strengths.push('ghost archetypes are healthy');
  if (statuses.mutations?.score >= 70) strengths.push('rule mutation candidate exists');
  if (statuses.playtest?.score >= 70) strengths.push('human validation mission is ready');
  if (statuses.design?.score >= 70) strengths.push('design memory is forming');
  if (statuses.balance.scoreDelta > 0) strengths.push('balance candidates are improving');
  if (!statuses.live.connected) gaps.push('live proof unavailable');
  if (statuses.release.blockers.length) gaps.push('release blockers remain');
  if (statuses.ghosts?.warnings?.length) gaps.push('ghost archetype risks remain');
  if (statuses.mutations?.warnings?.length) gaps.push('mutation risks remain');
  if (statuses.playtest?.backlog?.length > 4) gaps.push('human validation backlog remains');
  if (statuses.design?.humanValidationGapCount > 3) gaps.push('design evidence gaps remain');
  if (statuses.marketing.missingAssets.length) gaps.push('proof assets need capture');
  return `${scoreStatus(score).toUpperCase()} ${score}/100: ${strengths.join(', ') || 'tooling is forming'}, with ${gaps.join(', ') || 'no major gaps detected'}.`;
}

export function buildReleaseNotes(report) {
  return [
    '# Plundrix Release Notes Draft',
    '',
    '## Added',
    ...report.opportunities.slice(0, 4).map((item) => `- ${item.title}`),
    '',
    '## Changed',
    ...report.recommendations.slice(0, 3).map((item) => `- ${item.title}`),
    '',
    '## Validation',
    `- Oracle health: ${report.health.score}/100 (${report.health.status})`,
    `- Simulator average rounds: ${report.simulatorStatus.avgRounds.toFixed(2)}`,
    `- Replay proof count: ${report.replayStatus.replayCount}`,
    `- Playtest backlog: ${report.playtestStatus.backlog.length}`,
    `- Design backlog: ${report.designStatus.backlog.length}`,
    '',
    '## Known Risks',
    ...report.risks.map((risk) => `- ${risk.title}: ${risk.impact}`),
    '',
  ].join('\n');
}

export function buildMarketingBundle(report) {
  const strongest = report.marketingProof.strongestReplays || [];
  return {
    headlines: [
      'Plundrix turns on-chain vault races into replayable strategy stories.',
      'Simulator-backed balance search meets shareable heist replays.',
      'Every lock, sabotage, and comeback can become proof.',
    ],
    replayLinks: strongest.map((replay) => replay.shareUrl),
    screenshotPlan: strongest.map((replay) => replay.capturePlan?.screenshots?.[0]).filter(Boolean),
    socialPosts: report.marketingProof.socialHooks.map((hook) => `${hook}. Watch the vault race unfold in Plundrix.`),
    pressBullets: report.marketingProof.pressHooks,
    websiteChecklist: [
      'Add top replay to homepage proof strip.',
      'Embed one replay on press page.',
      'Generate Open Graph image from best replay frame.',
    ],
  };
}

export function exportOracleMarkdown(report) {
  return [
    '# Plundrix Live Ops Oracle',
    '',
    `Generated: ${report.generatedAt}`,
    `Horizon: ${report.horizon}`,
    `Health: ${report.health.score}/100 (${report.health.status})`,
    '',
    report.health.explanation,
    '',
    '## Next Best Actions',
    '',
    ...report.recommendations.slice(0, 8).map((item) => `${item.rank}. ${item.title} (${item.category}) - ${item.rationale}`),
    '',
    '## Risks',
    '',
    ...report.risks.map((risk) => `- ${risk.severity.toUpperCase()} ${risk.title}: ${risk.mitigation}`),
    '',
    '## Opportunities',
    '',
    ...report.opportunities.map((opportunity) => `- ${opportunity.title}: ${opportunity.action}`),
    '',
    '## Release Readiness',
    '',
    `Score: ${report.releaseReadiness.score.toFixed(0)}`,
    `Next gate: ${report.releaseReadiness.nextGate}`,
    ...report.releaseReadiness.blockers.map((blocker) => `- Blocker: ${blocker}`),
    '',
    '## Marketing Proof',
    '',
    ...report.marketingProof.strongestReplays.map((replay) => `- ${replay.title}: ${replay.shareUrl}`),
    '',
    '## Human Playtest',
    '',
    `Mission: ${report.playtestStatus.topMission.title}`,
    `Question: ${report.playtestStatus.topMission.designQuestion}`,
    `Backlog: ${report.playtestStatus.backlog.length} open missions`,
    '',
    '## Design Control',
    '',
    `Top hypothesis: ${report.designStatus.topHypothesis?.title || 'none'}`,
    `Confidence: ${report.designStatus.averageConfidence}/100`,
    `Human validation gaps: ${report.designStatus.humanValidationGapCount}`,
    '',
  ].join('\n');
}

export function exportOracleJson(report) {
  return JSON.stringify(report, null, 2);
}

export function exportRecommendationsCsv(report) {
  const rows = [
    ['rank', 'category', 'title', 'impact', 'effort', 'confidence', 'urgency', 'score', 'status', 'command'],
    ...report.recommendations.map((item) => [
      item.rank,
      item.category,
      item.title,
      item.impact,
      item.effort,
      item.confidence,
      item.urgency,
      item.score.toFixed(3),
      item.status,
      item.commands[0] || '',
    ]),
  ];
  return rows.map((row) => row.map((cell) => {
    const text = String(cell);
    return text.includes(',') ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(',')).join('\n');
}

export function validateOracleReport(report) {
  const required = ['schemaVersion', 'id', 'generatedAt', 'health', 'recommendations', 'risks', 'opportunities', 'releaseReadiness'];
  for (const key of required) {
    if (!(key in report)) {
      throw new Error(`Oracle report missing required field: ${key}`);
    }
  }
  if (report.schemaVersion !== ORACLE_SCHEMA_VERSION) {
    throw new Error(`Unsupported Oracle schema version: ${report.schemaVersion}`);
  }
  return true;
}

export function migrateOracleReport(report) {
  if (report.schemaVersion === ORACLE_SCHEMA_VERSION) return report;
  return {
    ...report,
    schemaVersion: ORACLE_SCHEMA_VERSION,
    exports: report.exports || {},
  };
}

export function generateOracleReport(config = {}) {
  const generatedAt = config.generatedAt || nowIso();
  const sources = collectOracleSources({ ...config, generatedAt });
  const simulatorStatus = analyzeSimulatorStatus(sources);
  const balanceStatus = analyzeBalanceStatus(sources);
  const replayStatus = analyzeReplayStatus(sources);
  const ghostStatus = analyzeGhostStatus(sources);
  const mutationStatus = analyzeMutationStatus(sources);
  const playtestStatus = analyzePlaytestStatus(sources);
  const designStatus = analyzeDesignStatus(sources);
  const docsStatus = analyzeDocsStatus(sources);
  const releaseReadiness = analyzeReleaseReadiness(sources);
  const operationsStatus = analyzeOperationsStatus(sources);
  const liveStatus = analyzeLiveDataStatus(sources);
  const marketingProof = analyzeMarketingProof(sources, replayStatus);
  const statuses = {
    simulator: simulatorStatus,
    balance: balanceStatus,
    replay: replayStatus,
    ghosts: ghostStatus,
    mutations: mutationStatus,
    playtest: playtestStatus,
    design: designStatus,
    docs: docsStatus,
    release: releaseReadiness,
    operations: operationsStatus,
    live: liveStatus,
    marketing: marketingProof,
  };
  const risks = buildRisks(statuses);
  const opportunities = buildOpportunities(statuses);
  const recommendations = buildRecommendations(statuses, risks, opportunities);
  const actionPlan = buildActionPlan(recommendations);
  const score = healthScore(statuses);
  const report = {
    schemaVersion: ORACLE_SCHEMA_VERSION,
    id: `oracle-${hashString(`${generatedAt}:${score}`).toString(16)}`,
    generatedAt,
    horizon: config.horizon || 'daily',
    mode: config.heavy ? 'heavy' : 'lightweight',
    sources: {
      freshness: sources.freshness,
      files: Object.keys(sources.files),
      noHeavyDefault: !config.heavy,
    },
    health: {
      score,
      status: scoreStatus(score),
      categories: {
        balance: balanceStatus.status,
        replay: replayStatus.status,
        ghosts: ghostStatus.status,
        mutations: mutationStatus.status,
        playtest: playtestStatus.status,
        design: designStatus.status,
        readiness: releaseReadiness.status,
        documentation: docsStatus.status,
        marketing: marketingProof.status,
        operations: operationsStatus.status,
        liveData: liveStatus.status,
      },
      explanation: healthExplanation(score, statuses),
    },
    recommendations,
    risks,
    opportunities,
    releaseReadiness,
    marketingProof,
    balanceStatus,
    replayStatus,
    ghostStatus,
    mutationStatus,
    playtestStatus,
    designStatus,
    simulatorStatus,
    experimentStatus: balanceStatus.experimentStatus,
    replayLifecycleStatus: replayStatus.replayStatus,
    documentationStatus: docsStatus,
    operationsStatus,
    liveDataStatus: liveStatus,
    driftReports: {
      simulatorVsLive: liveStatus.simulatorVsLive,
      playerArchetype: liveStatus.archetypeDrift,
    },
    deploymentReadiness: {
      slots: ['contract config', 'frontend env', 'wallet network', 'automation', 'monitoring'],
      status: releaseReadiness.nextGate,
    },
    websiteIntegrationChecklist: [
      'Add strongest replay to homepage proof strip.',
      'Add replay embed to press page.',
      'Generate social card metadata from best replay frame.',
    ],
    marketingProofDeploymentChecklist: [
      'Run replay capture deliberately.',
      'Review generated image sizes.',
      'Promote selected replay to marketing state.',
    ],
    actionPlan,
    releaseNotes: '',
    marketingBundle: null,
    exports: {},
  };
  report.releaseNotes = buildReleaseNotes(report);
  report.marketingBundle = buildMarketingBundle(report);
  report.exports = {
    markdown: exportOracleMarkdown(report),
    json: exportOracleJson(report),
    recommendationsCsv: exportRecommendationsCsv(report),
    releaseNotes: report.releaseNotes,
    marketingBundle: JSON.stringify(report.marketingBundle, null, 2),
    autopilotMarkdown: exportAutopilotMarkdown(sources.autopilotReport),
  };
  validateOracleReport(report);
  return report;
}

function readSnapshots() {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(ORACLE_SNAPSHOT_KEY);
  return raw ? JSON.parse(raw).map(migrateOracleReport) : [];
}

function writeSnapshots(snapshots) {
  if (typeof localStorage === 'undefined') return false;
  localStorage.setItem(ORACLE_SNAPSHOT_KEY, JSON.stringify(snapshots));
  return true;
}

export function saveOracleSnapshot(report) {
  validateOracleReport(report);
  const snapshots = [report, ...readSnapshots().filter((item) => item.id !== report.id)].slice(0, 30);
  writeSnapshots(snapshots);
  return snapshots;
}

export function listOracleSnapshots() {
  return readSnapshots();
}

export function importOracleSnapshots(text) {
  const snapshots = JSON.parse(text).map(migrateOracleReport);
  snapshots.forEach(validateOracleReport);
  writeSnapshots(snapshots);
  return snapshots;
}

export function exportOracleSnapshots() {
  return JSON.stringify(readSnapshots(), null, 2);
}

export function getOracleTrend(snapshots = readSnapshots()) {
  if (snapshots.length < 2) {
    return { available: false, delta: 0, message: 'Need at least two snapshots for trend.' };
  }
  const [latest, previous] = snapshots;
  return {
    available: true,
    delta: latest.health.score - previous.health.score,
    latest: latest.health.score,
    previous: previous.health.score,
  };
}

function readDecisionLog() {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(ORACLE_DECISION_LOG_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeDecisionLog(log) {
  if (typeof localStorage === 'undefined') return false;
  localStorage.setItem(ORACLE_DECISION_LOG_KEY, JSON.stringify(log));
  return true;
}

export function addOracleDecision(decision) {
  const entry = {
    id: `decision-${hashString(JSON.stringify(decision)).toString(16)}`,
    createdAt: nowIso(),
    status: decision.status || 'accepted',
    ...decision,
  };
  const log = [entry, ...readDecisionLog()].slice(0, 100);
  writeDecisionLog(log);
  return log;
}

export function listOracleDecisions() {
  return readDecisionLog();
}

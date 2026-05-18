import { runBatch } from './plundrixEngine.js';
import { runAutopilotSearch } from './balanceAutopilot.js';
import { buildReplayFromSeed } from './replayDirector.js';
import { runGhostBatch } from './playerTelemetryGhosts.js';
import { generateMutationReport } from './ruleMutationTimeMachine.js';
import {
  buildPlaytestMission,
  createSyntheticPlaytestSession,
  generatePlaytestReport,
} from './playtestCoach.js';

export const DESIGN_TOWER_SCHEMA_VERSION = 1;
export const DESIGN_TOWER_HYPOTHESIS_KEY = 'plundrix-design-control-hypotheses:v1';
export const DESIGN_TOWER_DECISION_KEY = 'plundrix-design-control-decisions:v1';
export const DESIGN_TOWER_PACKET_KEY = 'plundrix-design-control-packets:v1';

export const DESIGN_HYPOTHESIS_STATES = Object.freeze([
  'idea',
  'queued',
  'simulating',
  'machine-validated',
  'human-playtest',
  'accepted',
  'rejected',
  'shipped',
  'archived',
]);

export const DESIGN_EVIDENCE_SOURCES = Object.freeze([
  'simulator',
  'balance-autopilot',
  'replay-director',
  'ghosts',
  'rule-mutation',
  'live-ops-oracle',
  'launch-copilot',
  'playtest-coach',
  'manual-note',
]);

export const DESIGN_CHANGE_CATEGORIES = Object.freeze([
  'rules',
  'onboarding',
  'ui',
  'pacing',
  'balance',
  'replay-drama',
  'archetype-feel',
  'tool-economy',
  'sabotage',
  'launch-readiness',
  'accessibility',
]);

export const DESIGN_DECISION_STATUSES = Object.freeze([
  'accept',
  'reject',
  'needs-more-data',
  'ship',
  'rollback',
]);

const SOURCE_WEIGHTS = Object.freeze({
  simulator: 0.72,
  'balance-autopilot': 0.86,
  'replay-director': 0.74,
  ghosts: 0.84,
  'rule-mutation': 0.88,
  'live-ops-oracle': 0.8,
  'launch-copilot': 0.82,
  'playtest-coach': 0.94,
  'manual-note': 0.45,
});

const VALID_TRANSITIONS = Object.freeze({
  idea: ['queued', 'rejected', 'archived'],
  queued: ['simulating', 'rejected', 'archived'],
  simulating: ['machine-validated', 'rejected', 'archived'],
  'machine-validated': ['human-playtest', 'accepted', 'rejected', 'archived'],
  'human-playtest': ['accepted', 'rejected', 'machine-validated', 'archived'],
  accepted: ['shipped', 'human-playtest', 'rejected', 'archived'],
  rejected: ['archived'],
  shipped: ['archived'],
  archived: [],
});

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
  const finite = values.filter((value) => Number.isFinite(value));
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : 0;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function slugify(text) {
  return String(text || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

function normalizeDecisionTitle(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/mutation-report-[a-f0-9]+/g, 'mutation-report')
    .replace(/replay-[a-f0-9]+/g, 'replay')
    .replace(/the round \d+/g, 'the round')
    .replace(/tool hoarder (wins too often|rarely wins)\.?/g, 'tool hoarder viability')
    .replace(/leader hunter (wins too often|rarely wins)\.?/g, 'leader hunter viability')
    .replace(/closer (wins too often|rarely wins)\.?/g, 'closer viability')
    .replace(/^playtest .+$/g, 'playtest mutation')
    .replace(/\s+/g, ' ');
}

function normalizeTags(tags = []) {
  if (typeof tags === 'string') return tags.split(',').map((item) => item.trim()).filter(Boolean);
  return Array.isArray(tags) ? tags.map((item) => String(item).trim()).filter(Boolean) : [];
}

function normalizeCategory(category = 'balance') {
  return DESIGN_CHANGE_CATEGORIES.includes(category) ? category : 'balance';
}

function normalizeOracleCategory(category = 'launch-readiness') {
  const map = {
    release: 'launch-readiness',
    operations: 'launch-readiness',
    ops: 'launch-readiness',
    readiness: 'launch-readiness',
    marketing: 'replay-drama',
    ghosts: 'archetype-feel',
    mutations: 'rules',
    playtest: 'onboarding',
    design: 'onboarding',
  };
  return normalizeCategory(map[category] || category || 'launch-readiness');
}

function normalizeState(state = 'idea') {
  return DESIGN_HYPOTHESIS_STATES.includes(state) ? state : 'idea';
}

export function createDesignHypothesis(input = {}) {
  const createdAt = input.createdAt || nowIso();
  const title = String(input.title || input.claim || 'Untitled design hypothesis').trim();
  const category = normalizeCategory(input.category);
  const evidence = (input.evidence || []).map(normalizeEvidence);
  const base = {
    schemaVersion: DESIGN_TOWER_SCHEMA_VERSION,
    id: input.id || `design-hypothesis-${hashString(`${category}:${title}:${input.claim || ''}`).toString(16)}`,
    createdAt,
    updatedAt: input.updatedAt || createdAt,
    title,
    category,
    state: normalizeState(input.state),
    claim: input.claim || title,
    desiredOutcome: input.desiredOutcome || 'Improve the player experience without introducing launch risk.',
    risk: input.risk || 'Unknown until evidence is gathered.',
    owner: input.owner || 'design',
    tags: normalizeTags(input.tags),
    linkedArtifacts: input.linkedArtifacts || [],
    evidence,
    score: null,
    decision: input.decision || null,
    nextAction: input.nextAction || null,
    history: input.history || [{ at: createdAt, type: 'created', summary: `Created hypothesis: ${title}` }],
    metrics: {
      playerImpact: clamp(input.playerImpact ?? 3, 1, 5),
      implementationEffort: clamp(input.implementationEffort ?? input.effort ?? 2, 1, 5),
      riskLevel: clamp(input.riskLevel ?? 3, 1, 5),
      launchRelevance: clamp(input.launchRelevance ?? 3, 1, 5),
    },
  };
  base.score = scoreDesignHypothesis(base);
  base.nextAction = input.nextAction || recommendNextDesignAction(base).label;
  validateDesignHypothesis(base);
  return base;
}

export function validateDesignHypothesis(hypothesis) {
  const required = ['schemaVersion', 'id', 'createdAt', 'updatedAt', 'title', 'category', 'state', 'claim', 'desiredOutcome', 'risk', 'evidence', 'history'];
  for (const key of required) {
    if (!(key in hypothesis)) throw new Error(`Design hypothesis missing required field: ${key}`);
  }
  if (hypothesis.schemaVersion !== DESIGN_TOWER_SCHEMA_VERSION) throw new Error(`Unsupported Design Control Tower schema: ${hypothesis.schemaVersion}`);
  if (!DESIGN_CHANGE_CATEGORIES.includes(hypothesis.category)) throw new Error(`Unsupported design category: ${hypothesis.category}`);
  if (!DESIGN_HYPOTHESIS_STATES.includes(hypothesis.state)) throw new Error(`Unsupported design state: ${hypothesis.state}`);
  for (const evidence of hypothesis.evidence || []) validateEvidence(evidence);
  return true;
}

export function migrateDesignHypothesis(hypothesis) {
  if (hypothesis.schemaVersion === DESIGN_TOWER_SCHEMA_VERSION) {
    return {
      ...hypothesis,
      score: hypothesis.score || scoreDesignHypothesis(hypothesis),
      nextAction: hypothesis.nextAction || recommendNextDesignAction(hypothesis).label,
    };
  }
  return createDesignHypothesis({
    ...hypothesis,
    schemaVersion: DESIGN_TOWER_SCHEMA_VERSION,
    evidence: hypothesis.evidence || [],
    history: hypothesis.history || [],
  });
}

function normalizeEvidence(evidence = {}) {
  const sourceType = DESIGN_EVIDENCE_SOURCES.includes(evidence.sourceType) ? evidence.sourceType : 'manual-note';
  const confidence = clamp(evidence.confidence ?? evidence.score ?? 50, 0, 100);
  const normalized = {
    id: evidence.id || `design-evidence-${hashString(`${sourceType}:${evidence.summary || evidence.artifactId || nowIso()}`).toString(16)}`,
    sourceType,
    summary: evidence.summary || 'Evidence captured.',
    confidence,
    score: clamp(evidence.score ?? confidence, 0, 100),
    sentiment: evidence.sentiment || (Number(evidence.score ?? confidence) >= 55 ? 'supporting' : 'counterevidence'),
    artifactId: evidence.artifactId || evidence.id || '',
    command: evidence.command || '',
    path: evidence.path || evidence.link || '',
    createdAt: evidence.createdAt || nowIso(),
    raw: evidence.raw || null,
  };
  validateEvidence(normalized);
  return normalized;
}

export function validateEvidence(evidence) {
  const required = ['id', 'sourceType', 'summary', 'confidence', 'score', 'sentiment', 'createdAt'];
  for (const key of required) {
    if (!(key in evidence)) throw new Error(`Design evidence missing required field: ${key}`);
  }
  if (!DESIGN_EVIDENCE_SOURCES.includes(evidence.sourceType)) throw new Error(`Unsupported evidence source: ${evidence.sourceType}`);
  if (!Number.isFinite(Number(evidence.confidence))) throw new Error('Evidence confidence must be numeric.');
  if (!Number.isFinite(Number(evidence.score))) throw new Error('Evidence score must be numeric.');
  return true;
}

export function attachEvidence(hypothesis, evidence) {
  validateDesignHypothesis(hypothesis);
  const normalized = normalizeEvidence(evidence);
  const next = {
    ...hypothesis,
    updatedAt: nowIso(),
    evidence: [normalized, ...hypothesis.evidence.filter((item) => item.id !== normalized.id)],
    history: [
      { at: nowIso(), type: 'evidence-attached', summary: `${normalized.sourceType}: ${normalized.summary}` },
      ...hypothesis.history,
    ],
  };
  next.score = scoreDesignHypothesis(next);
  next.nextAction = recommendNextDesignAction(next).label;
  validateDesignHypothesis(next);
  return next;
}

export function scoreDesignHypothesis(hypothesis) {
  const evidenceSummary = summarizeEvidenceStack(hypothesis);
  const metrics = hypothesis.metrics || {};
  const impact = clamp(metrics.playerImpact ?? 3, 1, 5) * 12;
  const launch = clamp(metrics.launchRelevance ?? 3, 1, 5) * 8;
  const effortPenalty = clamp(metrics.implementationEffort ?? 2, 1, 5) * 5;
  const riskPenalty = clamp(metrics.riskLevel ?? 3, 1, 5) * 4;
  const stateBonus = {
    idea: 0,
    queued: 4,
    simulating: 8,
    'machine-validated': 14,
    'human-playtest': 16,
    accepted: 20,
    rejected: -25,
    shipped: 10,
    archived: -35,
  }[hypothesis.state] || 0;
  const sourceDiversity = evidenceSummary.sources.length * 3;
  const raw = evidenceSummary.weightedConfidence * 0.46 + impact + launch + sourceDiversity + stateBonus - effortPenalty - riskPenalty;
  return {
    total: Math.round(clamp(raw, 0, 100)),
    confidence: Math.round(evidenceSummary.weightedConfidence),
    evidenceStrength: Math.round(evidenceSummary.weightedStrength),
    playerImpact: Math.round(impact),
    effortPenalty,
    riskPenalty,
    launchRelevance: Math.round(launch),
    sourceDiversity,
    stateBonus,
  };
}

export function rankDesignHypotheses(hypotheses = []) {
  return hypotheses
    .map((hypothesis) => {
      const migrated = migrateDesignHypothesis(hypothesis);
      const score = scoreDesignHypothesis(migrated);
      return { ...migrated, score, nextAction: recommendNextDesignAction({ ...migrated, score }).label };
    })
    .sort((a, b) => b.score.total - a.score.total)
    .map((hypothesis, index) => ({ ...hypothesis, rank: index + 1 }));
}

export function canTransitionHypothesis(hypothesis, nextState) {
  return Boolean(VALID_TRANSITIONS[hypothesis.state]?.includes(nextState));
}

export function transitionHypothesis(hypothesis, nextState, metadata = {}) {
  validateDesignHypothesis(hypothesis);
  if (!DESIGN_HYPOTHESIS_STATES.includes(nextState)) throw new Error(`Unsupported design state: ${nextState}`);
  if (!canTransitionHypothesis(hypothesis, nextState)) {
    throw new Error(`Invalid design transition: ${hypothesis.state} -> ${nextState}`);
  }
  const transitioned = {
    ...hypothesis,
    state: nextState,
    updatedAt: nowIso(),
    history: [
      {
        at: nowIso(),
        type: 'state-transition',
        summary: `${hypothesis.state} -> ${nextState}`,
        operator: metadata.operator || '',
        rationale: metadata.rationale || '',
      },
      ...hypothesis.history,
    ],
  };
  transitioned.score = scoreDesignHypothesis(transitioned);
  transitioned.nextAction = recommendNextDesignAction(transitioned).label;
  validateDesignHypothesis(transitioned);
  return transitioned;
}

export function summarizeEvidenceStack(hypothesis) {
  const evidence = hypothesis.evidence || [];
  const supporting = evidence.filter((item) => item.sentiment !== 'counterevidence');
  const counterevidence = evidence.filter((item) => item.sentiment === 'counterevidence');
  const weighted = evidence.map((item) => {
    const sourceWeight = SOURCE_WEIGHTS[item.sourceType] || 0.5;
    return {
      confidence: item.confidence * sourceWeight,
      strength: item.score * sourceWeight,
      weight: sourceWeight,
    };
  });
  const weight = weighted.reduce((sum, item) => sum + item.weight, 0);
  return {
    count: evidence.length,
    sources: unique(evidence.map((item) => item.sourceType)),
    supportingCount: supporting.length,
    counterevidenceCount: counterevidence.length,
    weightedConfidence: weight ? weighted.reduce((sum, item) => sum + item.confidence, 0) / weight : 20,
    weightedStrength: weight ? weighted.reduce((sum, item) => sum + item.strength, 0) / weight : 15,
    strongest: [...evidence].sort((a, b) => b.score - a.score).slice(0, 5),
    counterevidence,
  };
}

export function buildEvidenceGaps(hypothesis) {
  const sources = new Set((hypothesis.evidence || []).map((item) => item.sourceType));
  const gaps = [];
  const add = (sourceType, label, command, severity = 'yellow') => {
    if (!sources.has(sourceType)) gaps.push({ sourceType, label, command, severity });
  };
  for (const sourceType of requiredEvidenceSources(hypothesis)) {
    if (sourceType === 'simulator') add(sourceType, 'Missing simulator proof', 'npm run simulate', 'orange');
    if (sourceType === 'ghosts') add(sourceType, 'Missing ghost archetype proof', 'npm run ghosts:run -- --budget smoke --markdown');
    if (sourceType === 'rule-mutation') add(sourceType, 'Missing rule mutation proof', 'npm run mutate:rules -- --budget smoke --markdown');
    if (sourceType === 'replay-director') add(sourceType, 'Missing replay drama proof', 'npm run replay:direct -- --seed design-proof --scenario comeback-test');
    if (sourceType === 'playtest-coach') add(sourceType, 'Missing human playtest proof', 'npm run playtest:coach -- --markdown', 'orange');
    if (sourceType === 'launch-copilot') add(sourceType, 'Missing launch readiness proof', 'npm run launch:copilot -- --target internal-playtest --markdown');
    if (sourceType === 'live-ops-oracle') add(sourceType, 'Missing live ops oracle proof', 'npm run ops:oracle -- --markdown');
  }
  return gaps;
}

function requiredEvidenceSources(hypothesis) {
  const category = hypothesis.category;
  const launchRelevant = (hypothesis.metrics?.launchRelevance || 0) >= 4;
  const byCategory = {
    onboarding: ['simulator', 'ghosts', 'replay-director', 'playtest-coach'],
    balance: ['simulator', 'ghosts', 'rule-mutation', 'playtest-coach'],
    rules: ['simulator', 'ghosts', 'rule-mutation', 'replay-director'],
    pacing: ['simulator', 'ghosts', 'replay-director', 'playtest-coach'],
    'archetype-feel': ['ghosts', 'simulator', 'playtest-coach'],
    'tool-economy': ['ghosts', 'simulator', 'rule-mutation', 'playtest-coach'],
    sabotage: ['ghosts', 'simulator', 'rule-mutation', 'playtest-coach'],
    'replay-drama': ['replay-director', 'simulator', 'playtest-coach'],
    ui: ['playtest-coach', 'launch-copilot'],
    accessibility: ['playtest-coach', 'launch-copilot'],
    'launch-readiness': ['launch-copilot', 'live-ops-oracle'],
  };
  const required = byCategory[category] || ['simulator', 'playtest-coach'];
  return unique([...required, ...(launchRelevant ? ['launch-copilot'] : [])]);
}

export function recommendNextDesignAction(hypothesis) {
  const gaps = buildEvidenceGaps(hypothesis);
  const score = hypothesis.score?.total ?? scoreDesignHypothesis(hypothesis).total;
  if (hypothesis.state === 'rejected') return action('Archive rejected hypothesis', 'archive', 'manual review');
  if (hypothesis.state === 'shipped') return action('Monitor live data', 'monitor', 'npm run ops:oracle -- --markdown');
  if (hypothesis.state === 'accepted') return action('Prepare ship packet', 'ship', 'npm run launch:copilot -- --target launch-candidate --markdown');
  if (gaps.find((gap) => gap.sourceType === 'simulator')) return action('Run simulator proof', 'simulate', 'npm run simulate');
  if (['rules', 'balance', 'pacing', 'sabotage', 'tool-economy'].includes(hypothesis.category) && gaps.find((gap) => gap.sourceType === 'rule-mutation')) {
    return action('Run mutation matrix', 'mutate', 'npm run mutate:rules -- --budget smoke --markdown');
  }
  if (['archetype-feel', 'sabotage', 'tool-economy'].includes(hypothesis.category) && gaps.find((gap) => gap.sourceType === 'ghosts')) {
    return action('Run ghost archetype proof', 'ghosts', 'npm run ghosts:run -- --budget smoke --markdown');
  }
  if (gaps.find((gap) => gap.sourceType === 'replay-director')) return action('Create replay proof', 'replay', 'npm run replay:direct -- --seed design-proof --scenario comeback-test');
  if (score >= 68 && gaps.find((gap) => gap.sourceType === 'playtest-coach')) return action('Generate playtest mission', 'playtest', 'npm run playtest:coach -- --markdown');
  if (score >= 78) return action('Accept design change', 'accept', 'record decision');
  if (score <= 30 && (hypothesis.evidence || []).length >= 2) return action('Reject weak hypothesis', 'reject', 'record decision');
  return action('Gather next evidence source', 'evidence', gaps[0]?.command || 'npm run design:tower -- --snapshot --markdown');
}

function decisionCommandForHypothesis(hypothesis, actionItem = recommendNextDesignAction(hypothesis)) {
  const status = actionItem.type === 'reject' ? 'reject' : actionItem.type === 'accept' ? 'accept' : 'needs-more-data';
  const risks = [hypothesis.risk, ...buildEvidenceGaps(hypothesis).map((gap) => gap.label)].filter(Boolean).join('; ');
  return [
    'npm run design:decision',
    `-- --hypothesis "${hypothesis.title}"`,
    `--status ${status}`,
    '--operator "<name>"',
    `--rationale "${actionItem.label}: ${hypothesis.desiredOutcome}"`,
    risks ? `--risks "${risks}"` : '',
  ].filter(Boolean).join(' ');
}

function action(label, type, command) {
  return { label, type, command };
}

export function buildSimulatorEvidence(batch) {
  const score = batch?.scorecard?.score ?? 50;
  return normalizeEvidence({
    sourceType: 'simulator',
    summary: `Simulator completion ${(Number(batch?.scorecard?.completionRate || 0) * 100).toFixed(0)}%, average rounds ${(batch?.scorecard?.averageRounds || 0).toFixed(1)}.`,
    confidence: 62,
    score,
    artifactId: batch?.id || `sim-${hashString(JSON.stringify(batch?.scorecard || {})).toString(16)}`,
    command: 'npm run simulate',
  });
}

export function buildBalanceEvidence(report) {
  const best = report?.topCandidates?.[0];
  const delta = best && report?.baseline ? best.objectiveScore - report.baseline.objectiveScore : 0;
  return normalizeEvidence({
    sourceType: 'balance-autopilot',
    summary: best ? `Balance candidate ${best.id} improves objective by ${delta.toFixed(1)}.` : 'Balance Autopilot baseline captured.',
    confidence: best ? 74 : 45,
    score: clamp(55 + delta, 0, 100),
    artifactId: best?.id || report?.id || 'balance-autopilot',
    command: 'npm run simulate:auto-balance -- --budget smoke --quiet',
  });
}

export function buildReplayEvidence(replay) {
  return normalizeEvidence({
    sourceType: 'replay-director',
    summary: `${replay?.title || 'Replay proof'} scored ${(replay?.dramaticScore || 0).toFixed(1)} drama.`,
    confidence: replay?.marketingProof?.usable ? 78 : 62,
    score: replay?.dramaticScore || 50,
    artifactId: replay?.id || 'replay-proof',
    command: 'npm run replay:direct -- --seed design-proof --scenario comeback-test',
    path: replay?.shareUrl || '',
  });
}

export function buildGhostEvidence(report) {
  return normalizeEvidence({
    sourceType: 'ghosts',
    summary: `Ghost score ${report?.score?.score ?? 0}/100, healthiest ${report?.healthiestArchetype?.label || 'unknown'}, riskiest ${report?.riskiestArchetype?.label || 'unknown'}.`,
    confidence: 76,
    score: report?.score?.score || 45,
    artifactId: report?.id || 'ghost-report',
    command: 'npm run ghosts:run -- --budget smoke --markdown',
  });
}

export function buildMutationEvidence(report) {
  return normalizeEvidence({
    sourceType: 'rule-mutation',
    summary: `${report?.presetLabel || report?.preset || 'Mutation'} verdict ${report?.verdict || 'unknown'} at ${report?.score?.total ?? 0}/100.`,
    confidence: 78,
    score: report?.score?.total || 45,
    sentiment: report?.verdict === 'reject' ? 'counterevidence' : 'supporting',
    artifactId: report?.id || report?.reportId || 'mutation-report',
    command: 'npm run mutate:rules -- --budget smoke --markdown',
  });
}

export function buildPlaytestEvidence(report) {
  const score = report?.aggregateScores?.overallScore || (report?.result === 'pass' ? 82 : report?.result === 'fail' ? 30 : 58);
  const confidence = report?.humanEvidenceConfidence || ({ synthetic: 46, facilitated: 84, 'live-session': 92 }[report?.evidenceType] || (report?.result === 'pass' ? 88 : 66));
  return normalizeEvidence({
    sourceType: 'playtest-coach',
    summary: `${report?.evidenceType || 'synthetic'} playtest result ${report?.result || 'inconclusive'}: ${report?.decisionRecommendation || 'Collect more evidence.'}`,
    confidence,
    score,
    sentiment: report?.result === 'fail' ? 'counterevidence' : 'supporting',
    artifactId: report?.id || 'playtest-report',
    command: 'npm run playtest:coach -- --report --markdown',
  });
}

export function buildOracleEvidence(report) {
  return normalizeEvidence({
    sourceType: 'live-ops-oracle',
    summary: `Oracle health ${report?.health?.score ?? 0}/100 with ${(report?.risks || []).length} risks.`,
    confidence: 72,
    score: report?.health?.score || 50,
    artifactId: report?.id || 'oracle-report',
    command: 'npm run ops:oracle -- --markdown',
  });
}

export function buildLaunchEvidence(plan) {
  return normalizeEvidence({
    sourceType: 'launch-copilot',
    summary: `Launch readiness ${plan?.readiness?.score ?? plan?.score ?? 0}/100 with ${(plan?.readiness?.blockers || []).length} blockers.`,
    confidence: 74,
    score: plan?.readiness?.score || plan?.score || 50,
    artifactId: plan?.id || 'launch-plan',
    command: 'npm run launch:copilot -- --target internal-playtest --markdown',
  });
}

export function buildHypothesisFromOracleRecommendation(recommendation = {}) {
  return createDesignHypothesis({
    title: recommendation.title || 'Oracle recommendation',
    category: normalizeOracleCategory(recommendation.category),
    claim: recommendation.rationale || recommendation.title || 'Oracle recommendation should improve Plundrix.',
    desiredOutcome: recommendation.impact ? `Deliver impact ${recommendation.impact}.` : 'Close the Oracle recommendation.',
    risk: recommendation.evidence?.[0] || 'Oracle recommendation needs design validation.',
    owner: recommendation.owner || 'product',
    launchRelevance: recommendation.urgency || 3,
    evidence: [normalizeEvidence({
      sourceType: 'live-ops-oracle',
      summary: recommendation.rationale || recommendation.title || 'Oracle recommendation.',
      confidence: 72,
      score: clamp((recommendation.score || 0.6) * 100, 0, 100),
      artifactId: recommendation.id || '',
      command: recommendation.commands?.[0] || 'npm run ops:oracle -- --markdown',
    })],
  });
}

export function buildHypothesisFromMutationReport(report = {}) {
  return createDesignHypothesis({
    title: `Validate mutation: ${report.presetLabel || report.preset || report.id || 'candidate rules'}`,
    category: 'rules',
    claim: report.recommendation?.summary || report.summary || 'Candidate rules may improve gameplay.',
    desiredOutcome: 'Choose whether this rule mutation should be promoted or rejected.',
    risk: report.comparison?.contractImpact?.summary || report.expectedRisk || 'Rule changes may affect balance or contract constants.',
    owner: 'design',
    playerImpact: 4,
    implementationEffort: 3,
    riskLevel: report.comparison?.contractImpact?.level?.includes('contract') ? 4 : 3,
    evidence: [buildMutationEvidence(report)],
  });
}

export function buildHypothesisFromMutationCandidate(report = {}) {
  return buildHypothesisFromMutationReport(report);
}

export function buildHypothesisFromGhostRisk(risk = {}) {
  return createDesignHypothesis({
    title: risk.title || 'Resolve ghost archetype risk',
    category: normalizeCategory(risk.category || 'archetype-feel'),
    claim: risk.impact || risk.title || 'A player archetype is exposed to a design risk.',
    desiredOutcome: 'Keep each archetype viable, expressive, and low-frustration.',
    risk: risk.mitigation || 'Archetype risk may reduce replayability.',
    owner: 'design',
    playerImpact: 4,
    evidence: [normalizeEvidence({
      sourceType: 'ghosts',
      summary: risk.title || 'Ghost risk detected.',
      confidence: 72,
      score: risk.severity === 'red' ? 25 : risk.severity === 'orange' ? 42 : 58,
      sentiment: 'counterevidence',
      artifactId: risk.id || '',
      command: 'npm run ghosts:run -- --budget smoke --markdown',
      raw: risk,
    })],
  });
}

export function buildHypothesisFromPlaytestReport(report = {}) {
  return createDesignHypothesis({
    title: `Act on playtest: ${report.mission?.title || report.id || 'mission'}`,
    category: normalizeCategory(report.mission?.category || 'onboarding'),
    claim: report.decisionRecommendation || 'Human playtest evidence should guide the next design action.',
    desiredOutcome: report.nextHumanTest || 'Close human validation gap.',
    risk: report.result === 'fail' ? 'Human playtest failed.' : 'Human feedback may not generalize yet.',
    owner: 'product',
    state: report.result === 'pass' ? 'human-playtest' : 'machine-validated',
    evidence: [buildPlaytestEvidence(report)],
  });
}

export function buildHypothesisFromReplay(replay = {}) {
  return createDesignHypothesis({
    title: `Replay memory: ${replay.title || replay.id || 'proof'}`,
    category: 'replay-drama',
    claim: 'The match creates a story players can remember and share.',
    desiredOutcome: 'Increase memorable tension, comeback readability, and shareability.',
    risk: 'Replay drama can hide fairness or onboarding problems.',
    owner: 'product',
    evidence: [buildReplayEvidence(replay)],
  });
}

export function buildPlaytestMissionFromHypothesis(hypothesis) {
  return buildPlaytestMission({
    sourceType: 'manual-design-question',
    category: mapDesignCategoryToPlaytestCategory(hypothesis.category),
    question: hypothesis.claim,
    title: hypothesis.title,
    testers: 4,
    seed: hypothesis.id,
    artifact: {
      id: hypothesis.id,
      title: hypothesis.title,
      risk: hypothesis.risk,
      recommendations: [recommendNextDesignAction(hypothesis).label],
    },
  });
}

function mapDesignCategoryToPlaytestCategory(category) {
  const map = {
    rules: 'balance',
    ui: 'onboarding',
    pacing: 'pacing',
    balance: 'balance',
    'replay-drama': 'replay-drama',
    'archetype-feel': 'archetype-feel',
    'tool-economy': 'tool-economy',
    sabotage: 'sabotage-fatigue',
    'launch-readiness': 'launch-readiness',
    accessibility: 'accessibility',
  };
  return map[category] || 'onboarding';
}

export function attachPlaytestReportToHypothesis(hypothesis, report) {
  return attachEvidence(hypothesis, buildPlaytestEvidence(report));
}

export function generateDesignBacklog(inputs = {}) {
  const hypotheses = [
    ...(inputs.hypotheses || []),
    ...(inputs.oracleRecommendations || []).map(buildHypothesisFromOracleRecommendation),
    ...(inputs.mutationReports || []).map(buildHypothesisFromMutationReport),
    ...(inputs.ghostRisks || []).map(buildHypothesisFromGhostRisk),
    ...(inputs.playtestReports || []).map(buildHypothesisFromPlaytestReport),
    ...(inputs.replays || []).map(buildHypothesisFromReplay),
  ];
  if (inputs.balanceReport) {
    hypotheses.push(createDesignHypothesis({
      title: 'Promote best balance candidate',
      category: 'balance',
      claim: 'Balance Autopilot found a candidate worth design review.',
      desiredOutcome: 'Improve fairness and pacing while preserving drama.',
      risk: 'Machine balance may not match human feel.',
      evidence: [buildBalanceEvidence(inputs.balanceReport)],
    }));
  }
  if (!hypotheses.length) {
    hypotheses.push(createDesignHypothesis({
      title: 'First match design control baseline',
      category: 'onboarding',
      claim: 'A new player can understand Plundrix and make meaningful choices in one match.',
      desiredOutcome: 'Baseline the design memory with simulator and human validation.',
      risk: 'The project lacks a canonical design decision trail.',
    }));
  }
  const enriched = hypotheses.map((hypothesis) => attachSnapshotEvidence(hypothesis, inputs));
  const deduped = dedupeHypotheses(enriched);
  const ranked = rankDesignHypotheses(deduped);
  return ranked.map((hypothesis) => ({
    ...hypothesis,
    group: backlogGroup(hypothesis),
    evidenceGaps: buildEvidenceGaps(hypothesis),
  }));
}

function hasEvidenceSource(hypothesis, sourceType) {
  return (hypothesis.evidence || []).some((item) => item.sourceType === sourceType);
}

function attachIfMissing(hypothesis, evidence) {
  if (!evidence || hasEvidenceSource(hypothesis, evidence.sourceType)) return hypothesis;
  return attachEvidence(hypothesis, evidence);
}

function attachSnapshotEvidence(hypothesis, inputs = {}) {
  let next = migrateDesignHypothesis(hypothesis);
  const category = next.category;
  const supportsGameplay =
    ['onboarding', 'balance', 'rules', 'pacing', 'archetype-feel', 'tool-economy', 'sabotage', 'replay-drama'].includes(category);
  const supportsReplay = ['onboarding', 'balance', 'rules', 'replay-drama', 'pacing'].includes(category);
  const supportsGhosts = ['onboarding', 'balance', 'rules', 'archetype-feel', 'tool-economy', 'sabotage'].includes(category);
  const supportsMutations = ['onboarding', 'balance', 'rules', 'pacing', 'tool-economy', 'sabotage'].includes(category);
  const supportsLaunch = (next.metrics?.launchRelevance || 0) >= 4 || ['onboarding', 'balance', 'rules', 'launch-readiness'].includes(category);

  if (supportsGameplay && inputs.simulatorBatch) next = attachIfMissing(next, buildSimulatorEvidence(inputs.simulatorBatch));
  if (supportsGhosts && inputs.ghostReport) next = attachIfMissing(next, buildGhostEvidence(inputs.ghostReport));
  if (supportsMutations && inputs.mutationReports?.[0]) next = attachIfMissing(next, buildMutationEvidence(inputs.mutationReports[0]));
  if (supportsReplay && inputs.replays?.[0]) next = attachIfMissing(next, buildReplayEvidence(inputs.replays[0]));
  if (supportsGameplay && inputs.playtestReports?.[0]) next = attachIfMissing(next, buildPlaytestEvidence(inputs.playtestReports[0]));
  if (supportsLaunch && inputs.launchPlan) next = attachIfMissing(next, buildLaunchEvidence(inputs.launchPlan));
  return next;
}

function dedupeHypotheses(hypotheses) {
  const map = new Map();
  for (const hypothesis of hypotheses.map(migrateDesignHypothesis)) {
    const key = `${hypothesis.category}:${hypothesis.title.toLowerCase().replace(/\s+/g, ' ')}`;
    if (!map.has(key) || map.get(key).score.total < hypothesis.score.total) {
      map.set(key, hypothesis);
    }
  }
  return [...map.values()];
}

function backlogGroup(hypothesis) {
  const gaps = buildEvidenceGaps(hypothesis);
  if (hypothesis.category === 'launch-readiness' || gaps.some((gap) => gap.sourceType === 'launch-copilot')) return 'launch blocker';
  if (gaps.some((gap) => gap.sourceType === 'playtest-coach')) return 'human validation needed';
  if ((hypothesis.metrics?.implementationEffort || 3) <= 2) return 'lowest effort';
  if (hypothesis.score.confidence < 55) return 'biggest confidence gap';
  return 'highest impact';
}

export function generateDecisionMemo(hypothesis) {
  const summary = summarizeEvidenceStack(hypothesis);
  const gaps = buildEvidenceGaps(hypothesis);
  const actionItem = recommendNextDesignAction(hypothesis);
  return {
    id: `design-memo-${hashString(hypothesis.id).toString(16)}`,
    generatedAt: nowIso(),
    hypothesisId: hypothesis.id,
    title: hypothesis.title,
    claim: hypothesis.claim,
    desiredOutcome: hypothesis.desiredOutcome,
    evidence: summary.strongest.map((item) => `${item.sourceType}: ${item.summary}`),
    counterevidence: summary.counterevidence.map((item) => `${item.sourceType}: ${item.summary}`),
    risks: [hypothesis.risk, ...gaps.map((gap) => gap.label)],
    recommendation: actionItem.label,
    nextCommand: actionItem.command,
    filesLikelyTouched: filesLikelyTouched(hypothesis),
    acceptanceCriteria: acceptanceCriteria(hypothesis),
  };
}

function filesLikelyTouched(hypothesis) {
  const map = {
    rules: ['app/src/lib/plundrixEngine.js', 'contracts/PlundrixGame.sol', 'docs/dev/mechanics.mdx'],
    onboarding: ['app/src/pages/HomePage.jsx', 'app/src/components/help/FieldManual.jsx', 'docs/dev/mechanics.mdx'],
    ui: ['app/src/components', 'app/src/pages'],
    pacing: ['app/src/lib/plundrixEngine.js', 'app/src/lib/ruleMutationTimeMachine.js'],
    balance: ['app/src/lib/plundrixEngine.js', 'app/src/lib/balanceAutopilot.js'],
    'replay-drama': ['app/src/lib/replayDirector.js', 'app/src/pages/ReplaysPage.jsx'],
    'archetype-feel': ['app/src/lib/playerTelemetryGhosts.js'],
    'tool-economy': ['app/src/lib/plundrixEngine.js'],
    sabotage: ['app/src/lib/plundrixEngine.js'],
    'launch-readiness': ['app/src/lib/launchCopilot.js', 'docs/mainnet-runbook.md'],
    accessibility: ['app/src/index.css', 'app/src/components/layout/AccessibilityToggle.jsx'],
  };
  return map[hypothesis.category] || ['app/src'];
}

function acceptanceCriteria(hypothesis) {
  return [
    'Evidence stack includes at least two independent sources.',
    'No red launch blocker remains open.',
    'Human playtest evidence exists before final acceptance.',
    `${hypothesis.desiredOutcome}`,
  ];
}

export function createDesignDecision(hypothesis, decisionInput = {}) {
  validateDesignHypothesis(hypothesis);
  const memo = generateDecisionMemo(hypothesis);
  const decision = {
    schemaVersion: DESIGN_TOWER_SCHEMA_VERSION,
    id: `design-decision-${hashString(JSON.stringify({ hypothesisId: hypothesis.id, decisionInput, at: nowIso() })).toString(16)}`,
    createdAt: nowIso(),
    hypothesisId: hypothesis.id,
    title: hypothesis.title,
    status: decisionInput.status || 'needs-more-data',
    operator: decisionInput.operator || '',
    rationale: decisionInput.rationale || '',
    acceptedRisks: normalizeTags(decisionInput.acceptedRisks || []),
    rejectedAlternatives: normalizeTags(decisionInput.rejectedAlternatives || []),
    followUpValidation: normalizeTags(decisionInput.followUpValidation || memo.acceptanceCriteria || []),
    evidenceUsed: normalizeTags(decisionInput.evidenceUsed || memo.evidence || []),
    memo,
  };
  validateDesignDecision(decision);
  return decision;
}

export function validateDesignDecision(decision) {
  const required = ['schemaVersion', 'id', 'createdAt', 'hypothesisId', 'status', 'operator', 'rationale'];
  for (const key of required) {
    if (!(key in decision)) throw new Error(`Design decision missing required field: ${key}`);
  }
  if (decision.schemaVersion !== DESIGN_TOWER_SCHEMA_VERSION) throw new Error(`Unsupported design decision schema: ${decision.schemaVersion}`);
  if (!DESIGN_DECISION_STATUSES.includes(decision.status)) throw new Error(`Unsupported design decision status: ${decision.status}`);
  if (!String(decision.operator).trim()) throw new Error('Design decision operator is required.');
  if (!String(decision.rationale).trim()) throw new Error('Design decision rationale is required.');
  if (['accept', 'ship'].includes(decision.status) && decision.memo?.risks?.length && !decision.acceptedRisks.length) {
    throw new Error('Accepting or shipping requires accepted risks.');
  }
  return true;
}

function normalizeDesignDecision(decision = {}) {
  const normalized = {
    ...decision,
    schemaVersion: decision.schemaVersion || DESIGN_TOWER_SCHEMA_VERSION,
    id: decision.id || `design-decision-${hashString(JSON.stringify(decision)).toString(16)}`,
    createdAt: decision.createdAt || nowIso(),
    hypothesisId: decision.hypothesisId || decision.memo?.hypothesisId || '',
    title: decision.title || decision.memo?.title || 'Design decision',
    status: decision.status || 'needs-more-data',
    operator: decision.operator || '',
    rationale: decision.rationale || '',
    acceptedRisks: Array.isArray(decision.acceptedRisks)
      ? decision.acceptedRisks
      : normalizeTags(decision.acceptedRisks),
    rejectedAlternatives: Array.isArray(decision.rejectedAlternatives)
      ? decision.rejectedAlternatives
      : normalizeTags(decision.rejectedAlternatives),
    followUpValidation: Array.isArray(decision.followUpValidation)
      ? decision.followUpValidation
      : normalizeTags(decision.followUpValidation),
    evidenceUsed: Array.isArray(decision.evidenceUsed)
      ? decision.evidenceUsed
      : normalizeTags(decision.evidenceUsed),
    memo: decision.memo || null,
  };
  validateDesignDecision(normalized);
  return normalized;
}

function findDecisionForHypothesis(hypothesis, decisions = []) {
  const title = normalizeDecisionTitle(hypothesis.title);
  return decisions.find((decision) => (
    decision.hypothesisId === hypothesis.id ||
    normalizeDecisionTitle(decision.title) === title ||
    normalizeDecisionTitle(decision.memo?.title) === title
  )) || null;
}

export function exportDesignDecisionMarkdown(decisionInput = {}) {
  const decision = normalizeDesignDecision(decisionInput);
  const memo = decision.memo || {};
  return [
    `# ${decision.title}`,
    '',
    `Decision ID: ${decision.id}`,
    `Created: ${decision.createdAt}`,
    `Status: ${decision.status}`,
    `Operator: ${decision.operator}`,
    `Hypothesis: ${decision.hypothesisId}`,
    '',
    '## Decision',
    '',
    decision.rationale,
    '',
    '## Evidence Used',
    '',
    ...(decision.evidenceUsed.length
      ? decision.evidenceUsed.map((item) => `- ${item}`)
      : (memo.evidence || []).map((item) => `- ${item}`)),
    '',
    '## Accepted Risks',
    '',
    ...(decision.acceptedRisks.length ? decision.acceptedRisks.map((item) => `- ${item}`) : ['- None recorded.']),
    '',
    '## Rejected Alternatives',
    '',
    ...(decision.rejectedAlternatives.length ? decision.rejectedAlternatives.map((item) => `- ${item}`) : ['- None recorded.']),
    '',
    '## Follow-Up Validation',
    '',
    ...(decision.followUpValidation.length ? decision.followUpValidation.map((item) => `- ${item}`) : (memo.acceptanceCriteria || []).map((item) => `- ${item}`)),
    '',
    '## Next Command',
    '',
    memo.nextCommand || 'npm run design:tower -- --snapshot --markdown',
    '',
  ].join('\n');
}

export function designDecisionFileSlug(decisionInput = {}) {
  const decision = normalizeDesignDecision(decisionInput);
  return `${decision.createdAt.slice(0, 10)}-${slugify(decision.title)}-${decision.id.replace(/^design-decision-/, '')}`;
}

export function generateDesignTowerSnapshot(config = {}) {
  const generatedAt = config.generatedAt || nowIso();
  const seed = config.seed || 'design-control';
  const simulatorBatch = config.simulatorBatch || runBatch({
    games: config.heavy ? 8 : 3,
    seed,
    scenarioId: config.scenarioId || 'new-player-table',
    maxRounds: 36,
  });
  const balanceReport = config.balanceReport || runAutopilotSearch({
    budget: 'smoke',
    seed: `${seed}-balance`,
    includeGhosts: false,
    includeMutations: false,
    mode: 'beam',
    topN: 3,
  });
  const replay = config.replay || buildReplayFromSeed({
    seed: `${seed}-replay`,
    scenarioId: config.replayScenarioId || 'comeback-test',
    maxRounds: 36,
  });
  const ghostReport = config.ghostReport || runGhostBatch({
    scenario: config.ghostScenario || 'balanced-cast',
    seed: `${seed}-ghosts`,
    budget: 'smoke',
    games: config.ghostGames || (config.heavy ? 32 : 24),
    maxRounds: 36,
  });
  const mutationReport = config.mutationReport || generateMutationReport({
    seed: `${seed}-mutation`,
    preset: config.mutationPreset || 'faster-games',
    budget: 'smoke',
  });
  const playtestMission = config.playtestMission || buildPlaytestMission({
    sourceType: 'manual-design-question',
    category: 'onboarding',
    question: 'Can a first-time player understand the design direction and make meaningful choices?',
    seed: `${seed}-playtest`,
    testers: 4,
  });
  const suppliedPlaytestReports = Array.isArray(config.playtestReports) ? config.playtestReports.filter(Boolean) : [];
  const playtestReport = config.playtestReport || suppliedPlaytestReports[0] || generatePlaytestReport(playtestMission, [
    createSyntheticPlaytestSession(playtestMission, {
      comprehension: 4,
      agency: 4,
      tension: 4,
      fairness: 4,
      frustration: 2,
      replayability: 4,
      setupFriction: 2,
      wouldReplay: true,
      rememberedMoment: 'Tester remembered the late vault swing.',
      notes: 'Synthetic design snapshot session.',
    }),
  ]);

  const hypotheses = generateDesignBacklog({
    hypotheses: [
      createDesignHypothesis({
        title: 'First match design direction',
        category: 'onboarding',
        claim: 'A new player should understand the goal, feel agency, and remember one story moment.',
        desiredOutcome: 'Improve first-match comprehension and replay intent.',
        risk: 'Machine proof can overstate clarity for humans.',
        evidence: [
          buildSimulatorEvidence(simulatorBatch),
          buildPlaytestEvidence(playtestReport),
        ],
      }),
      createDesignHypothesis({
        title: 'Replay drama can sell the vault race',
        category: 'replay-drama',
        claim: 'The current game can produce shareable comeback stories.',
        desiredOutcome: 'Use replay proof to guide design and marketing.',
        risk: 'High drama may come from unfair-feeling swings.',
        evidence: [buildReplayEvidence(replay)],
      }),
    ],
    simulatorBatch,
    balanceReport,
    ghostReport,
    launchPlan: config.launchPlan,
    mutationReports: [mutationReport],
    ghostRisks: ghostReport.risks || [],
    playtestReports: unique([playtestReport, ...suppliedPlaytestReports]),
    replays: [replay],
    oracleRecommendations: config.oracleReport?.recommendations || [],
  });
  if (config.oracleReport) {
    hypotheses[0] = attachEvidence(hypotheses[0], buildOracleEvidence(config.oracleReport));
  }
  if (config.launchPlan) {
    hypotheses[0] = attachEvidence(hypotheses[0], buildLaunchEvidence(config.launchPlan));
  }
  const decisions = (config.decisions || []).map(normalizeDesignDecision);
  const ranked = rankDesignHypotheses(hypotheses).map((hypothesis) => {
    const recordedDecision = findDecisionForHypothesis(hypothesis, decisions);
    const actionItem = recommendNextDesignAction(hypothesis);
    const needsDecision = ['accept', 'reject'].includes(actionItem.type) && !recordedDecision;
    return {
      ...hypothesis,
      recordedDecision,
      decisionStatus: recordedDecision?.status || null,
      missingDecisionCommand: needsDecision ? decisionCommandForHypothesis(hypothesis, actionItem) : null,
      nextAction: recordedDecision
        ? `Decision recorded: ${recordedDecision.status}`
        : actionItem.label,
    };
  });
  const accepted = ranked.filter((item) => item.state === 'accepted');
  const rejected = ranked.filter((item) => item.state === 'rejected');
  const evidenceGaps = ranked.flatMap((item) => buildEvidenceGaps(item).map((gap) => ({ ...gap, hypothesisId: item.id, title: item.title })));
  const missingDecisionRecords = ranked
    .filter((item) => item.missingDecisionCommand)
    .map((item) => ({
      hypothesisId: item.id,
      title: item.title,
      command: item.missingDecisionCommand,
    }));
  const decisionCommands = missingDecisionRecords.map((item) => item.command);
  const evidenceCommands = ranked
    .slice(0, 6)
    .map((item) => recommendNextDesignAction(item).command)
    .filter((command) => command !== 'record decision');
  const recommendedCommands = unique([...decisionCommands, ...evidenceCommands]);
  const fallbackCommands = [
    'npm run playtest:coach -- --markdown',
    'npm run launch:copilot -- --target internal-playtest --markdown',
    'npm run ops:oracle -- --markdown',
  ];
  const snapshot = {
    schemaVersion: DESIGN_TOWER_SCHEMA_VERSION,
    id: `design-snapshot-${hashString(`${generatedAt}:${seed}:${ranked.length}`).toString(16)}`,
    generatedAt,
    mode: config.heavy ? 'heavy' : 'lightweight',
    topHypotheses: ranked,
    acceptedChanges: accepted,
    rejectedChanges: rejected,
    evidenceGaps,
    recordedDecisions: decisions,
    missingDecisionRecords,
    launchSensitiveChanges: ranked.filter((item) => item.category === 'launch-readiness' || item.score.launchRelevance >= 30),
    recommendedCommands: recommendedCommands.length ? recommendedCommands : fallbackCommands,
    health: designHealth(ranked, evidenceGaps),
    packet: null,
  };
  snapshot.packet = generateDesignPacket(snapshot);
  validateDesignPacket(snapshot.packet);
  return snapshot;
}

function designHealth(hypotheses, evidenceGaps) {
  const avgScore = Math.round(average(hypotheses.map((item) => item.score.total)));
  const avgConfidence = Math.round(average(hypotheses.map((item) => item.score.confidence)));
  const humanGaps = evidenceGaps.filter((gap) => gap.sourceType === 'playtest-coach').length;
  const launchGaps = evidenceGaps.filter((gap) => gap.sourceType === 'launch-copilot').length;
  const evidenceCompleteness = Math.max(0, 100 - evidenceGaps.length * 8);
  const top = hypotheses.slice(0, 8);
  const topScore = Math.round(average(top.map((item) => item.score.total)));
  const acceptReadyRate = top.length
    ? top.filter((item) => recommendNextDesignAction(item).type === 'accept').length / top.length
    : 0;
  const baseScore = Math.round(clamp(
    avgScore * 0.35 +
      topScore * 0.25 +
      avgConfidence * 0.2 +
      evidenceCompleteness * 0.15 +
      acceptReadyRate * 100 * 0.05,
    0,
    100,
  ));
  const earnsAPlus =
    evidenceGaps.length === 0 &&
    humanGaps === 0 &&
    launchGaps === 0 &&
    acceptReadyRate >= 0.75 &&
    topScore >= 85 &&
    avgConfidence >= 75;
  const score = earnsAPlus ? Math.max(95, baseScore) : baseScore;
  return {
    score,
    status: score >= 85 ? 'green' : score >= 70 ? 'yellow' : score >= 50 ? 'orange' : 'red',
    grade: score >= 95 ? 'A+' : score >= 90 ? 'A' : score >= 85 ? 'A-' : score >= 80 ? 'B+' : score >= 75 ? 'B' : score >= 70 ? 'B-' : score >= 60 ? 'C' : 'D',
    averageHypothesisScore: avgScore,
    topHypothesisScore: topScore,
    averageConfidence: avgConfidence,
    evidenceCompleteness,
    acceptReadyRate,
    evidenceGapCount: evidenceGaps.length,
    humanValidationGapCount: humanGaps,
    launchProofGapCount: launchGaps,
  };
}

export function generateDesignPacket(snapshot) {
  return {
    schemaVersion: DESIGN_TOWER_SCHEMA_VERSION,
    id: `design-packet-${snapshot.id}`,
    generatedAt: snapshot.generatedAt,
    health: snapshot.health,
    topBacklog: snapshot.topHypotheses.slice(0, 8).map(designBacklogRow),
    acceptedChanges: snapshot.acceptedChanges.map(designBacklogRow),
    rejectedChanges: snapshot.rejectedChanges.map(designBacklogRow),
    evidenceGaps: snapshot.evidenceGaps.slice(0, 12),
    recordedDecisions: (snapshot.recordedDecisions || []).map((decision) => ({
      id: decision.id,
      title: decision.title,
      status: decision.status,
      operator: decision.operator,
      createdAt: decision.createdAt,
    })),
    missingDecisionRecords: snapshot.missingDecisionRecords || [],
    nextCommands: snapshot.recommendedCommands,
    decisionMemos: snapshot.topHypotheses.slice(0, 5).map(generateDecisionMemo),
  };
}

function validateDesignPacket(packet) {
  const required = ['schemaVersion', 'id', 'generatedAt', 'health', 'topBacklog', 'evidenceGaps', 'nextCommands', 'decisionMemos'];
  for (const key of required) {
    if (!(key in packet)) throw new Error(`Design packet missing required field: ${key}`);
  }
  return true;
}

function designBacklogRow(hypothesis) {
  return {
    id: hypothesis.id,
    title: hypothesis.title,
    category: hypothesis.category,
    state: hypothesis.state,
    score: hypothesis.score.total,
    confidence: hypothesis.score.confidence,
    nextAction: hypothesis.nextAction || recommendNextDesignAction(hypothesis).label,
    decisionStatus: hypothesis.decisionStatus || null,
    evidenceSources: summarizeEvidenceStack(hypothesis).sources,
  };
}

export function exportDesignPacketJson(snapshotOrPacket) {
  const packet = snapshotOrPacket.packet || snapshotOrPacket;
  return JSON.stringify(packet, null, 2);
}

export function exportDesignPacketMarkdown(snapshotOrPacket) {
  const packet = snapshotOrPacket.packet || snapshotOrPacket;
  return [
    '# Plundrix Design Control Tower',
    '',
    `Generated: ${packet.generatedAt}`,
    `Health: ${packet.health.score}/100 (${packet.health.status})`,
    `Grade: ${packet.health.grade || 'ungraded'}`,
    `Average confidence: ${packet.health.averageConfidence}/100`,
    `Evidence gaps: ${packet.health.evidenceGapCount ?? packet.evidenceGaps.length}`,
    `Human validation gaps: ${packet.health.humanValidationGapCount}`,
    `Recorded decisions: ${(packet.recordedDecisions || []).length}`,
    `Missing decision records: ${(packet.missingDecisionRecords || []).length}`,
    '',
    '## Top Backlog',
    '',
    ...packet.topBacklog.map((item, index) => `${index + 1}. ${item.title} (${item.category}) - ${item.nextAction}`),
    '',
    '## Evidence Gaps',
    '',
    ...(packet.evidenceGaps.length ? packet.evidenceGaps.map((gap) => `- ${gap.title || gap.hypothesisId}: ${gap.label} - ${gap.command}`) : ['- No evidence gaps.']),
    '',
    '## Decision Records',
    '',
    ...((packet.recordedDecisions || []).length
      ? packet.recordedDecisions.map((decision) => `- ${decision.title}: ${decision.status} by ${decision.operator}`)
      : ['- No recorded decisions loaded.']),
    '',
    '## Missing Decision Records',
    '',
    ...((packet.missingDecisionRecords || []).length
      ? packet.missingDecisionRecords.map((item) => `- ${item.title}: ${item.command}`)
      : ['- No missing decision records.']),
    '',
    '## Next Commands',
    '',
    ...packet.nextCommands.map((command) => `- ${command}`),
    '',
    '## Decision Memos',
    '',
    ...packet.decisionMemos.map((memo) => `- ${memo.title}: ${memo.recommendation}`),
    '',
  ].join('\n');
}

export function exportDesignBacklogCsv(backlog) {
  const rows = [
    ['rank', 'id', 'title', 'category', 'state', 'score', 'confidence', 'effort', 'nextAction', 'evidenceSources'],
    ...backlog.map((item, index) => [
      item.rank || index + 1,
      item.id,
      item.title,
      item.category,
      item.state,
      item.score?.total ?? 0,
      item.score?.confidence ?? 0,
      item.metrics?.implementationEffort ?? '',
      recommendNextDesignAction(item).label,
      summarizeEvidenceStack(item).sources.join('|'),
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
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

export function saveDesignHypothesis(hypothesis) {
  validateDesignHypothesis(hypothesis);
  const items = [hypothesis, ...readStorage(DESIGN_TOWER_HYPOTHESIS_KEY).filter((item) => item.id !== hypothesis.id)].slice(0, 100);
  writeStorage(DESIGN_TOWER_HYPOTHESIS_KEY, items);
  return items;
}

export function listDesignHypotheses() {
  return readStorage(DESIGN_TOWER_HYPOTHESIS_KEY).map(migrateDesignHypothesis);
}

export function saveDesignDecision(decision) {
  validateDesignDecision(decision);
  const items = [decision, ...readStorage(DESIGN_TOWER_DECISION_KEY).filter((item) => item.id !== decision.id)].slice(0, 100);
  writeStorage(DESIGN_TOWER_DECISION_KEY, items);
  return items;
}

export function listDesignDecisions() {
  return readStorage(DESIGN_TOWER_DECISION_KEY);
}

export function saveDesignPacket(packet) {
  validateDesignPacket(packet);
  const items = [packet, ...readStorage(DESIGN_TOWER_PACKET_KEY).filter((item) => item.id !== packet.id)].slice(0, 40);
  writeStorage(DESIGN_TOWER_PACKET_KEY, items);
  return items;
}

export function listDesignPackets() {
  return readStorage(DESIGN_TOWER_PACKET_KEY);
}

export function exportDesignHypotheses() {
  return JSON.stringify(listDesignHypotheses(), null, 2);
}

export function importDesignHypotheses(text) {
  const hypotheses = JSON.parse(text).map(migrateDesignHypothesis);
  hypotheses.forEach(validateDesignHypothesis);
  writeStorage(DESIGN_TOWER_HYPOTHESIS_KEY, hypotheses);
  return hypotheses;
}

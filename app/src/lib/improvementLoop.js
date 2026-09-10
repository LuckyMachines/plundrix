export const IMPROVEMENT_SCHEMA_VERSION = 1;

export const EVIDENCE_TIERS = Object.freeze({
  T0: Object.freeze({ rank: 0, label: 'Opinion', requirement: 'A stated belief or qualitative hunch.' }),
  T1: Object.freeze({ rank: 1, label: 'Simulation', requirement: 'A deterministic simulation, model, or synthetic replay.' }),
  T2: Object.freeze({ rank: 2, label: 'Automated product proof', requirement: 'A passing browser, contract, accessibility, or build check.' }),
  T3: Object.freeze({ rank: 3, label: 'Observed human evidence', requirement: 'A facilitator confirms an actual player was observed.' }),
  T4: Object.freeze({ rank: 4, label: 'Production behavior', requirement: 'An aggregate production measurement with no personal identifiers.' }),
});

export const EXPERIMENT_STATUSES = Object.freeze(['backlog', 'active', 'measuring', 'paused', 'decided', 'archived']);
export const EXPERIMENT_DECISIONS = Object.freeze(['ship', 'iterate', 'revert', 'stop']);
export const METRIC_DIRECTIONS = Object.freeze(['at-least', 'at-most', 'exactly']);

const CLOSED_STATUSES = new Set(['decided', 'archived']);

function finiteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseDate(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : null;
}

function gradeFor(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function evidenceIsValid(evidence = {}) {
  if (!EVIDENCE_TIERS[evidence.tier]) return false;
  if (!String(evidence.source || '').trim()) return false;
  if (!parseDate(evidence.capturedAt)) return false;
  if (evidence.tier === 'T3' && evidence.humanVerified !== true) return false;
  if (evidence.tier === 'T4' && evidence.production !== true) return false;
  return true;
}

export function tierMeets(actual, required) {
  return Boolean(EVIDENCE_TIERS[actual] && EVIDENCE_TIERS[required] && EVIDENCE_TIERS[actual].rank >= EVIDENCE_TIERS[required].rank);
}

export function validateImprovementLedger(ledger = {}) {
  const errors = [];
  const warnings = [];
  if (ledger.schemaVersion !== IMPROVEMENT_SCHEMA_VERSION) errors.push(`schemaVersion must be ${IMPROVEMENT_SCHEMA_VERSION}.`);
  if (ledger.operatingMode !== 'solo') warnings.push('operatingMode should remain solo unless the project gains a team.');
  if (!Array.isArray(ledger.metrics) || ledger.metrics.length === 0) errors.push('At least one metric is required.');
  if (!Array.isArray(ledger.experiments)) errors.push('experiments must be an array.');

  const metricIds = new Set();
  for (const metric of ledger.metrics || []) {
    if (!metric.id || metricIds.has(metric.id)) errors.push(`Metric id is missing or duplicated: ${metric.id || '(missing)'}.`);
    metricIds.add(metric.id);
    if (!METRIC_DIRECTIONS.includes(metric.direction)) errors.push(`${metric.id}: invalid direction.`);
    if (!EVIDENCE_TIERS[metric.requiredEvidenceTier]) errors.push(`${metric.id}: invalid requiredEvidenceTier.`);
    if (!Number.isFinite(Number(metric.target))) errors.push(`${metric.id}: target must be numeric.`);
    if (finiteNumber(metric.minimumSample) < 1) errors.push(`${metric.id}: minimumSample must be at least 1.`);
    for (const measurement of metric.measurements || []) {
      if (!evidenceIsValid(measurement)) errors.push(`${metric.id}: invalid ${measurement.tier || 'unknown'} measurement evidence.`);
      if (!Number.isFinite(Number(measurement.value))) errors.push(`${metric.id}: measurement value must be numeric.`);
    }
  }
  if (!metricIds.has(ledger.northStarMetricId)) errors.push(`Unknown northStarMetricId: ${ledger.northStarMetricId || '(missing)'}.`);

  const experimentIds = new Set();
  for (const experiment of ledger.experiments || []) {
    if (!experiment.id || experimentIds.has(experiment.id)) errors.push(`Experiment id is missing or duplicated: ${experiment.id || '(missing)'}.`);
    experimentIds.add(experiment.id);
    if (!EXPERIMENT_STATUSES.includes(experiment.status)) errors.push(`${experiment.id}: invalid status.`);
    if (!metricIds.has(experiment.primaryMetric)) errors.push(`${experiment.id}: unknown primaryMetric ${experiment.primaryMetric}.`);
    if (!EVIDENCE_TIERS[experiment.requiredEvidenceTier]) errors.push(`${experiment.id}: invalid requiredEvidenceTier.`);
    if (!String(experiment.hypothesis || '').trim()) errors.push(`${experiment.id}: hypothesis is required.`);
    if (!parseDate(experiment.createdAt)) errors.push(`${experiment.id}: createdAt must be an ISO date.`);
    for (const evidence of experiment.evidence || []) {
      if (!evidenceIsValid(evidence)) errors.push(`${experiment.id}: invalid ${evidence.tier || 'unknown'} evidence.`);
    }
    if (experiment.status === 'decided' && !EXPERIMENT_DECISIONS.includes(experiment.decision?.outcome)) {
      errors.push(`${experiment.id}: a decided experiment requires a valid decision.`);
    }
  }

  const active = (ledger.experiments || []).filter((item) => ['active', 'measuring'].includes(item.status));
  const maxActive = finiteNumber(ledger.policy?.maxActiveExperiments, 1);
  if (active.length > maxActive) errors.push(`Solo WIP limit exceeded: ${active.length} active, maximum ${maxActive}.`);
  if (!active.length) warnings.push('No active experiment. Choose exactly one next learning question.');
  return { ok: errors.length === 0, errors, warnings };
}

export function evaluateMetric(metric, runtimeMeasurements = []) {
  const measurements = [...(metric.measurements || []), ...runtimeMeasurements.filter((item) => item.metricId === metric.id)]
    .sort((a, b) => (parseDate(b.capturedAt) || 0) - (parseDate(a.capturedAt) || 0));
  const latest = measurements[0] || null;
  if (!latest) return { ...metric, state: 'missing', latest: null, pass: false };
  if (!evidenceIsValid(latest)) return { ...metric, state: 'invalid-evidence', latest, pass: false };
  if (!tierMeets(latest.tier, metric.requiredEvidenceTier)) return { ...metric, state: 'insufficient-evidence', latest, pass: false };
  if (finiteNumber(latest.sampleSize) < finiteNumber(metric.minimumSample, 1)) return { ...metric, state: 'insufficient-sample', latest, pass: false };
  const value = finiteNumber(latest.value);
  const target = finiteNumber(metric.target);
  const pass = metric.direction === 'at-most' ? value <= target : metric.direction === 'exactly' ? value === target : value >= target;
  return { ...metric, state: pass ? 'pass' : 'fail', latest, pass };
}

export function rankExperiments(experiments = [], now = new Date(), expiryDays = 30) {
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return experiments
    .filter((item) => !CLOSED_STATUSES.has(item.status))
    .map((item) => {
      const overdue = parseDate(item.reviewBy) !== null && parseDate(item.reviewBy) < nowMs;
      const lastTouched = parseDate(item.lastReviewedAt) || parseDate(item.createdAt) || nowMs;
      const expired = ['backlog', 'paused'].includes(item.status) && nowMs - lastTouched > finiteNumber(expiryDays, 30) * 86_400_000;
      const score = finiteNumber(item.impact, 3) * 8
        + finiteNumber(item.urgency, 3) * 6
        + finiteNumber(item.confidence, 3) * 4
        - finiteNumber(item.effort, 3) * 5
        + (['active', 'measuring'].includes(item.status) ? 24 : 0)
        + (overdue ? 10 : 0);
      return { ...item, overdue, expired, priorityScore: score };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || a.id.localeCompare(b.id))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function recommendedNextAction(experiments = [], now = new Date(), expiryDays = 30) {
  const item = rankExperiments(experiments, now, expiryDays)[0];
  if (!item) return { experimentId: null, action: 'Add one small, falsifiable improvement experiment.' };
  const validEvidence = (item.evidence || []).filter(evidenceIsValid);
  const strongest = validEvidence.sort((a, b) => EVIDENCE_TIERS[b.tier].rank - EVIDENCE_TIERS[a.tier].rank)[0];
  if (item.status === 'backlog' || item.status === 'paused') return { experimentId: item.id, action: `Activate ${item.title}; pause every other experiment.` };
  if (!strongest || !tierMeets(strongest.tier, item.requiredEvidenceTier)) {
    return { experimentId: item.id, action: `Collect ${item.requiredEvidenceTier} ${EVIDENCE_TIERS[item.requiredEvidenceTier].label.toLowerCase()} for ${item.title}.` };
  }
  return { experimentId: item.id, action: `Decide ${item.title}: ship, iterate, revert, or stop.` };
}

export function buildImprovementSnapshot({ ledger, generatedAt = new Date().toISOString(), buildSha = 'unknown', checks = [], runtimeMeasurements = [] }) {
  const validation = validateImprovementLedger(ledger);
  const metrics = (ledger.metrics || []).map((metric) => evaluateMetric(metric, runtimeMeasurements));
  const qualified = metrics.filter((metric) => ['pass', 'fail'].includes(metric.state));
  const passed = qualified.filter((metric) => metric.pass);
  const evidenceCoverage = metrics.length ? qualified.length / metrics.length : 0;
  const measuredQuality = qualified.length ? passed.length / qualified.length : 0;
  const evidenceScore = Math.round((evidenceCoverage * 60 + measuredQuality * 40) * 100) / 100;
  const ranked = rankExperiments(ledger.experiments || [], generatedAt, ledger.policy?.recommendationExpiryDays);
  const stale = ranked.filter((item) => item.overdue);
  const closed = (ledger.experiments || []).filter((item) => CLOSED_STATUSES.has(item.status));
  const closedWithDecision = closed.filter((item) => item.decision?.outcome && item.decision?.reason);
  const activeCount = (ledger.experiments || []).filter((item) => ['active', 'measuring'].includes(item.status)).length;
  const validEvidence = (ledger.experiments || []).flatMap((item) => item.evidence || []).filter(evidenceIsValid).length;
  const allEvidence = (ledger.experiments || []).flatMap((item) => item.evidence || []).length;
  const processScore = clamp(
    (validation.ok ? 25 : 0)
      + (activeCount === 1 ? 20 : activeCount === 0 ? 10 : 0)
      + (stale.length === 0 ? 15 : 0)
      + (allEvidence === validEvidence ? 20 : 0)
      + (closed.length ? (closedWithDecision.length / closed.length) * 20 : 10),
    0,
    100,
  );
  const failedChecks = checks.filter((check) => !check.ok);
  const flakyChecks = checks.filter((check) => check.flaky);
  const northStar = metrics.find((metric) => metric.id === ledger.northStarMetricId) || null;
  return {
    schemaVersion: IMPROVEMENT_SCHEMA_VERSION,
    generatedAt,
    buildSha,
    operatingMode: ledger.operatingMode,
    health: {
      processScore: Math.round(processScore),
      processGrade: gradeFor(processScore),
      evidenceScore: Math.round(evidenceScore),
      evidenceGrade: gradeFor(evidenceScore),
      metricCoverage: `${qualified.length}/${metrics.length}`,
      activeCount,
      staleCount: stale.length,
      expiredCount: ranked.filter((item) => item.expired).length,
      failedCheckCount: failedChecks.length,
      flakyCheckCount: flakyChecks.length,
    },
    scorecard: metrics,
    northStar,
    experiments: ranked,
    evidenceDebt: metrics.filter((metric) => !['pass', 'fail'].includes(metric.state)),
    nextAction: recommendedNextAction(ledger.experiments || [], generatedAt, ledger.policy?.recommendationExpiryDays),
    checks,
    validation,
  };
}

function formatMetric(metric) {
  const value = metric.latest ? `${metric.latest.value}${metric.unit || ''} / n=${metric.latest.sampleSize}` : 'not measured';
  return `| ${metric.label} | ${metric.state} | ${value} | ${metric.direction} ${metric.target}${metric.unit || ''} | ${metric.requiredEvidenceTier} |`;
}

export function exportImprovementMarkdown(snapshot) {
  const lines = [
    '# Plundrix Improvement Loop',
    '',
    `Generated: ${snapshot.generatedAt}`,
    `Build: ${snapshot.buildSha}`,
    `Mode: ${snapshot.operatingMode}`,
    '',
    '## Do this next',
    '',
    `**${snapshot.nextAction.action}**`,
    '',
    'Keep one experiment active. Spend no more than 30 minutes on the weekly review; spend the rest making or observing.',
    '',
    '## Health',
    '',
    `- Process: ${snapshot.health.processScore}/100 (${snapshot.health.processGrade})`,
    `- Real evidence: ${snapshot.health.evidenceScore}/100 (${snapshot.health.evidenceGrade})`,
    `- Qualified metrics: ${snapshot.health.metricCoverage}`,
    `- Active experiments: ${snapshot.health.activeCount}`,
    `- Overdue reviews: ${snapshot.health.staleCount}`,
    `- Expired backlog items: ${snapshot.health.expiredCount}`,
    `- Failed automated checks: ${snapshot.health.failedCheckCount}`,
    `- Flaky automated checks: ${snapshot.health.flakyCheckCount}`,
    `- North star: ${snapshot.northStar ? `${snapshot.northStar.label} - ${snapshot.northStar.state}` : 'not configured'}`,
    '',
    '## Player scorecard',
    '',
    '| Metric | State | Latest | Target | Required proof |',
    '| --- | --- | ---: | ---: | --- |',
    ...snapshot.scorecard.map(formatMetric),
    '',
    '## Experiment queue',
    '',
    ...snapshot.experiments.map((item) => `- #${item.rank} **${item.title}** - ${item.status}; priority ${item.priorityScore}; requires ${item.requiredEvidenceTier}${item.overdue ? '; REVIEW OVERDUE' : ''}${item.expired ? '; EXPIRED' : ''}.`),
    '',
    '## Evidence debt',
    '',
    ...(snapshot.evidenceDebt.length ? snapshot.evidenceDebt.map((metric) => `- ${metric.label}: ${metric.state}; needs ${metric.requiredEvidenceTier}, minimum n=${metric.minimumSample}.`) : ['- None.']),
  ];
  if (snapshot.checks.length) {
    lines.push('', '## Automated checks', '', ...snapshot.checks.map((check) => `- ${check.ok ? check.flaky ? 'FLAKY' : 'PASS' : 'FAIL'} ${check.label} (${check.durationMs}ms)`));
  }
  if (snapshot.validation.warnings.length) lines.push('', '## Warnings', '', ...snapshot.validation.warnings.map((warning) => `- ${warning}`));
  return `${lines.join('\n')}\n`;
}

export function activateExperiment(ledger, experimentId, changedAt = new Date().toISOString()) {
  if (!(ledger.experiments || []).some((item) => item.id === experimentId)) throw new Error(`Unknown experiment: ${experimentId}`);
  return {
    ...ledger,
    updatedAt: changedAt,
    experiments: ledger.experiments.map((item) => ({
      ...item,
      status: item.id === experimentId ? 'active' : ['active', 'measuring'].includes(item.status) ? 'paused' : item.status,
      lastReviewedAt: item.id === experimentId ? changedAt : item.lastReviewedAt,
    })),
  };
}

export function recordMetricMeasurement(ledger, metricId, measurement) {
  if (!(ledger.metrics || []).some((item) => item.id === metricId)) throw new Error(`Unknown metric: ${metricId}`);
  if (!evidenceIsValid(measurement)) throw new Error(`Invalid ${measurement.tier || 'unknown'} evidence for ${metricId}.`);
  if (!Number.isFinite(Number(measurement.value)) || finiteNumber(measurement.sampleSize) < 1) throw new Error('A numeric value and sampleSize >= 1 are required.');
  return {
    ...ledger,
    updatedAt: measurement.capturedAt,
    metrics: ledger.metrics.map((metric) => metric.id === metricId
      ? { ...metric, measurements: [...(metric.measurements || []), { ...measurement, value: Number(measurement.value), sampleSize: Number(measurement.sampleSize) }] }
      : metric),
  };
}

export function attachExperimentEvidence(ledger, experimentId, evidence) {
  if (!evidenceIsValid(evidence)) throw new Error(`Invalid ${evidence.tier || 'unknown'} experiment evidence.`);
  let found = false;
  const experiments = ledger.experiments.map((experiment) => {
    if (experiment.id !== experimentId) return experiment;
    found = true;
    return { ...experiment, status: 'measuring', lastReviewedAt: evidence.capturedAt, evidence: [...(experiment.evidence || []), evidence] };
  });
  if (!found) throw new Error(`Unknown experiment: ${experimentId}`);
  return { ...ledger, updatedAt: evidence.capturedAt, experiments };
}

export function decideExperiment(ledger, experimentId, decision, changedAt = new Date().toISOString()) {
  if (!EXPERIMENT_DECISIONS.includes(decision.outcome)) throw new Error(`Invalid decision outcome: ${decision.outcome}`);
  if (!String(decision.reason || '').trim()) throw new Error('A decision reason is required.');
  let found = false;
  const experiments = ledger.experiments.map((experiment) => {
    if (experiment.id !== experimentId) return experiment;
    found = true;
    return { ...experiment, status: 'decided', lastReviewedAt: changedAt, decision: { ...decision, decidedAt: changedAt } };
  });
  if (!found) throw new Error(`Unknown experiment: ${experimentId}`);
  return { ...ledger, updatedAt: changedAt, experiments };
}

export function archiveExpiredExperiments(ledger, changedAt = new Date().toISOString()) {
  const expiryMs = finiteNumber(ledger.policy?.recommendationExpiryDays, 30) * 86_400_000;
  const nowMs = parseDate(changedAt) || Date.now();
  return {
    ...ledger,
    updatedAt: changedAt,
    experiments: ledger.experiments.map((experiment) => {
      const lastTouched = parseDate(experiment.lastReviewedAt) || parseDate(experiment.createdAt) || nowMs;
      const expired = ['backlog', 'paused'].includes(experiment.status) && nowMs - lastTouched > expiryMs;
      return expired ? { ...experiment, status: 'archived', archivedAt: changedAt, archiveReason: 'Expired without fresh evidence.' } : experiment;
    }),
  };
}

export function importObservedSessions(ledger, payload, { source = 'first-run-observation-export', artifact = '', capturedAt = new Date().toISOString(), humanVerified = false } = {}) {
  const records = Array.isArray(payload) ? payload : payload?.records;
  if (!Array.isArray(records) || records.length === 0) throw new Error('Observation import requires at least one record.');
  if (!humanVerified || records.some((record) => record.observerConfirmed !== true)) {
    throw new Error('T3 evidence requires --human-verified and observerConfirmed=true on every record.');
  }
  const rate = (key) => Math.round((records.filter((record) => record[key]).length / records.length) * 1000) / 10;
  const sortedSeconds = records.map((record) => finiteNumber(record.secondsToFirstAction)).sort((a, b) => a - b);
  const middle = Math.floor(sortedSeconds.length / 2);
  const medianSeconds = Math.round(sortedSeconds.length % 2
    ? sortedSeconds[middle]
    : (sortedSeconds[middle - 1] + sortedSeconds[middle]) / 2);
  const measurements = [
    ['first-action-completion', rate('completedFirstAction')],
    ['time-to-first-action', medianSeconds],
    ['goal-comprehension', rate('understoodGoal')],
    ['cause-comprehension', rate('understoodWhy')],
    ['replay-intent', rate('wantedReplay')],
  ];
  return measurements.reduce((next, [metricId, value]) => recordMetricMeasurement(next, metricId, {
    tier: 'T3', source, artifact, capturedAt, humanVerified: true, sampleSize: records.length, value,
  }), ledger);
}

export function importMetricBundle(ledger, payload, { artifact = '', productionVerified = false } = {}) {
  if (!Array.isArray(payload?.metrics) || payload.metrics.length === 0) throw new Error('Metric import requires a non-empty metrics array.');
  const tier = String(payload.evidenceTier || 'T4').toUpperCase();
  if (tier === 'T4' && (!productionVerified || payload.production !== true)) {
    throw new Error('T4 metric imports require production=true in the file and --production at import time.');
  }
  return payload.metrics.reduce((next, metric) => recordMetricMeasurement(next, metric.id, {
    tier,
    source: String(payload.source || 'aggregate-metric-import'),
    artifact,
    capturedAt: payload.capturedAt || new Date().toISOString(),
    sampleSize: Number(metric.sampleSize),
    value: Number(metric.value),
    humanVerified: tier === 'T3' ? payload.humanVerified === true : undefined,
    production: tier === 'T4' ? true : undefined,
    buildSha: String(payload.buildSha || 'unknown'),
    rulesetId: String(payload.rulesetId || 'unknown'),
  }), ledger);
}

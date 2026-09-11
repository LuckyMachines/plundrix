import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  activateExperiment,
  archiveExpiredExperiments,
  attachExperimentEvidence,
  buildImprovementSnapshot,
  decideExperiment,
  evidenceIsValid,
  exportImprovementMarkdown,
  importMetricBundle,
  importObservedSessions,
  recordMetricMeasurement,
  validateImprovementLedger,
} from '../src/lib/improvementLoop.js';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = resolve(appDir, 'improvement', 'ledger.json');
const reportDir = resolve(appDir, 'reports', 'improvement');

const QUICK_CHECKS = Object.freeze([
  ['improvement-system', 'Improvement-system tests', ['run', 'test:improvement']],
  ['growth-system', 'SEO and marketing-system tests', ['run', 'test:growth']],
  ['preferences', 'Menu and preference-system tests', ['run', 'test:preferences']],
  ['ui-review-system', 'UI review manifest and governance tests', ['run', 'test:ui-system']],
  ['art-manifest', 'Art manifest validation', ['run', 'art:validate']],
  ['inventory', 'Workshop inventory tests', ['run', 'test:inventory']],
  ['replay', 'Replay-system tests', ['run', 'test:replay']],
  ['fun', 'Fun-system tests', ['run', 'test:fun']],
  ['telemetry', 'Telemetry tests', ['run', 'test:telemetry']],
  ['cohesion', 'Product-cohesion gate', ['run', 'cohesion:check']],
  ['build', 'Production build', ['run', 'build']],
  ['seo', 'Static SEO and delivery tests', ['run', 'test:seo']],
]);

const RELEASE_CHECKS = Object.freeze([
  ['core', 'Contracts, agent, integration, and tournament tests', ['--prefix', '..', 'test']],
  ['browser', 'Browser journeys', ['run', 'test:e2e', '--', '--retries=1'], 600_000],
]);

function readArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function required(args, key, operation) {
  const value = args[key];
  if (value === undefined || value === true || String(value).trim() === '') throw new Error(`${operation} requires --${key} <value>.`);
  return String(value).trim();
}

function gitSha() {
  const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: appDir, encoding: 'utf8', windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : 'unknown';
}

async function writeJsonAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, path);
}

function runCheck([id, label, args, timeout = 300_000]) {
  const started = Date.now();
  const result = spawnSync('npm', args, {
    cwd: appDir,
    encoding: 'utf8',
    windowsHide: true,
    shell: process.platform === 'win32',
    timeout,
  });
  const ok = result.status === 0;
  const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  return {
    id,
    label,
    ok,
    status: result.status,
    flaky: ok && /\bflaky\b/i.test(combinedOutput),
    durationMs: Date.now() - started,
    outputTail: ok && !/\bflaky\b/i.test(combinedOutput) ? '' : combinedOutput.slice(-6000),
  };
}

function addExperiment(ledger, args, now) {
  const id = required(args, 'add', '--add');
  if (ledger.experiments.some((item) => item.id === id)) throw new Error(`Experiment already exists: ${id}`);
  const review = new Date(new Date(now).getTime() + Number(ledger.policy.reviewCadenceDays || 7) * 86_400_000).toISOString();
  return {
    ...ledger,
    updatedAt: now,
    experiments: [...ledger.experiments, {
      id,
      title: required(args, 'title', '--add'),
      status: 'backlog',
      surface: String(args.surface || 'product'),
      hypothesis: required(args, 'hypothesis', '--add'),
      primaryMetric: required(args, 'metric', '--add'),
      requiredEvidenceTier: String(args.tier || 'T3').toUpperCase(),
      impact: Number(args.impact || 3),
      confidence: Number(args.confidence || 2),
      urgency: Number(args.urgency || 3),
      effort: Number(args.effort || 2),
      createdAt: now,
      lastReviewedAt: now,
      reviewBy: review,
      guardrails: String(args.guardrails || '').split('|').map((item) => item.trim()).filter(Boolean),
      evidence: [],
      decision: null,
    }],
  };
}

function evidenceFromArgs(args, now) {
  return {
    tier: required(args, 'tier', 'evidence recording').toUpperCase(),
    source: required(args, 'source', 'evidence recording'),
    artifact: String(args.artifact || ''),
    summary: required(args, 'summary', 'evidence recording'),
    capturedAt: String(args['captured-at'] || now),
    sampleSize: Number(args['sample-size'] || 1),
    humanVerified: Boolean(args['human-verified']),
    production: Boolean(args.production),
    buildSha: String(args['build-sha'] || gitSha()),
    rulesetId: String(args.ruleset || 'current'),
  };
}

function printHelp() {
  console.log(`Plundrix solo improvement loop

PowerShell examples:
  npm run improve
  npm run improve:verify
  npm run improve:release
  npm run improve -- --activate first-run-comprehension
  npm run improve -- --import-observations <json-path> --human-verified
  npm run improve -- --import-metrics <json-path> --production
  npm run improve -- --measure goal-comprehension --value 85 --sample-size 4 --tier T3 --source facilitated-playtest --summary "Three of four players explained the goal" --human-verified
  npm run improve -- --record-evidence first-run-comprehension --tier T3 --source facilitated-playtest --summary "Four sessions complete" --human-verified
  npm run improve -- --decide first-run-comprehension --outcome iterate --reason "Result explanation needs one clearer sentence"
  npm run improve -- --add experiment-id --title "Short title" --hypothesis "Falsifiable claim" --metric goal-comprehension --tier T3
  npm run improve -- --archive-stale
`);
}

const args = readArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

let ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
const now = new Date().toISOString();
let changed = false;

if (args.add) {
  ledger = addExperiment(ledger, args, now);
  changed = true;
}
if (args.activate) {
  ledger = activateExperiment(ledger, String(args.activate), now);
  changed = true;
}
if (args.measure) {
  const evidence = { ...evidenceFromArgs(args, now), value: Number(required(args, 'value', '--measure')) };
  ledger = recordMetricMeasurement(ledger, String(args.measure), evidence);
  const active = ledger.experiments.find((item) => ['active', 'measuring'].includes(item.status) && item.primaryMetric === String(args.measure));
  if (active) ledger = attachExperimentEvidence(ledger, active.id, evidence);
  changed = true;
}
if (args['record-evidence']) {
  ledger = attachExperimentEvidence(ledger, String(args['record-evidence']), evidenceFromArgs(args, now));
  changed = true;
}
if (args['import-observations']) {
  const importPath = resolve(appDir, String(args['import-observations']));
  const payload = JSON.parse(await readFile(importPath, 'utf8'));
  ledger = importObservedSessions(ledger, payload, {
    source: 'facilitated-first-run-observations',
    artifact: importPath,
    capturedAt: payload.exportedAt || now,
    humanVerified: Boolean(args['human-verified']),
  });
  const importedMetricIds = new Set(['first-action-completion', 'time-to-first-action', 'goal-comprehension', 'cause-comprehension', 'replay-intent']);
  const active = ledger.experiments.find((item) => ['active', 'measuring'].includes(item.status) && importedMetricIds.has(item.primaryMetric));
  if (active) {
    ledger = attachExperimentEvidence(ledger, active.id, {
      tier: 'T3',
      source: 'facilitated-first-run-observations',
      artifact: importPath,
      summary: `${payload.records.length} anonymous observed sessions imported.`,
      capturedAt: payload.exportedAt || now,
      sampleSize: payload.records.length,
      humanVerified: true,
      buildSha: gitSha(),
      rulesetId: 'current',
    });
  }
  changed = true;
}
if (args['import-metrics']) {
  const importPath = resolve(appDir, String(args['import-metrics']));
  const payload = JSON.parse(await readFile(importPath, 'utf8'));
  ledger = importMetricBundle(ledger, payload, { artifact: importPath, productionVerified: Boolean(args.production) });
  changed = true;
}
if (args.decide) {
  ledger = decideExperiment(ledger, String(args.decide), {
    outcome: required(args, 'outcome', '--decide'),
    reason: required(args, 'reason', '--decide'),
  }, now);
  changed = true;
}
if (args['archive-stale']) {
  ledger = archiveExpiredExperiments(ledger, now);
  changed = true;
}

const validation = validateImprovementLedger(ledger);
if (!validation.ok) throw new Error(`Improvement ledger is invalid:\n- ${validation.errors.join('\n- ')}`);
if (changed) await writeJsonAtomic(ledgerPath, ledger);

const checkDefinitions = args.release ? [...QUICK_CHECKS, ...RELEASE_CHECKS] : args.verify ? QUICK_CHECKS : [];
const checks = [];
for (const definition of checkDefinitions) {
  const check = runCheck(definition);
  checks.push(check);
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.label} (${check.durationMs}ms)`);
  if (!check.ok && !args['keep-going']) break;
}

const runtimeMeasurements = checks.length ? [{
  metricId: 'automated-release-gates',
  tier: 'T2',
  source: args.release ? 'improve:release' : 'improve:verify',
  artifact: 'reports/improvement/latest.json',
  capturedAt: now,
  sampleSize: checks.length,
  value: Math.round((checks.filter((check) => check.ok).length / checks.length) * 100),
}] : [];
const snapshot = buildImprovementSnapshot({ ledger, generatedAt: now, buildSha: gitSha(), checks, runtimeMeasurements });

if (!args.check) {
  await mkdir(reportDir, { recursive: true });
  await writeJsonAtomic(resolve(reportDir, 'latest.json'), snapshot);
  await writeFile(resolve(reportDir, 'latest.md'), exportImprovementMarkdown(snapshot), 'utf8');
}

if (args.json) console.log(JSON.stringify(snapshot, null, 2));
else {
  console.log('');
  console.log(`Plundrix improvement loop: process ${snapshot.health.processGrade}, evidence ${snapshot.health.evidenceGrade}`);
  console.log(`Evidence coverage: ${snapshot.health.metricCoverage}`);
  console.log(`Do next: ${snapshot.nextAction.action}`);
  if (!args.check) console.log(`Snapshot: ${resolve(reportDir, 'latest.md')}`);
}

const failedChecks = checks.filter((check) => !check.ok);
const blockingMetrics = snapshot.scorecard.filter((metric) => metric.releaseBlocking && metric.state === 'fail');
if (!validation.ok || failedChecks.length || (args.release && blockingMetrics.length)) process.exitCode = 1;

import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  assessBalancePromotion,
  runAutopilotSearch,
} from '../src/lib/balanceAutopilot.js';
import {
  runBatch,
} from '../src/lib/plundrixEngine.js';
import {
  runGhostBatch,
} from '../src/lib/playerTelemetryGhosts.js';
import {
  buildReplayFromSeed,
} from '../src/lib/replayDirector.js';
import {
  buildMutationLaunchProof,
} from '../src/lib/ruleMutationTimeMachine.js';
import {
  generateLaunchPlan,
  LAUNCH_REQUIRED_SOURCES,
} from '../src/lib/launchCopilot.js';

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

function numberArg(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

async function readLaunchFiles() {
  const root = resolve(process.cwd(), '..');
  const paths = [
    '.gitignore',
    'README.md',
    '.github/workflows/balance-autopilot-smoke.yml',
    ...LAUNCH_REQUIRED_SOURCES.files,
    'app/src/lib/plundrixEngine.js',
    'app/src/lib/balanceAutopilot.js',
    'app/src/lib/replayDirector.js',
    'app/src/lib/liveOpsOracle.js',
    'app/src/lib/playerTelemetryGhosts.js',
    'app/src/lib/ruleMutationTimeMachine.js',
    'app/src/lib/playtestCoach.js',
    'app/src/lib/designControlTower.js',
  ];
  const entries = await Promise.all([...new Set(paths)].map(async (path) => {
    const full = join(root, path);
    if (!existsSync(full)) return [path, ''];
    return [path, await readFile(full, 'utf8')];
  }));
  return Object.fromEntries(entries);
}

async function readJsonIfExists(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readDecisionRecords() {
  const directory = join(process.cwd(), 'reports', 'design-control', 'decisions');
  if (!existsSync(directory)) return [];
  const names = await readdir(directory);
  const decisions = [];
  for (const name of names.filter((item) => item.endsWith('.json')).sort()) {
    decisions.push(JSON.parse(await readFile(join(directory, name), 'utf8')));
  }
  return decisions;
}

async function readImportedPlaytestReports() {
  const directory = join(process.cwd(), 'reports', 'playtest', 'imported');
  if (!existsSync(directory)) return [];
  const names = await readdir(directory);
  const reports = [];
  for (const name of names.filter((item) => item.endsWith('.json')).sort()) {
    const parsed = JSON.parse(await readFile(join(directory, name), 'utf8'));
    reports.push(parsed.report || parsed);
  }
  return reports.sort((a, b) => (b.humanEvidenceConfidence || 0) - (a.humanEvidenceConfidence || 0));
}

function exportMatrixMarkdown(matrix) {
  const best = matrix.bestCandidate;
  return [
    '# Plundrix Balance Matrix',
    '',
    `Generated: ${matrix.generatedAt}`,
    `Budget: ${matrix.budget}`,
    `Best candidate: ${best?.id || 'none'}`,
    `Promotion status: ${matrix.promotion.status}`,
    '',
    '## Scores',
    '',
    `- First match: ${matrix.firstMatch.scorecard.score.toFixed(1)}`,
    `- Comeback: ${matrix.comeback.scorecard.score.toFixed(1)}`,
    `- Ghosts: ${matrix.ghostScore}`,
    `- Replay drama: ${matrix.replay.dramaticScore.toFixed(1)}`,
    `- Mutation: ${matrix.mutation.score}`,
    `- Launch readiness: ${matrix.launch.readiness.score}`,
    '',
    '## Promotion Checks',
    '',
    ...matrix.promotion.checks.map((check) => `- ${check.pass ? 'PASS' : 'HOLD'} ${check.label}: ${check.value ?? 'missing'}`),
    '',
    '## Candidate Rules',
    '',
    '```json',
    JSON.stringify(best?.rules || {}, null, 2),
    '```',
    '',
  ].join('\n');
}

const args = readArgs(process.argv.slice(2));
const budget = args.budget || 'smoke';
const seed = args.seed || 'balance-matrix';
const games = numberArg(args.games, budget === 'normal' ? 128 : 32);
const autopilot = runAutopilotSearch({
  budget,
  mode: args.mode || 'beam',
  objective: args.objective || 'default',
  seed,
  games: numberArg(args['search-games'], budget === 'normal' ? 128 : 24),
  iterations: numberArg(args.iterations, budget === 'normal' ? 24 : 6),
  validate: false,
  rerank: true,
  topN: 4,
});
const bestCandidate = autopilot.topCandidates[0];
const rules = bestCandidate?.rules || {};
const firstMatch = runBatch({ scenarioId: 'new-player-table', games, seed: `${seed}-first`, rules, maxRounds: 36 });
const comeback = runBatch({ scenarioId: 'comeback-test', games, seed: `${seed}-comeback`, rules, maxRounds: 36 });
const ghosts = runGhostBatch({ scenario: 'balanced-cast', budget: 'smoke', games: Math.max(8, Math.floor(games / 2)), seed: `${seed}-ghosts`, rules, maxRounds: 36 });
const replay = buildReplayFromSeed({ seed: `${seed}-replay`, scenarioId: 'comeback-test', rules, maxRounds: 36 });
const mutation = buildMutationLaunchProof({ seed: `${seed}-mutation`, preset: 'contract-minimal' });
const packageJson = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf8'));
const launch = generateLaunchPlan({
  targetGate: 'internal-playtest',
  seed: `${seed}-launch`,
  heavy: false,
  files: await readLaunchFiles(),
  packageJson,
  simulatorBatch: firstMatch,
  replayProof: replay,
  ghostReport: ghosts,
  mutationProof: mutation,
  releaseReadiness: await readJsonIfExists(resolve(process.cwd(), '..', 'ops', 'launch-readiness.json'), {}),
  decisions: await readDecisionRecords(),
  playtestReports: await readImportedPlaytestReports(),
});
const promotion = assessBalancePromotion(bestCandidate, {
  firstMatch: firstMatch.scorecard,
  comeback: comeback.scorecard,
  ghostScore: ghosts.score.score,
  replayScore: replay.dramaticScore,
  mutationRisk: mutation.contractImpact.level,
});
const matrix = {
  generatedAt: new Date().toISOString(),
  budget,
  seed,
  bestCandidate,
  firstMatch,
  comeback,
  ghosts,
  ghostScore: ghosts.score.score,
  replay,
  mutation,
  launch,
  promotion,
};

if (args.report) {
  const base = `balance-matrix-${Date.now()}`;
  await writeOutput(join(process.cwd(), 'reports', 'balance-autopilot', `${base}.json`), JSON.stringify(matrix, null, 2));
  await writeOutput(join(process.cwd(), 'reports', 'balance-autopilot', `${base}.md`), exportMatrixMarkdown(matrix));
}

if (args.json) console.log(JSON.stringify(matrix, null, 2));
else console.log(exportMatrixMarkdown(matrix));

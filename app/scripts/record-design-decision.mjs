import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { generateLaunchPlan, LAUNCH_REQUIRED_SOURCES } from '../src/lib/launchCopilot.js';
import { generateOracleReport } from '../src/lib/liveOpsOracle.js';
import {
  createDesignDecision,
  designDecisionFileSlug,
  exportDesignDecisionMarkdown,
  generateDesignTowerSnapshot,
} from '../src/lib/designControlTower.js';

const ROOT = resolve(process.cwd(), '..');

function readArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function listArg(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(';').map((item) => item.trim()).filter(Boolean);
}

function normalizeTitle(value) {
  return String(value || '')
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

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

async function readLaunchFiles(extraFiles = []) {
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
    ...extraFiles,
  ];
  const entries = await Promise.all([...new Set(paths)].sort().map(async (path) => {
    const full = join(ROOT, path);
    if (!existsSync(full)) return [path, ''];
    return [path, await readFile(full, 'utf8')];
  }));
  return Object.fromEntries(entries);
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

function matchHypothesis(snapshot, selector) {
  const text = normalizeTitle(selector);
  if (!text) return snapshot.topHypotheses[0];
  const rank = Number(text);
  if (Number.isInteger(rank) && rank >= 1) return snapshot.topHypotheses[rank - 1] || null;
  return snapshot.topHypotheses.find((item) => (
    normalizeTitle(item.id) === text ||
    normalizeTitle(item.title) === text ||
    normalizeTitle(item.title).includes(text)
  )) || null;
}

async function buildSnapshot(args) {
  const seed = args.seed || 'design-decision-cli';
  const packageJson = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf8'));
  const files = await readLaunchFiles(String(args.files || '').split(',').map((item) => item.trim()).filter(Boolean));
  const oracleReport = generateOracleReport({
    seed: `${seed}-oracle`,
    heavy: Boolean(args.heavy),
    horizon: 'design-control',
    files,
    packageJson,
  });
  const launchPlan = generateLaunchPlan({
    seed: `${seed}-launch`,
    targetGate: args.target || 'internal-playtest',
    heavy: false,
    files,
    packageJson,
  });
  return generateDesignTowerSnapshot({
    seed,
    heavy: Boolean(args.heavy),
    oracleReport,
    launchPlan,
    decisions: await readDecisionRecords(),
  });
}

const args = readArgs(process.argv.slice(2));
const snapshot = await buildSnapshot(args);
const hypothesis = matchHypothesis(snapshot, args.hypothesis || args.rank || '1');

if (!hypothesis) {
  throw new Error(`No Design Tower hypothesis matched: ${args.hypothesis || args.rank || '1'}`);
}

const decision = createDesignDecision(hypothesis, {
  status: args.status || 'accept',
  operator: args.operator || '',
  rationale: args.rationale || '',
  acceptedRisks: listArg(args.risks || args['accepted-risks']),
  rejectedAlternatives: listArg(args['rejected-alternatives']),
  followUpValidation: listArg(args['follow-up']),
  evidenceUsed: listArg(args.evidence),
});

const slug = designDecisionFileSlug(decision);
const jsonPath = join(process.cwd(), 'reports', 'design-control', 'decisions', `${slug}.json`);
const markdownPath = join(ROOT, 'docs', 'decisions', `${slug}.md`);
await writeOutput(jsonPath, JSON.stringify(decision, null, 2));
await writeOutput(markdownPath, exportDesignDecisionMarkdown(decision));

if (args.json) {
  console.log(JSON.stringify(decision, null, 2));
} else {
  console.log(`Recorded design decision: ${decision.title}`);
  console.log(`Status: ${decision.status}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`Markdown: ${markdownPath}`);
}

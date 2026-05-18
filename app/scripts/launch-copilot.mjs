import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  COMMAND_SAFETY,
  LAUNCH_REQUIRED_SOURCES,
  exportLaunchChecklistCsv,
  exportLaunchPacketJson,
  exportLaunchPacketMarkdown,
  exportLaunchRiskRegisterMarkdown,
  generateLaunchPlan,
} from '../src/lib/launchCopilot.js';

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

async function readFiles(extraFiles = []) {
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
  const unique = [...new Set(paths)].sort();
  const entries = await Promise.all(unique.map(async (path) => {
    const full = join(ROOT, path);
    if (!existsSync(full)) return [path, ''];
    return [path, await readFile(full, 'utf8')];
  }));
  return Object.fromEntries(entries);
}

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

function parseEnvFile(text = '') {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

async function readEnv(args) {
  const selected = {};
  for (const key of ['VITE_CONTRACT_ADDRESS', 'VITE_CHAIN_ID']) {
    if (process.env[key]) selected[key] = process.env[key];
  }
  if (args['env-file']) {
    const full = resolve(process.cwd(), args['env-file']);
    if (existsSync(full)) {
      Object.assign(selected, parseEnvFile(await readFile(full, 'utf8')));
    }
  }
  return selected;
}

async function readReleaseReadiness(args) {
  const file = args['release-readiness'] || '../ops/launch-readiness.json';
  const full = resolve(process.cwd(), file);
  if (!existsSync(full)) return {};
  return JSON.parse(await readFile(full, 'utf8'));
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

async function checkRoutes(serverUrl) {
  if (!serverUrl) return {};
  const base = String(serverUrl).replace(/\/$/, '');
  const results = {};
  await Promise.all(LAUNCH_REQUIRED_SOURCES.routes.map(async (route) => {
    const started = Date.now();
    try {
      const response = await fetch(`${base}${route}`);
      results[route] = {
        ok: response.ok,
        status: response.status,
        ms: Date.now() - started,
      };
    } catch (error) {
      results[route] = {
        ok: false,
        status: 0,
        ms: Date.now() - started,
        error: error.message,
      };
    }
  }));
  return results;
}

function runSafeCommands(commandPlan, args) {
  if (!args.execute) return {};
  const allowMedium = Boolean(args['allow-medium']);
  const results = {};
  for (const item of commandPlan) {
    if (item.safety !== COMMAND_SAFETY.LOCAL_SAFE && !(allowMedium && item.safety === COMMAND_SAFETY.LOCAL_MEDIUM)) {
      results[item.value] = { skipped: true, reason: `Safety class ${item.safety}` };
      continue;
    }
    const parts = item.value.split(/\s+/);
    if (parts[0] !== 'npm') {
      results[item.value] = { skipped: true, reason: 'Only npm commands are executable by Launch Copilot.' };
      continue;
    }
    const result = spawnSync(parts[0], parts.slice(1), {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: Number(args.timeout || 120000),
      windowsHide: true,
      shell: process.platform === 'win32',
    });
    results[item.value] = {
      status: result.status,
      ok: result.status === 0,
      signal: result.signal || null,
      stdoutTail: (result.stdout || '').slice(-600),
      stderrTail: (result.stderr || '').slice(-600),
    };
  }
  return results;
}

function printSummary(plan) {
  console.log('Plundrix Launch Copilot');
  console.log(`generatedAt: ${plan.generatedAt}`);
  console.log(`targetGate: ${plan.targetGate}`);
  console.log(`status: ${plan.readiness.status}`);
  console.log(`score: ${plan.readiness.score}/100`);
  console.log(`required: ${plan.readiness.requiredPassed}/${plan.readiness.requiredTotal}`);
  console.log(`blockers: ${plan.readiness.blockers.length}`);
  console.log('');
  if (plan.readiness.blockers.length) {
    console.log('Top blockers:');
    for (const blocker of plan.readiness.blockers.slice(0, 6)) {
      console.log(`- ${blocker.title}: ${blocker.remediation}`);
    }
  } else {
    console.log(plan.packet.executiveSummary);
  }
  console.log('');
  console.log('Next commands:');
  for (const command of plan.commandPlan.slice(0, 6)) {
    console.log(`- [${command.safety}] ${command.value}`);
  }
}

const args = readArgs(process.argv.slice(2));
const packageJson = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf8'));
const files = await readFiles(String(args.files || '').split(',').map((item) => item.trim()).filter(Boolean));
const env = await readEnv(args);
const releaseReadiness = await readReleaseReadiness(args);
const decisions = await readDecisionRecords();
const playtestReports = await readImportedPlaytestReports();
const routeResults = await checkRoutes(args['server-url']);

let plan = generateLaunchPlan({
  targetGate: args.target || args.gate || 'internal-playtest',
  seed: args.seed || 'launch-copilot-cli',
  heavy: Boolean(args.heavy),
  files,
  packageJson,
  env,
  releaseReadiness,
  decisions,
  playtestReports,
  routeResults,
  operator: args.operator || '',
});

const commandResults = runSafeCommands(plan.commandPlan, args);
if (Object.keys(commandResults).length) {
  plan = generateLaunchPlan({
    targetGate: plan.targetGate,
    seed: args.seed || 'launch-copilot-cli',
    heavy: Boolean(args.heavy),
    files,
    packageJson,
    env,
    routeResults,
    commandResults,
    operator: args.operator || '',
  });
}

if (args.out) {
  const format = args.format || (args.json ? 'json' : args.csv ? 'csv' : args.risks ? 'risks' : 'markdown');
  const content =
    format === 'json'
      ? exportLaunchPacketJson(plan)
      : format === 'csv'
        ? exportLaunchChecklistCsv(plan)
        : format === 'risks'
          ? exportLaunchRiskRegisterMarkdown(plan)
          : exportLaunchPacketMarkdown(plan);
  await writeOutput(join(process.cwd(), args.out), content);
}

if (args.report) {
  await writeOutput(
    join(process.cwd(), 'reports', 'launch', `launch-copilot-${Date.now()}.md`),
    exportLaunchPacketMarkdown(plan),
  );
}

if (args.json) {
  console.log(JSON.stringify(plan, null, 2));
} else if (args.packet) {
  console.log(exportLaunchPacketJson(plan));
} else if (args.csv) {
  console.log(exportLaunchChecklistCsv(plan));
} else if (args.risks) {
  console.log(exportLaunchRiskRegisterMarkdown(plan));
} else if (args.markdown) {
  console.log(exportLaunchPacketMarkdown(plan));
} else {
  printSummary(plan);
}

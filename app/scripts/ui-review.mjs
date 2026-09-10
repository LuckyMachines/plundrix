import { appendFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportRoot = resolve(appDir, 'reports', 'ui-review');
const latestDir = resolve(reportRoot, 'latest');
const manifestPath = resolve(appDir, 'ui-review', 'manifest.json');
const baselineDir = resolve(appDir, 'tests', 'e2e', '__screenshots__');
const approvalPath = resolve(appDir, 'ui-review', 'approvals.ndjson');

function argsFrom(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const equalsAt = token.indexOf('=');
    if (equalsAt > 2) {
      args[token.slice(2, equalsAt)] = token.slice(equalsAt + 1);
      continue;
    }
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

function run(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, {
    cwd: options.cwd || appDir,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8',
    stdio: options.stdio || 'inherit',
    windowsHide: true,
    shell: false,
    timeout: options.timeout || 900_000,
  });
}

function gitSha() {
  const result = run('git', ['rev-parse', '--short', 'HEAD'], { stdio: 'pipe' });
  return result.status === 0 ? result.stdout.trim() : 'unknown';
}

function compose(status, surface = null) {
  const script = resolve(appDir, 'scripts', 'compose-ui-review.py');
  const commandArgs = [
    script,
    '--manifest', manifestPath,
    '--baseline', baselineDir,
    '--actual', resolve(latestDir, 'actual'),
    '--results', resolve(latestDir, 'results'),
    '--output', latestDir,
    '--status', status,
  ];
  if (surface) commandArgs.push('--surface', surface);
  const candidates = process.platform === 'win32'
    ? [['py', ['-3', ...commandArgs]], ['python', commandArgs]]
    : [['python3', commandArgs], ['python', commandArgs]];
  for (const [command, candidateArgs] of candidates) {
    const result = run(command, candidateArgs);
    if (result.error?.code === 'ENOENT') continue;
    return result;
  }
  return { status: 1, error: new Error('Python with Pillow is required to compose the UI review report.') };
}

const args = argsFrom(process.argv.slice(2));
if (args.help) {
  console.log(`Plundrix UI review

PowerShell examples:
  npm run ui:review
  npm run ui:review -- --surface instant-active
  npm run ui:approve -- --reason "Intentional action hierarchy update"

ui:review compares all canonical desktop and mobile states with approved baselines.
ui:approve replaces baselines and requires a written reason.`);
  process.exit(0);
}

if (args.approve && (!args.reason || args.reason === true || !String(args.reason).trim())) {
  throw new Error('Baseline approval requires --reason "why the visual change is intentional".');
}

const resolvedLatest = resolve(latestDir);
if (!resolvedLatest.startsWith(`${resolve(reportRoot)}${sep}`) && resolvedLatest !== resolve(reportRoot)) {
  throw new Error(`Refusing to clear unexpected report path: ${resolvedLatest}`);
}
rmSync(resolvedLatest, { recursive: true, force: true });
mkdirSync(resolvedLatest, { recursive: true });

const startedAt = new Date().toISOString();
const playwrightCli = resolve(appDir, 'node_modules', '@playwright', 'test', 'cli.js');
if (!existsSync(playwrightCli)) throw new Error('Playwright is not installed. Run npm ci in app first.');
const playwrightArgs = [playwrightCli, 'test', '--config', 'playwright.ui.config.js'];
if (args.surface) playwrightArgs.push('--grep', `${String(args.surface)} /`);
if (args.approve) playwrightArgs.push('--update-snapshots=all');

const testResult = run(process.execPath, playwrightArgs, {
  env: { PLUNDRIX_UI_REVIEW: '1', PLUNDRIX_UI_REVIEW_STARTED_AT: startedAt },
});
const status = testResult.status === 0 ? 'pass' : 'fail';
const composition = compose(status, args.surface ? String(args.surface) : null);

const runRecord = {
  schemaVersion: 1,
  startedAt,
  completedAt: new Date().toISOString(),
  buildSha: gitSha(),
  mode: args.approve ? 'approve' : 'compare',
  reason: args.approve ? String(args.reason).trim() : null,
  surface: args.surface ? String(args.surface) : 'all',
  status,
  playwrightExitCode: testResult.status,
  compositionExitCode: composition.status,
};
writeFileSync(resolve(latestDir, 'run.json'), `${JSON.stringify(runRecord, null, 2)}\n`, 'utf8');

if (args.approve && testResult.status === 0 && composition.status === 0) {
  mkdirSync(dirname(approvalPath), { recursive: true });
  appendFileSync(approvalPath, `${JSON.stringify({
    approvedAt: runRecord.completedAt,
    buildSha: runRecord.buildSha,
    reason: runRecord.reason,
    surface: runRecord.surface,
  })}\n`, 'utf8');
  console.log(`Approved visual baselines: ${runRecord.reason}`);
}

console.log(`UI review report: ${resolve(latestDir, 'index.html')}`);
if (testResult.status !== 0 || composition.status !== 0) process.exitCode = 1;

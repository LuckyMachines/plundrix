import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

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

function parseEnv(text = '') {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || '').trim());
}

async function readJsonIfPresent(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

const args = readArgs(process.argv.slice(2));
const root = resolve(process.cwd(), '..');
const envFile = resolve(process.cwd(), args['env-file'] || '../.env.mainnet.example');
const env = existsSync(envFile) ? parseEnv(await readFile(envFile, 'utf8')) : {};
const merged = { ...env, ...process.env };
const readiness = await readJsonIfPresent(resolve(root, 'ops', 'launch-readiness.json'), { confirmations: {} });
const contract = merged.VITE_CONTRACT_ADDRESS || merged.VITE_PLUNDRIX_CONTRACT;
const checks = [
  ['foundry config exists', existsSync(resolve(root, 'foundry.toml')), 'foundry.toml'],
  ['mainnet runbook exists', existsSync(resolve(root, 'docs', 'mainnet-runbook.md')), 'docs/mainnet-runbook.md'],
  ['ABI exists', existsSync(resolve(root, 'abi', 'PlundrixGame.json')) || existsSync(join(process.cwd(), 'src', 'config', 'PlundrixGame.json')), 'PlundrixGame ABI'],
  ['contract address supplied', isAddress(contract), 'VITE_CONTRACT_ADDRESS'],
  ['chain id supplied', Number.isInteger(Number(merged.VITE_CHAIN_ID)) && Number(merged.VITE_CHAIN_ID) > 0, 'VITE_CHAIN_ID'],
  ['start paused configured', String(merged.PLUNDRIX_START_PAUSED) === 'true', 'PLUNDRIX_START_PAUSED=true'],
  ['fee disabled configured', String(merged.PLUNDRIX_FEE_DISABLED) === 'true', 'PLUNDRIX_FEE_DISABLED=true'],
  ['deploy env confirmed', readiness.confirmations?.deployEnvConfirmed === true, 'ops/launch-readiness.json confirmations.deployEnvConfirmed'],
];

if (args['include-pause']) {
  checks.push(
    ['pause rehearsal owner confirmed', readiness.confirmations?.rollbackOwnerConfirmed === true, 'rollback owner confirmation'],
    ['frontend mainnet config confirmed', readiness.confirmations?.frontendMainnetConfigConfirmed === true, 'frontend mainnet confirmation'],
  );
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: args['include-pause'] ? 'contract-and-pause-rehearsal' : 'contract-rehearsal',
  status: checks.every(([, pass]) => pass) ? 'ready' : 'blocked',
  checks: checks.map(([title, pass, evidence]) => ({ title, status: pass ? 'pass' : 'blocked', evidence })),
  nextCommand: args['include-pause']
    ? 'Fill release confirmations, then run pause and unpause against the intended environment through the mainnet runbook.'
    : 'Fill release confirmations, then run npm run launch:rehearse-contracts -- --include-pause.',
};

const markdown = [
  '# Plundrix Contract Launch Rehearsal',
  '',
  `Generated: ${report.generatedAt}`,
  `Mode: ${report.mode}`,
  `Status: ${report.status}`,
  '',
  '## Checks',
  ...report.checks.map((check) => `- ${check.status.toUpperCase()} ${check.title}: ${check.evidence}`),
  '',
  '## Next Command',
  report.nextCommand,
  '',
].join('\n');

if (args.report) {
  const base = `contract-rehearsal-${Date.now()}`;
  await writeOutput(join(process.cwd(), 'reports', 'launch', `${base}.json`), JSON.stringify(report, null, 2));
  await writeOutput(join(process.cwd(), 'reports', 'launch', `${base}.md`), markdown);
}

if (args.json) console.log(JSON.stringify(report, null, 2));
else console.log(markdown);

if (args.strict && report.status !== 'ready') process.exit(1);

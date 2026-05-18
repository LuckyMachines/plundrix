import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

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

const args = readArgs(process.argv.slice(2));
const envFile = args['env-file'] || '../.env.mainnet.example';
const full = resolve(process.cwd(), envFile);
const env = existsSync(full) ? parseEnv(await readFile(full, 'utf8')) : {};
const merged = { ...env, ...process.env };
const errors = [];
const warnings = [];
const contract = merged.VITE_CONTRACT_ADDRESS || merged.VITE_PLUNDRIX_CONTRACT;
const chainId = Number(merged.VITE_CHAIN_ID);

if (!isAddress(contract)) errors.push('VITE_CONTRACT_ADDRESS must be a valid EVM address.');
if (!Number.isInteger(chainId) || chainId <= 0) errors.push('VITE_CHAIN_ID must be a positive integer.');
if (!existsSync(join(process.cwd(), 'src', 'config', 'PlundrixGame.json'))) errors.push('PlundrixGame ABI is missing from app/src/config.');
if (!existsSync(join(process.cwd(), 'src', 'config', 'contract.js'))) errors.push('Frontend contract config module is missing.');
if (!String(await readFile(join(process.cwd(), 'src', 'config', 'contract.js'), 'utf8')).includes('VITE_CONTRACT_ADDRESS')) {
  errors.push('Frontend config must read VITE_CONTRACT_ADDRESS.');
}
if (!merged.VITE_MAINNET_RPC_URL && chainId === 8453) warnings.push('VITE_MAINNET_RPC_URL is blank; route checks can still pass, but mainnet readiness should remain blocked.');
if (merged.PLUNDRIX_FEE_DISABLED !== 'true') warnings.push('PLUNDRIX_FEE_DISABLED should be true for free-play beta launch.');

if (args.json) {
  console.log(JSON.stringify({ valid: errors.length === 0, errors, warnings, redacted: { hasContract: Boolean(contract), chainId } }, null, 2));
} else {
  console.log(`Launch config valid: ${errors.length === 0}`);
  for (const error of errors) console.log(`ERROR ${error}`);
  for (const warning of warnings) console.log(`WARN ${warning}`);
}

if (errors.length) process.exit(1);

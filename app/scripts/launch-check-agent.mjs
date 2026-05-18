import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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

const args = readArgs(process.argv.slice(2));
const envFile = args['env-file'] || '../.env.mainnet.example';
const full = resolve(process.cwd(), envFile);
const env = existsSync(full) ? parseEnv(await readFile(full, 'utf8')) : {};
const merged = { ...env, ...process.env };
const url = args.url || merged.PLUNDRIX_AGENT_SERVICE_URL;
const expectedChainId = String(merged.VITE_CHAIN_ID || '');
const expectedContract = String(merged.VITE_CONTRACT_ADDRESS || merged.VITE_PLUNDRIX_CONTRACT || '').toLowerCase();
const errors = [];
const warnings = [];
let health = null;

if (!url) {
  errors.push('PLUNDRIX_AGENT_SERVICE_URL is required for agent-service readiness.');
} else if (!/^https?:\/\//.test(url)) {
  errors.push('PLUNDRIX_AGENT_SERVICE_URL must start with http:// or https://.');
} else if (args.fetch) {
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/health`);
    health = { ok: response.ok, status: response.status };
    if (!response.ok) errors.push(`Agent health endpoint returned ${response.status}.`);
    const text = await response.text();
    if (expectedChainId && text && !text.includes(expectedChainId)) warnings.push('Agent health response did not include expected chain id.');
    if (expectedContract && text && !text.toLowerCase().includes(expectedContract)) warnings.push('Agent health response did not include expected contract address.');
  } catch (error) {
    errors.push(`Agent health fetch failed: ${error.message}`);
  }
}

if (args.json) {
  console.log(JSON.stringify({ valid: errors.length === 0, errors, warnings, health, checkedUrl: Boolean(url) }, null, 2));
} else {
  console.log(`Agent readiness valid: ${errors.length === 0}`);
  for (const error of errors) console.log(`ERROR ${error}`);
  for (const warning of warnings) console.log(`WARN ${warning}`);
  if (health) console.log(`Health status: ${health.status}`);
}

if (errors.length) process.exit(1);

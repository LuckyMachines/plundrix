import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(process.cwd());
const anvilRpcUrl = process.env.ANVIL_RPC_URL || 'http://127.0.0.1:18645';
const dryRun = process.argv.includes('--dry-run');

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: root, shell: true });
    let combined = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      combined += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      combined += text;
      process.stderr.write(text);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise(combined);
      } else {
        reject(
          new Error(`Command failed (${code}): ${command} ${args.join(' ')}`)
        );
      }
    });
  });
}

function extractAddressFromOutput(output) {
  const match = output.match(/PlundrixGame:\s*(0x[a-fA-F0-9]{40})/);
  return match?.[1] || null;
}

function extractAddressFromBroadcast() {
  const runLatest = resolve(
    root,
    'broadcast',
    'DeployPlundrix.s.sol',
    '31337',
    'run-latest.json'
  );
  if (!existsSync(runLatest)) return null;

  const json = JSON.parse(readFileSync(runLatest, 'utf8'));
  const txs = Array.isArray(json.transactions) ? json.transactions : [];
  const deployment =
    txs.find(
      (tx) =>
        tx?.transactionType === 'CREATE' &&
        tx?.contractName === 'ERC1967Proxy'
    ) ||
    txs.find(
      (tx) =>
        tx?.transactionType === 'CREATE' &&
        tx?.contractName === 'PlundrixGame'
    );

  const addr = deployment?.contractAddress;
  if (typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return addr;
  }
  return null;
}

function upsertEnv(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }
  if (content.length > 0 && !content.endsWith('\n')) {
    return `${content}\n${line}\n`;
  }
  return `${content}${line}\n`;
}

function writeAppEnvLocal(contractAddress) {
  const envLocalPath = resolve(root, 'app', '.env.local');
  let content = existsSync(envLocalPath) ? readFileSync(envLocalPath, 'utf8') : '';
  content = upsertEnv(content, 'VITE_CONTRACT_ADDRESS', contractAddress);
  content = upsertEnv(content, 'VITE_FOUNDRY_RPC_URL', anvilRpcUrl);
  writeFileSync(envLocalPath, content);
}

async function main() {
  if (dryRun) {
    console.log('[dry-run] Would run forge local deploy and update app/.env.local');
    return;
  }

  console.log('Deploying PlundrixGame to local anvil...');
  const output = await run('forge', [
    'script',
    'script/DeployPlundrix.s.sol',
    '--rpc-url',
    anvilRpcUrl,
    '--broadcast',
  ]);

  const contractAddress =
    extractAddressFromOutput(output) || extractAddressFromBroadcast();

  if (!contractAddress) {
    throw new Error('Could not determine deployed PlundrixGame address.');
  }

  console.log(`Detected deployed address: ${contractAddress}`);
  writeAppEnvLocal(contractAddress);
  console.log('Updated app/.env.local');

  await run('node', ['scripts/sync-abi.mjs']);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

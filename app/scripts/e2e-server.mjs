import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPublicClient, createWalletClient, http } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(appDir, '..');
const rpcUrl = 'http://127.0.0.1:19655';
const appUrl = 'http://127.0.0.1:5502';
const children = new Set();

const anvilMnemonic = 'test test test test test test test test test test test junk';

function launch(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd || root,
    env: { ...process.env, ...options.env },
    stdio: options.stdio || 'inherit',
    windowsHide: true,
  });
  children.add(child);
  child.once('exit', () => children.delete(child));
  return child;
}

async function waitForUrl(url, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The service is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function waitForRpc() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
      });
      if (response.ok) return;
    } catch {
      // Anvil is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  throw new Error('Timed out waiting for local Anvil RPC');
}

function runToCompletion(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = launch(command, args, options);
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function contractAddressFromEnv() {
  const content = readFileSync(resolve(appDir, '.env.local'), 'utf8');
  const match = content.match(/^VITE_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})$/m);
  if (!match) throw new Error('Local deployment did not write a contract address');
  return match[1];
}

async function seedGames(address) {
  const abi = JSON.parse(readFileSync(resolve(appDir, 'src/config/PlundrixGame.json'), 'utf8'));
  const publicClient = createPublicClient({ chain: foundry, transport: http(rpcUrl) });
  const wallets = [0, 1, 2].map((addressIndex) => createWalletClient({
    account: mnemonicToAccount(anvilMnemonic, { addressIndex }),
    chain: foundry,
    transport: http(rpcUrl),
  }));

  async function write(wallet, functionName, args = []) {
    const hash = await wallet.writeContract({ address, abi, functionName, args });
    await publicClient.waitForTransactionReceipt({ hash });
  }

  await write(wallets[0], 'createGame');
  await write(wallets[1], 'registerPlayer', [1n]);
  await write(wallets[2], 'registerPlayer', [1n]);

  await write(wallets[0], 'createGame');
  await write(wallets[1], 'registerPlayer', [2n]);
  await write(wallets[2], 'registerPlayer', [2n]);
  await write(wallets[0], 'startGame', [2n]);

  // Leave a one-player lobby for the browser wallet journey.
  await write(wallets[0], 'createGame');
  await write(wallets[1], 'registerPlayer', [3n]);
}

function shutdown(code = 0) {
  for (const child of children) child.kill();
  process.exit(code);
}

process.once('SIGINT', () => shutdown());
process.once('SIGTERM', () => shutdown());

try {
  launch('anvil', ['--silent', '--port', '19655']);
  await waitForRpc();
  await runToCompletion(process.execPath, ['scripts/deploy-local.mjs'], {
    cwd: root,
    env: { ANVIL_RPC_URL: rpcUrl },
  });
  await seedGames(contractAddressFromEnv());
  launch(process.execPath, [resolve(appDir, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5502'], { cwd: appDir });
  await waitForUrl(appUrl);
  console.log(`Plundrix E2E environment ready at ${appUrl}`);
} catch (error) {
  console.error(error);
  shutdown(1);
}

await new Promise(() => {});

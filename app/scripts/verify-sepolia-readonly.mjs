import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const proxyAddress = process.env.VITE_CONTRACT_ADDRESS || '0x1FF715D46470B4024D88A12838e08A60855f0AE2';
const workshopAddress = process.env.VITE_WORKSHOP_ADDRESS || '0x74CAbD34B2E29A914025CeB598DF4e3652C418F5';
const rpcUrl = process.env.VITE_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const port = Number(process.env.PLUNDRIX_SEPOLIA_PREVIEW_PORT || 5503);
const agentPort = Number(process.env.PLUNDRIX_SEPOLIA_AGENT_PORT || 5504);
const baseUrl = `http://127.0.0.1:${port}`;
const agentBaseUrl = `http://127.0.0.1:${agentPort}`;
const verificationStateRoot = resolve(tmpdir(), `plundrix-sepolia-readonly-${process.pid}`);

function run(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      stdio: 'inherit',
      windowsHide: true,
      ...options,
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${file} exited with code ${code}`));
    });
  });
}

async function waitForUrl(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required to run the production build');
await run(process.execPath, [npmCli, 'run', 'build'], { env: process.env });

const agentServer = spawn(process.execPath, ['agent-service/server.mjs'], {
  cwd: new URL('../..', import.meta.url),
  env: {
    ...process.env,
    AGENT_CONTRACT_ADDRESS: proxyAddress,
    AGENT_WORKSHOP_ADDRESS: workshopAddress,
    AGENT_RPC_URL: rpcUrl,
    AGENT_PORT: String(agentPort),
    AGENT_ALLOW_ORIGIN: baseUrl,
    AGENT_ENABLE_MANAGED_PLAY: 'true',
    AGENT_ENABLE_RAW_API: 'false',
    AGENT_MANAGED_CHAIN_ID: '11155111',
    AGENT_SPONSOR_PRIVATE_KEY: `0x${'11'.repeat(32)}`,
    AGENT_CUSTODY_SECRET: 'sepolia-readonly-custody-secret-do-not-use-in-production',
    AGENT_SESSION_SECRET: 'sepolia-readonly-session-secret-do-not-use-in-production',
    AGENT_SPONSOR_BUDGET_PATH: resolve(verificationStateRoot, 'budget.json'),
    AGENT_MANAGED_OPERATIONS_PATH: resolve(verificationStateRoot, 'operations.json'),
  },
  stdio: ['ignore', 'inherit', 'inherit'],
  windowsHide: true,
});

const server = spawn(process.execPath, ['scripts/serve-dist.mjs'], {
  env: { ...process.env, PORT: String(port), AGENT_PORT: String(agentPort) },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

let browser;
try {
  await waitForUrl(`${agentBaseUrl}/health`);
  await waitForUrl(baseUrl);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const issues = [];
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => issues.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => {
    issues.push(`request: ${request.url()} (${request.failure()?.errorText || 'unknown error'})`);
  });
  page.on('response', (response) => {
    if (response.status() >= 500) {
      issues.push(`response: ${response.status()} ${response.url()}`);
    }
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  // Anchor the smoke check to the durable live-operation surface instead of
  // campaign copy, which is expected to evolve as the player hub is refined.
  await page.locator('#live-operations').waitFor();
  await page.waitForFunction(
    () => document.querySelectorAll('.alive-game-card').length > 0
      || document.body.textContent?.includes('The first table is yours'),
    undefined,
    { timeout: 30_000 },
  );
  await page.screenshot({
    path: 'reports/visual-audit/a-plus/sepolia-readonly-desktop.png',
    fullPage: true,
  });

  if (issues.length > 0) throw new Error(issues.join('\n'));
  console.log(`Sepolia read-only product check passed for ${proxyAddress}.`);
} finally {
  await browser?.close();
  server.kill();
  agentServer.kill();
}

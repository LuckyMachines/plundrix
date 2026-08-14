import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const appDir = process.cwd();
const root = resolve(appDir, '..');
const report = JSON.parse(readFileSync(
  process.env.PLUNDRIX_SEPOLIA_REPORT || resolve(root, 'reports/sepolia-funded/latest.json'),
  'utf8',
));
const proxyAddress = report.contractAddress;
const gameId = report.gameId;
const winner = report.winner;
const rpcUrl = process.env.VITE_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const port = Number(process.env.PLUNDRIX_SEPOLIA_FUNDED_PORT || 5504);
const baseUrl = `http://127.0.0.1:${port}`;

function run(file, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(file, args, {
      stdio: 'inherit',
      windowsHide: true,
      ...options,
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${file} exited with code ${code}`));
    });
  });
}

async function waitForUrl(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required to run the production build');
await run(process.execPath, [npmCli, 'run', 'build'], {
  env: {
    ...process.env,
    VITE_CONTRACT_ADDRESS: proxyAddress,
    VITE_RPC_URL: rpcUrl,
    VITE_ENABLE_FOUNDRY: 'false',
  },
});

const server = spawn(process.execPath, ['scripts/serve-dist.mjs'], {
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

let browser;
let context;
try {
  await waitForUrl(baseUrl);
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const issues = [];
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => issues.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText || 'unknown error';
    if (reason !== 'net::ERR_ABORTED') issues.push(`request: ${request.url()} (${reason})`);
  });

  await page.addInitScript(({ account, liveRpcUrl }) => {
    const listeners = new Map();
    let requestId = 0;
    const provider = {
      isMetaMask: true,
      on(event, listener) {
        const handlers = listeners.get(event) || new Set();
        handlers.add(listener);
        listeners.set(event, handlers);
        return this;
      },
      removeListener(event, listener) {
        listeners.get(event)?.delete(listener);
        return this;
      },
      async request({ method, params = [] }) {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [account];
        if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') return null;
        const response = await fetch(liveRpcUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }),
        });
        const payload = await response.json();
        if (payload.error) throw new Error(payload.error.message);
        return payload.result;
      },
    };
    Object.defineProperty(window, 'ethereum', { value: provider, configurable: true });
  }, { account: winner, liveRpcUrl: rpcUrl });

  await page.goto(`${baseUrl}/game/${gameId}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Connect', exact: true }).first().click();
  await page.getByRole('heading', { name: 'Vault Breached' }).waitFor({ timeout: 30_000 });
  await page.getByText('You Win', { exact: true }).waitFor();
  await page.getByText(`Operation #${gameId}`, { exact: true }).waitFor();

  const desktopAxe = await new AxeBuilder({ page }).analyze();
  const desktopViolations = desktopAxe.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
  if (desktopViolations.length > 0) throw new Error(`Desktop accessibility violations: ${desktopViolations.map(({ id }) => id).join(', ')}`);
  await page.screenshot({
    path: 'reports/visual-audit/a-plus/sepolia-funded-game-over-desktop.png',
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('heading', { name: 'Vault Breached' }).waitFor();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (hasOverflow) throw new Error('Funded Sepolia final briefing overflows the mobile viewport');
  const mobileAxe = await new AxeBuilder({ page }).analyze();
  const mobileViolations = mobileAxe.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
  if (mobileViolations.length > 0) throw new Error(`Mobile accessibility violations: ${mobileViolations.map(({ id }) => id).join(', ')}`);
  await page.screenshot({
    path: 'reports/visual-audit/a-plus/sepolia-funded-game-over-mobile.png',
    fullPage: true,
  });

  if (issues.length > 0) throw new Error(issues.join('\n'));
  console.log(`Funded Sepolia UI proof passed: game=${gameId} winner=${winner}`);
} finally {
  await context?.close();
  await browser?.close();
  server.kill();
}

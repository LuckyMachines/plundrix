import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const proxyAddress = process.env.VITE_CONTRACT_ADDRESS || '0x1FF715D46470B4024D88A12838e08A60855f0AE2';
const rpcUrl = process.env.VITE_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const port = Number(process.env.PLUNDRIX_SEPOLIA_PREVIEW_PORT || 5503);
const baseUrl = `http://127.0.0.1:${port}`;

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

const buildEnv = {
  ...process.env,
  VITE_CONTRACT_ADDRESS: proxyAddress,
  VITE_RPC_URL: rpcUrl,
  VITE_ENABLE_FOUNDRY: 'false',
};

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required to run the production build');
await run(process.execPath, [npmCli, 'run', 'build'], { env: buildEnv });

const server = spawn(process.execPath, ['scripts/serve-dist.mjs'], {
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

let browser;
try {
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

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1, name: /crack the vault/i }).waitFor();
  await page.getByText('No operations found. Create one to begin.').waitFor({ timeout: 30_000 });
  await page.screenshot({
    path: 'reports/visual-audit/a-plus/sepolia-readonly-desktop.png',
    fullPage: true,
  });

  if (issues.length > 0) throw new Error(issues.join('\n'));
  console.log(`Sepolia read-only product check passed for ${proxyAddress}.`);
} finally {
  await browser?.close();
  server.kill();
}

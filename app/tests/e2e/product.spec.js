import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TEST_WALLET = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

async function installTestWallet(page) {
  await page.addInitScript(({ account, rpcUrl }) => {
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
        const response = await fetch(rpcUrl, {
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
  }, { account: TEST_WALLET, rpcUrl: 'http://127.0.0.1:19655' });
}

async function expectNoSeriousA11yIssues(page) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
  expect(violations, violations.map(({ id, nodes }) => `${id}: ${nodes.length} node(s)`).join('\n')).toEqual([]);
}

test('homepage explains the game and makes the turn demo interactive', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /crack the vault/i })).toBeVisible();
  await expect(page.getByText('No wallet needed')).toBeVisible();

  const search = page.getByRole('button', { name: /search build an edge/i });
  await search.click();
  await expect(search).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(/find a tension wrench/i)).toBeVisible();

  const sabotage = page.getByRole('button', { name: /sabotage break their plan/i });
  await sabotage.click();
  await expect(page.getByText(/rook is stunned/i)).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('mobile navigation exposes the important player journeys', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  const navigation = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(navigation.getByRole('link', { name: 'Play 01', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Replays 03', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Compare 05', exact: true })).toBeVisible();
});

test('practice mode completes a deterministic match without a wallet', async ({ page }) => {
  await page.goto('/simulator');
  await page.getByRole('button', { name: 'Run one game' }).click();
  const winnerMetric = page.getByText('Winner', { exact: true }).locator('..');
  await expect(winnerMetric.getByText(/^Player [1-4]$/)).toBeVisible();
});

for (const [path, heading] of [
  ['/simulator', 'Tuning Lab'],
  ['/replays', 'Plundrix Replay Director'],
  ['/compare', 'Find the right Plundrix comparison by player craving.'],
  ['/terms', /terms/i],
  ['/privacy', /privacy/i],
  ['/snapshot', /operation/i],
]) {
  test(`${path} renders its primary content`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
  });
}

test('configured local-chain lobby renders a real crew manifest', async ({ page }) => {
  await page.goto('/game/1');
  await expect(page.getByRole('heading', { name: 'Operation Briefing' })).toBeVisible();
  await expect(page.getByText('Crew Manifest (2 enrolled)')).toBeVisible();
  await expect(page.getByText('Connect a wallet to join or start this operation.')).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('configured active match renders the real game shell', async ({ page }) => {
  await page.goto('/game/2');
  await expect(page.getByRole('heading', { name: /operation/i }).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Vault stage' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Current action' })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('browser wallet can join, start, and commit a real local-chain turn', async ({ page }) => {
  await installTestWallet(page);
  await page.goto('/game/3');
  await page.getByRole('button', { name: 'Connect', exact: true }).first().click();
  await expect(page.getByRole('button', { name: /0x3c44/i }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Join Operation' }).click();
  await expect(page.getByText('Crew Manifest (2 enrolled)')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Start Operation' }).click();
  await expect(page.getByRole('region', { name: 'Current action' })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Execute' }).first().click();
  await expect(page.getByText('Action committed', { exact: true })).toBeVisible({ timeout: 15_000 });
});

test('capture configured visual evidence', async ({ page }) => {
  test.skip(!process.env.PLUNDRIX_CAPTURE_EVIDENCE, 'Run explicitly to refresh review evidence.');
  await page.goto('/game/1');
  await expect(page.getByRole('heading', { name: 'Operation Briefing' })).toBeVisible();
  await page.screenshot({ path: 'reports/visual-audit/a-plus/lobby-desktop.png', fullPage: true });

  await page.goto('/game/2');
  await expect(page.getByRole('region', { name: 'Current action' })).toBeVisible();
  await page.screenshot({ path: 'reports/visual-audit/a-plus/active-desktop.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/game/2');
  await expect(page.getByRole('region', { name: 'Current action' })).toBeVisible();
  await page.screenshot({ path: 'reports/visual-audit/a-plus/active-mobile.png', fullPage: true });
});

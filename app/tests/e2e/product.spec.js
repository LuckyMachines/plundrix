import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  toHex,
} from 'viem';
import { readFileSync } from 'node:fs';
import PlundrixGameABI from '../../src/config/PlundrixGame.json' with { type: 'json' };

const TEST_WALLET = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
const TEST_OPPONENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const runtimeIssues = new WeakMap();
let chainSnapshot;

test.beforeAll(async () => {
  chainSnapshot = await rpc('evm_snapshot');
});

test.beforeEach(async ({ page }) => {
  if (chainSnapshot) await rpc('evm_revert', [chainSnapshot]);
  chainSnapshot = await rpc('evm_snapshot');
  const issues = [];
  runtimeIssues.set(page, issues);
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => issues.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText || 'unknown error';
    if (reason !== 'net::ERR_ABORTED') issues.push(`request: ${request.url()} (${reason})`);
  });
});

test.afterEach(async ({ page }) => {
  try {
    expect(runtimeIssues.get(page) || [], 'Browser runtime should stay free of console and resource errors').toEqual([]);
  } finally {
    // A Playwright retry can start in a new worker before the next beforeEach.
    // Restore the seeded chain here so a failed wallet test cannot poison it.
    if (chainSnapshot) await rpc('evm_revert', [chainSnapshot]);
    chainSnapshot = await rpc('evm_snapshot');
  }
});

function configuredContractAddress() {
  const content = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
  const match = content.match(/^VITE_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})$/m);
  if (!match) throw new Error('Missing configured E2E contract address');
  return match[1];
}

async function rpc(method, params = []) {
  const response = await fetch('http://127.0.0.1:19655', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message);
  return payload.result;
}

async function guaranteeNextResolveVictory(gameId, playerIndex) {
  const finalistSlot = playerStructSlot(gameId, playerIndex);
  await setStorage(finalistSlot + 1n, 5n);
}

async function totalGames() {
  const result = await rpc('eth_call', [{
    to: configuredContractAddress(),
    data: encodeFunctionData({ abi: PlundrixGameABI, functionName: 'totalGames' }),
  }, 'latest']);
  return decodeFunctionResult({ abi: PlundrixGameABI, functionName: 'totalGames', data: result });
}

function playerStructSlot(gameId, playerIndex) {
  const gamePlayersSlot = keccak256(encodeAbiParameters(
    [{ type: 'uint256' }, { type: 'uint256' }],
    [gameId, 353n],
  ));
  return BigInt(keccak256(encodeAbiParameters(
    [{ type: 'uint256' }, { type: 'uint256' }],
    [playerIndex, BigInt(gamePlayersSlot)],
  )));
}

async function setStorage(slot, value) {
  await rpc('anvil_setStorageAt', [
    configuredContractAddress(),
    toHex(slot, { size: 32 }),
    toHex(value, { size: 32 }),
  ]);
}

async function sendContractTransaction(from, functionName, args) {
  const hash = await rpc('eth_sendTransaction', [{
    from,
    to: configuredContractAddress(),
    data: encodeFunctionData({ abi: PlundrixGameABI, functionName, args }),
    // Resolution gas varies with the entropy-selected outcome and Workshop
    // settlement. A fixed local-test ceiling avoids estimating one branch and
    // then mining a more expensive branch in the next block.
    gas: toHex(5_000_000n),
  }]);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const receipt = await rpc('eth_getTransactionReceipt', [hash]);
    if (receipt) {
      if (BigInt(receipt.status) !== 1n) {
        const trace = await rpc('debug_traceTransaction', [hash, { disableMemory: true, disableStorage: true }]).catch(() => null);
        throw new Error(`${functionName} transaction reverted: ${hash} (${trace?.returnValue || 'no revert data'}, gas ${BigInt(receipt.gasUsed || 0).toString()})`);
      }
      return receipt;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${functionName} transaction`);
}

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
        const requestParams = method === 'eth_sendTransaction' && params[0]
          ? [{ ...params[0], gas: '0x4c4b40' }, ...params.slice(1)]
          : params;
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params: requestParams }),
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

test('player hub separates instant play from live operations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Choose your breach.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Play instantly' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Join a live table' })).toBeVisible();
  await expect(page.getByRole('link', { name: /start instant match/i })).toHaveAttribute('href', '/play');
  await expect(page.getByRole('link', { name: /open live operations/i })).toHaveAttribute('href', '#live-operations');
  await expect(page.getByRole('heading', { name: 'Live operations', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /learn the rules/i })).toHaveAttribute('href', 'https://plundrix.com/#how-it-works');
  await expect(page.getByText('Straight answers.')).toHaveCount(0);
  await expectNoSeriousA11yIssues(page);
});

test('mobile navigation exposes the important player journeys', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menuTrigger = page.getByRole('button', { name: 'Open menu' });
  await menuTrigger.click();
  const navigation = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(navigation.getByRole('link', { name: 'Hub 01', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Play now 02', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Vault run 03', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Workshop 04', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Replays 05', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Career 06', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Hub 01', exact: true })).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await page.keyboard.press('Escape');
  await expect(navigation).toBeHidden();
  await expect(menuTrigger).toBeFocused();
});

test('settings persist, recover safely, and remain keyboard accessible', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Game settings' }).first();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Game settings' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close settings' })).toBeFocused();

  await dialog.getByRole('switch', { name: 'Readable text' }).click();
  await dialog.getByRole('switch', { name: 'High contrast' }).click();
  await expect(page.locator('html')).toHaveClass(/readable-ui/);
  await expect(page.locator('html')).toHaveClass(/high-contrast-ui/);
  await dialog.getByRole('button', { name: /Feedback/i }).click();
  await dialog.getByRole('switch', { name: 'Reduced motion' }).click();
  await dialog.getByRole('slider', { name: 'Cue volume' }).fill('35');
  await expect(page.locator('html')).toHaveClass(/reduced-motion-ui/);
  await expect(dialog.getByRole('slider', { name: 'Cue volume' })).toHaveValue('35');
  await expectNoSeriousA11yIssues(page);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/readable-ui/);
  await expect(page.locator('html')).toHaveClass(/high-contrast-ui/);
  await expect(page.locator('html')).toHaveClass(/reduced-motion-ui/);
  await expect(trigger).toBeVisible();

  await page.keyboard.press('Control+Period');
  await expect(page.getByRole('dialog', { name: 'Game settings' })).toBeVisible();
});

test('damaged preference storage falls back to safe defaults', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('plundrix-preferences-v2', '{damaged'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Game settings' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Game settings' });
  await expect(dialog.getByText(/damaged preference record was safely replaced/i)).toBeVisible();
  await dialog.getByRole('button', { name: /Feedback/i }).click();
  await expect(dialog.getByRole('switch', { name: 'Interface sound' })).toBeChecked();
  await expectNoSeriousA11yIssues(page);
});

test('client navigation keeps canonical and crawler metadata route-specific', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /plundrix-home\.jpg$/);
  await page.goto('/leaderboard');
  await expect(page).toHaveTitle(/Operator Ladder/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://game.plundrix.com/leaderboard');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index,follow/);

  await page.goto('/ops');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});

test('unknown routes show a useful noindex recovery page', async ({ page }) => {
  await page.goto('/this-vault-does-not-exist');
  await expect(page.getByRole('heading', { name: 'This vault is sealed.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Play instantly' })).toHaveAttribute('href', '/play');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});

test('field manual behaves like a keyboard modal and restores focus', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /field manual/i });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Plundrix field manual' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Plundrix field manual' })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('practice mode completes a deterministic match without a wallet', async ({ page }) => {
  await page.goto('/simulator');
  await page.getByRole('button', { name: 'Run one game' }).click();
  const winnerMetric = page.getByText('Winner', { exact: true }).locator('..');
  await expect(winnerMetric.getByText(/^Player [1-4]$/)).toBeVisible();
});

test('instant play starts against agents and resolves a guided turn', async ({ page }) => {
  await page.goto('/play');
  await expect(page.getByRole('heading', { name: 'Your table is ready.' })).toBeVisible();
  await page.getByRole('button', { name: /breach the vault/i }).click();
  await expect(page.getByRole('heading', { name: 'Round 1' })).toBeVisible();
  await expect(page.locator('.instant-action-option[data-action="pick"]')).toHaveAttribute('data-state', 'selected');
  await expect(page.locator('.instant-action-option[data-action="search"]')).toHaveAttribute('data-state', 'ready');
  await page.getByRole('button', { name: /^Search/i }).click();
  await expect(page.locator('.instant-action-option[data-action="pick"]')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.instant-action-option[data-action="search"]')).toHaveAttribute('data-state', 'selected');
  await expect(page.getByText(/chance to gain a tool/i).first()).toBeVisible();
  await page.getByRole('button', { name: /commit and reveal/i }).click();
  await expect(page.getByRole('heading', { name: 'Round 2' })).toBeVisible();
  await expect(page.getByText('Last resolution')).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('improvement events carry bounded experiment and acquisition context without player identifiers', async ({ page }) => {
  await page.addInitScript(() => {
    window.__plundrixEvents = [];
    window.addEventListener('plundrix:analytics', (event) => window.__plundrixEvents.push(event.detail));
  });
  await page.goto('/play?experiment=first-action-copy&variant=a&utm_source=press&utm_medium=referral&utm_campaign=launch-beta&utm_content=hero-link');
  await page.getByRole('button', { name: /breach the vault/i }).click();
  await page.getByRole('button', { name: /commit and reveal/i }).click();
  await expect.poll(() => page.evaluate(() => window.__plundrixEvents.find((event) => event.name === 'First Meaningful Action'))).toBeTruthy();
  const event = await page.evaluate(() => window.__plundrixEvents.find((item) => item.name === 'First Meaningful Action'));
  expect(event.props).toMatchObject({
    schema: '2',
    site: 'game',
    experiment: 'first-action-copy',
    variant: 'a',
    cohort: 'new',
    source: 'press',
    channel: 'referral',
    campaign: 'launch-beta',
    creative: 'hero-link',
    landing: 'play',
  });
  expect(['0-30s', '31-60s', '61-120s', '121s+']).toContain(event.props.latency);
  expect(event.props).not.toHaveProperty('address');
  expect(event.props).not.toHaveProperty('seed');
  expect(event.props).not.toHaveProperty('name');
});

test('vault run starts, exposes a meaningful route tradeoff, and resolves a gambit', async ({ page }) => {
  await page.goto('/vault-run');
  await page.evaluate(() => localStorage.removeItem('plundrix-vault-run-v1'));
  await page.reload();
  await expect(page.getByRole('heading', { name: /three vaults/i })).toBeVisible();
  await page.getByRole('button', { name: 'Begin vault run' }).click();
  await expect(page.getByRole('heading', { name: 'Every route leaves fingerprints.' })).toBeVisible();
  await page.getByRole('button', { name: /kick the hinge/i }).click();
  await expect(page.getByRole('heading', { name: 'Outer Ring' })).toBeVisible();
  await expect(page.getByText('Round 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /double or nothing/i }).click();
  await page.getByRole('button', { name: 'Commit Pick' }).click();
  await expect(page.getByText('Last round')).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('local career gathers progression and names the next objective', async ({ page }) => {
  await page.goto('/career');
  await expect(page.getByRole('heading', { name: 'Operator' })).toBeVisible();
  await expect(page.getByText('Next objectives')).toBeVisible();
  await expect(page.getByText('Complete your first operation')).toBeVisible();
  await expect(page.getByText('Local operator record / this device')).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('tactical art reinforces gadgets, actions, and rival identities', async ({ page }) => {
  await page.goto('/play?mode=tactical&seed=art-contract');
  await expect(page.locator('.gadget-visual')).toHaveCount(1);
  await expect(page.getByText('One build, one visible signature, one use per operation.')).toBeVisible();
  await page.getByRole('button', { name: /breach the vault/i }).click();
  await expect(page.getByRole('heading', { name: 'Round 1' })).toBeVisible();
  await expect(page.locator('img[src$="-device.webp"]')).toHaveCount(3);
  await expect(page.locator('img[src="/images/parts/pick-tool.webp"]')).toHaveCount(1);
  await expect(page.locator('img[src="/images/parts/search-kit.webp"]')).toHaveCount(1);
  await expect(page.locator('img[src="/images/parts/sabotage-cable.webp"]')).toHaveCount(1);
  await expectNoSeriousA11yIssues(page);
});

test('workshop exposes ten signature gadgets and a complete configuration loop', async ({ page }) => {
  await page.goto('/workshop');
  await expect(page.getByRole('heading', { name: 'Ten signature gadgets. Your build.' })).toBeVisible();
  await expect(page.getByText(/1,200 builds/i)).toBeVisible();
  await expect(page.locator('#families article')).toHaveCount(10);
  await page.getByRole('button', { name: 'Copper Weave', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Copper Weave Precision Kit/i })).toBeVisible();
  await page.getByRole('button', { name: 'Save favorite', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved favorite', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Assemble', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('assembled');
  await page.getByRole('button', { name: 'Equip', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('equipped for Tactical play');
  await page.getByRole('button', { name: 'Add to compare', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Compare what actually changes' })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  expect(await page.evaluate(() => document.body.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.body.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('connected workshop equips a starter through the deployed contract', async ({ page }) => {
  test.setTimeout(60_000);
  await installTestWallet(page);
  await page.goto('/workshop');
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).first().click();
  await expect(page.getByText('Onchain collection', { exact: true })).toBeVisible({ timeout: 15_000 });

  const equip = page.getByRole('button', { name: 'Equip', exact: true });
  await expect(equip).toBeEnabled({ timeout: 15_000 });
  await equip.click();
  await expect(page.getByRole('button', { name: 'Equipped', exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/equipped onchain/i)).toBeVisible();
});

test('instant play stays contained on mobile and restores an active operation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/play');
  await page.getByRole('button', { name: /breach the vault/i }).click();
  const commit = page.locator('.instant-mobile-command__commit');
  await expect(commit).toBeVisible();
  await expect(commit).toHaveAccessibleName('Commit Pick');
  expect(await page.evaluate(() => document.body.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Intel', exact: true }).click();
  await expect(page.locator('#instant-intel-rail')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#instant-intel-rail')).toBeHidden();
  await page.getByRole('button', { name: /^Search/i }).click();
  await expect(commit).toHaveAccessibleName('Commit Search');
  await commit.click();
  await expect(page.getByRole('heading', { name: 'Round 2' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Round 2' })).toBeVisible();
  await expect(page.getByText('Operation restored on this device.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expectNoSeriousA11yIssues(page);
});

test('gameplay trailer presents the complete vault race', async ({ page }) => {
  await page.goto('/trailer');
  await expect(page.getByRole('heading', { name: /one vault/i })).toBeVisible();
  await expect(page.locator('video source[src="/video/plundrix-gameplay-trailer.mp4"]')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /play instantly/i })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('replay gallery renders all three visual stories', async ({ page }) => {
  await page.goto('/replays');
  await expect(page.locator('img[src^="/images/replay-"]')).toHaveCount(3);
});

test('replay keyboard shortcuts are scoped to the replay viewer', async ({ page }) => {
  await page.goto('/replay/gallery-comeback');
  const play = page.getByRole('button', { name: 'Play replay' });
  await expect(play).toBeVisible({ timeout: 15_000 });
  await page.getByRole('combobox', { name: 'Replay speed' }).focus();
  await page.keyboard.press('Space');
  await expect(play).toBeVisible();
  const viewer = page.getByRole('region', { name: /Replay viewer/ });
  await viewer.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Pause replay' })).toBeVisible();
});

test('design system supports whole-game review and responsive critique', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/design-system');
  await expect(page.getByRole('heading', { level: 1, name: 'Plundrix Design System' })).toBeVisible();
  await expect(page.locator('[data-review-status]')).toHaveCount(16);
  await expect(page.locator('#caper')).toContainText('Work surface');
  await expect(page.locator('#caper')).toContainText('Committed');
  await expect(page.locator('#assets')).toContainText('Reusable parts');
  await expect(page.locator('#assets')).toContainText('Accepted master');
  await expect(page.locator('#assets')).toContainText('Needs revision');

  const colorSection = page.locator('#color');
  await colorSection.getByRole('button', { name: 'Needs work' }).click();
  await expect(colorSection).toHaveAttribute('data-review-status', 'needs-work');
  await page.reload();
  await expect(page.locator('#color')).toHaveAttribute('data-review-status', 'needs-work');
  await page.getByRole('button', { name: 'Needs work 1' }).click();
  await expect(page.locator('#color')).toBeVisible();
  await expect(page.locator('#principles')).toHaveCount(0);

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByRole('button', { name: 'mobile', exact: true }).click();
  await expect(page.locator('.ds-responsive-frame')).toHaveAttribute('data-viewport', 'mobile');
  await expectNoSeriousA11yIssues(page);

  await page.setViewportSize({ width: 390, height: 844 });
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow, 'Design system should not overflow a mobile viewport').toBe(false);
  await expectNoSeriousA11yIssues(page);
});

test('leaderboard degrades gracefully when its live feed is not configured', async ({ page }) => {
  await page.goto('/leaderboard');
  await expect(page.getByText('Live season standings are warming up')).toBeVisible();
  await expect(page.getByText('Agent service not configured')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Play instantly' })).toBeVisible();
});

test('sessions explain when their verified feed is unavailable', async ({ page }) => {
  await page.goto('/sessions');
  await expect(page.getByText('Live session feed is warming up')).toBeVisible();
  await expect(page.getByText('Agent service not configured')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Browse replays' })).toBeVisible();
});

for (const [path, heading] of [
  ['/simulator', 'Tuning Lab'],
  ['/replays', 'Stories from the vault'],
  ['/compare', 'Find the right Plundrix comparison by player craving.'],
  ['/terms', /terms/i],
  ['/privacy', /privacy/i],
  ['/snapshot', /operation/i],
  ['/play', 'Your table is ready.'],
  ['/vault-run', /three vaults/i],
  ['/career', 'Operator'],
  ['/trailer', /one vault/i],
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
  await expect(page.getByText('Connect on Sepolia, then claim a seat in operation #1.')).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('configured active match renders the real game shell', async ({ page }) => {
  await page.goto('/game/2');
  await expect(page.getByRole('heading', { name: /operation/i }).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Vault stage' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Current action' })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('mobile live play puts the decision in the first viewport without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/game/2');
  const actionRegion = page.getByRole('region', { name: 'Current action' });
  await expect(actionRegion).toBeVisible();
  const connectBox = await actionRegion.getByRole('button', { name: 'Connect to act', exact: true }).boundingBox();
  expect(connectBox?.y).toBeLessThan(844);
  await expect(actionRegion.getByRole('button', { name: 'Pick', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByText('WINNER', { exact: true })).toBeVisible();
});

test('internal product tools contain wide data on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const overflows = [];
  for (const path of ['/simulator', '/ops', '/ghosts', '/playtest', '/design-system']) {
    await page.goto(path);
    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    if (widths.scroll > widths.client) overflows.push({ path, ...widths });
  }
  expect(overflows).toEqual([]);
});

test('browser wallet can create a new operation from the homepage', async ({ page }) => {
  test.setTimeout(60_000);
  const createdGameId = Number(await totalGames()) + 1;
  await installTestWallet(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).first().click();
  await page.getByRole('button', { name: 'Create Operation' }).click();
  const dialog = page.getByText('New Operation').locator('..');
  await expect(dialog.getByText(/public beta is free to play/i)).toBeVisible();
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByText('Confirmed', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  const createdOperation = page.getByRole('button', { name: new RegExp(`OP-${String(createdGameId).padStart(3, '0')}`, 'i') });
  await expect(createdOperation).toBeVisible({ timeout: 15_000 });
  await expect(createdOperation).toContainText(/open/i);

  await sendContractTransaction(TEST_OPPONENT, 'registerPlayer', [BigInt(createdGameId)]);
  await createdOperation.click();
  await expect(page.getByRole('heading', { name: 'Operation Briefing' })).toBeVisible();
  await expect(page.getByText('Crew Manifest (1 enrolled)')).toBeVisible();
  await page.getByRole('button', { name: 'Join Operation' }).click();
  await expect(page.getByText('Crew Manifest (2 enrolled)')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Start Operation' }).click();
  await expect(page.getByRole('region', { name: 'Current action' })).toBeVisible({ timeout: 15_000 });

  await sendContractTransaction(TEST_OPPONENT, 'submitAction', [BigInt(createdGameId), 2, '0x0000000000000000000000000000000000000000']);

  await page.getByRole('button', { name: 'Pick', exact: true }).first().click();
  await expect(page.getByText(/Action committed\. Wait/)).toBeVisible({ timeout: 15_000 });
  const resolve = page.getByRole('button', { name: 'Resolve', exact: true });
  await expect(resolve).toBeEnabled({ timeout: 20_000 });
});

test('browser wallet can join, start, and commit a real local-chain turn', async ({ page }) => {
  test.setTimeout(60_000);
  await installTestWallet(page);
  await page.goto('/game/3');
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).first().click();
  await expect(page.getByRole('button', { name: /0x3c44/i }).first()).toBeVisible();

  const join = page.getByRole('button', { name: 'Join Operation' });
  const start = page.getByRole('button', { name: 'Start Operation' });
  const currentAction = page.getByRole('region', { name: 'Current action' });
  await expect(join.or(start).or(currentAction)).toBeVisible({ timeout: 15_000 });
  if (await join.isVisible().catch(() => false)) {
    await join.click();
    await expect(page.getByText('Crew Manifest (2 enrolled)')).toBeVisible({ timeout: 15_000 });
  }
  if (!(await currentAction.isVisible().catch(() => false))) {
    await expect(start).toBeVisible({ timeout: 15_000 });
    await start.click();
  }
  await expect(currentAction).toBeVisible({ timeout: 30_000 });

  const execute = page.getByRole('button', { name: 'Pick', exact: true }).first();
  await expect(execute).toBeEnabled({ timeout: 15_000 });
  await execute.click();
  await expect(page.getByText(/Action committed\. Wait/)).toBeVisible({ timeout: 15_000 });
});

test('browser wallet can complete and resolve a real local-chain round', async ({ page }) => {
  test.setTimeout(90_000);
  await installTestWallet(page);
  await page.goto('/game/4');
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).first().click();
  await expect(page.getByRole('region', { name: 'Current action' })).toBeVisible();

  await page.getByRole('button', { name: 'Pick', exact: true }).first().click();
  await expect(page.getByText(/Action committed\. Wait/)).toBeVisible({ timeout: 15_000 });
  const resolve = page.getByRole('button', { name: 'Resolve', exact: true });
  await expect(resolve).toBeEnabled({ timeout: 15_000 });
  const transactionCountBefore = BigInt(await rpc('eth_getTransactionCount', [TEST_WALLET, 'latest']));
  await resolve.click();
  await expect.poll(
    async () => BigInt(await rpc('eth_getTransactionCount', [TEST_WALLET, 'latest'])),
    { timeout: 30_000, message: 'The browser wallet should submit the resolve transaction' },
  ).toBeGreaterThan(transactionCountBefore);
  const resolution = page.getByRole('region', { name: 'Round resolution' });
  await expect(resolution).toBeVisible({ timeout: 30_000 });
  await expect(resolution.getByText(/LOCK CRACKED|NO JOY|TOOL FOUND|NOTHING/)).toHaveCount(2);
  const continueButton = resolution.getByRole('button', { name: 'Continue to next round' });
  await expect(continueButton).toBeVisible({ timeout: 5_000 });
  if (process.env.PLUNDRIX_CAPTURE_EVIDENCE) {
    await expect(page.getByText('Round resolution confirmed', { exact: true })).toBeHidden({ timeout: 6_000 });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await resolution.screenshot({ path: 'reports/visual-audit/a-plus/resolution-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await resolution.screenshot({ path: 'reports/visual-audit/a-plus/resolution-mobile.png' });
  }
  await continueButton.click();
  await expect(page.getByRole('region', { name: 'Vault stage' }).getByRole('heading', { name: '2', exact: true })).toBeVisible({ timeout: 15_000 });
});

test('browser wallet can breach the vault and reach the final briefing', async ({ page }) => {
  test.setTimeout(60_000);
  await installTestWallet(page);
  await page.goto('/game/5');
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).first().click();
  const finalBriefing = page.getByRole('heading', { name: 'Vault Breached' });
  const execute = page.getByRole('button', { name: 'Pick', exact: true }).first();
  await expect(finalBriefing.or(execute)).toBeVisible({ timeout: 15_000 });
  if (!await finalBriefing.isVisible().catch(() => false)) {
    const resolve = page.getByRole('button', { name: 'Resolve', exact: true });
    if (await execute.isEnabled()) await execute.click();
    await expect(resolve).toBeEnabled({ timeout: 20_000 });
    await guaranteeNextResolveVictory(5n, 2n);
    // Resolve from the other unlocked account so this fixture never races the
    // browser wallet's just-submitted action for the same sender nonce.
    await sendContractTransaction(TEST_OPPONENT, 'resolveRound', [5n]);
    await page.reload();
  }

  await expect(finalBriefing).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('You Win')).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  if (process.env.PLUNDRIX_CAPTURE_EVIDENCE) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: 'reports/art-expansion-v2/actual/game-over-desktop.png', fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(finalBriefing).toBeVisible();
  await expect(page.getByText('You Win')).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  if (process.env.PLUNDRIX_CAPTURE_EVIDENCE) {
    await page.screenshot({ path: 'reports/art-expansion-v2/actual/game-over-mobile.png', fullPage: true });
  }
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow, 'Final briefing should not overflow a mobile viewport').toBe(false);
});

test('capture instant-play art expansion evidence', async ({ page }) => {
  test.setTimeout(60_000);
  test.skip(!process.env.PLUNDRIX_CAPTURE_EVIDENCE, 'Run explicitly to refresh review evidence.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/play?mode=tactical&seed=art-expansion-v2');
  await expect(page.getByRole('heading', { name: 'Your table is ready.' })).toBeVisible();
  await page.screenshot({ path: 'reports/art-expansion-v2/actual/instant-setup-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'reports/art-expansion-v2/actual/instant-setup-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: /breach the vault/i }).click();
  await expect(page.getByRole('heading', { name: 'Round 1' })).toBeVisible();
  await page.screenshot({ path: 'reports/art-expansion-v2/actual/instant-active-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'reports/art-expansion-v2/actual/instant-active-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });

  const finalBriefing = page.getByText('Final briefing', { exact: true });
  for (let round = 0; round < 40 && !await finalBriefing.isVisible().catch(() => false); round += 1) {
    const autoPlay = page.getByRole('button', { name: 'Auto-play this round' });
    await autoPlay.click();
    await expect(autoPlay.or(finalBriefing)).toBeVisible({ timeout: 5_000 });
    await expect(autoPlay).toBeEnabled({ timeout: 5_000 }).catch(() => {});
  }
  await expect(finalBriefing).toBeVisible();
  await page.screenshot({ path: 'reports/art-expansion-v2/actual/instant-complete-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'reports/art-expansion-v2/actual/instant-complete-mobile.png', fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/design-system#assets');
  const assetLibrary = page.locator('#assets');
  await expect(assetLibrary).toContainText('Reusable parts');
  await assetLibrary.screenshot({ path: 'reports/art-expansion-v2/actual/design-system-assets-desktop.png' });
});

test('capture workshop visual evidence', async ({ page }) => {
  test.setTimeout(60_000);
  test.skip(!process.env.PLUNDRIX_CAPTURE_EVIDENCE, 'Run explicitly to refresh review evidence.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/workshop');
  await expect(page.getByRole('heading', { name: 'Ten signature gadgets. Your build.' })).toBeVisible();
  expect(await page.evaluate(() => document.body.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: 'reports/workshop-v2/actual/workshop-desktop-fold.png' });
  await page.screenshot({ path: 'reports/workshop-v2/actual/workshop-desktop.png', fullPage: true });
  await page.locator('#builder').screenshot({ path: 'reports/workshop-v2/actual/workshop-builder-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/workshop');
  await expect(page.getByRole('heading', { name: 'Ten signature gadgets. Your build.' })).toBeVisible();
  expect(await page.evaluate(() => document.body.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: 'reports/workshop-v2/actual/workshop-mobile-fold.png' });
  await page.screenshot({ path: 'reports/workshop-v2/actual/workshop-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/design-system#inventory');
  await page.locator('#inventory').screenshot({ path: 'reports/workshop-v2/actual/design-system-inventory.png' });
});

test('capture vault-run visual evidence', async ({ page }) => {
  test.setTimeout(60_000);
  test.skip(!process.env.PLUNDRIX_CAPTURE_EVIDENCE, 'Run explicitly to refresh review evidence.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/vault-run');
  await page.evaluate(() => localStorage.removeItem('plundrix-vault-run-v1'));
  await page.reload();
  await expect(page.getByRole('heading', { name: /three vaults/i })).toBeVisible();
  await page.screenshot({ path: 'reports/vault-run-v1/actual/setup-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Begin vault run' }).click();
  await page.screenshot({ path: 'reports/vault-run-v1/actual/route-desktop.png', fullPage: true });
  await page.getByRole('button', { name: /bribe the map/i }).click();
  await page.screenshot({ path: 'reports/vault-run-v1/actual/active-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Commit Pick' }).click();
  await expect(page.getByText(/signature protocol/i)).toBeVisible();
  await page.screenshot({ path: 'reports/vault-run-v1/actual/signature-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'reports/vault-run-v1/actual/active-mobile.png', fullPage: true });
});

test('capture configured visual evidence', async ({ page }) => {
  test.setTimeout(90_000);
  test.skip(!process.env.PLUNDRIX_CAPTURE_EVIDENCE, 'Run explicitly to refresh review evidence.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /choose your breach/i })).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: 'reports/visual-audit/final/home-desktop.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /choose your breach/i })).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: 'reports/visual-audit/final/home-mobile.png', fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
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

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/game/5');
  await expect(page.getByRole('heading', { name: 'Vault Breached' })).toBeVisible();
  await page.screenshot({ path: 'reports/visual-audit/a-plus/game-over-desktop.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/game/5');
  await expect(page.getByRole('heading', { name: 'Vault Breached' })).toBeVisible();
  await page.screenshot({ path: 'reports/visual-audit/a-plus/game-over-mobile.png', fullPage: true });
});

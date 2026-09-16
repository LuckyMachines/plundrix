import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
    // Restore the seeded chain here so a failed hosted-play test cannot poison it.
    if (chainSnapshot) await rpc('evm_revert', [chainSnapshot]);
    chainSnapshot = await rpc('evm_snapshot');
  }
});

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

async function expectNoSeriousA11yIssues(page) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
  expect(violations, violations.map(({ id, nodes }) => `${id}: ${nodes.length} node(s)`).join('\n')).toEqual([]);
}

test('player hub separates instant play from live operations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Choose your breach.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Learn the heist by playing it.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Risk a Vault Run' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Open a Live Table' })).toBeVisible();
  await expect(page.getByRole('link', { name: /start instant match/i })).toHaveAttribute('href', '/play');
  await expect(page.getByRole('link', { name: /open live desk/i })).toHaveAttribute('href', '#live-operations');
  await expect(page.getByRole('heading', { name: 'Reopen a table or assemble a crew' })).toBeVisible();
  await page.getByText('How a live table works', { exact: true }).click();
  await expect(page.getByRole('button', { name: /field manual/i })).toBeVisible();
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
  const musicAudio = page.locator('audio[data-audio-channel="music"]');
  await expect(dialog).toBeVisible();
  await expect(musicAudio).toHaveCount(1);
  await expect(musicAudio).toHaveAttribute('src', /caper-in-motion\.mp3/);
  await expect.poll(() => musicAudio.evaluate((element) => element.volume)).toBe(0.5);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('plundrix:music-duck', { detail: { duration: 800, depth: 0.4 } })));
  await expect.poll(() => musicAudio.evaluate((element) => element.volume)).toBe(0.2);
  await expect.poll(() => musicAudio.evaluate((element) => element.volume)).toBe(0.5);
  await expect(dialog.getByRole('button', { name: 'Close settings' })).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-preference-schema', '3');
  await page.evaluate(() => {
    window.__lastAudioPreferences = null;
    window.addEventListener('plundrix:audio-preferences', (event) => { window.__lastAudioPreferences = event.detail; });
  });

  await expect(dialog.getByRole('slider', { name: 'Sound volume' })).toHaveValue('50');
  await expect(dialog.getByRole('slider', { name: 'Music volume' })).toHaveValue('50');
  await expect(dialog.getByRole('button', { name: 'Mute sound effects' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Mute music' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Mute sound effects' }).click();
  await expect(dialog.getByRole('slider', { name: 'Sound volume' })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Unmute sound effects' }).click();
  await dialog.getByRole('button', { name: 'Mute music' }).click();
  await expect(dialog.getByRole('slider', { name: 'Music volume' })).toBeDisabled();
  await expect.poll(() => musicAudio.evaluate((element) => element.muted)).toBe(true);
  await dialog.getByRole('button', { name: 'Unmute music' }).click();
  await expect.poll(() => musicAudio.evaluate((element) => element.muted)).toBe(false);
  await dialog.getByRole('button', { name: /Display/i }).click();
  await dialog.getByRole('switch', { name: 'Readable text' }).click();
  await dialog.getByRole('switch', { name: 'High contrast' }).click();
  await expect(page.locator('html')).toHaveClass(/readable-ui/);
  await expect(page.locator('html')).toHaveClass(/high-contrast-ui/);
  await dialog.getByRole('button', { name: /Audio/i }).click();
  await dialog.getByRole('switch', { name: 'Reduced motion' }).click();
  await dialog.getByRole('slider', { name: 'Sound volume' }).fill('35');
  await dialog.getByRole('slider', { name: 'Music volume' }).fill('45');
  await expect(page.locator('html')).toHaveClass(/reduced-motion-ui/);
  await expect(dialog.getByRole('slider', { name: 'Sound volume' })).toHaveValue('35');
  await expect(dialog.getByRole('slider', { name: 'Music volume' })).toHaveValue('45');
  await expect.poll(() => musicAudio.evaluate((element) => element.volume)).toBe(0.45);
  await expect.poll(() => page.evaluate(() => window.__lastAudioPreferences)).toMatchObject({
    soundEnabled: true,
    soundVolume: 35,
    musicEnabled: true,
    musicVolume: 45,
  });
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
  const reopenedDialog = page.getByRole('dialog', { name: 'Game settings' });
  await expect(reopenedDialog).toBeVisible();
  await expect(reopenedDialog.getByRole('slider', { name: 'Sound volume' })).toHaveValue('35');
  await expect(reopenedDialog.getByRole('slider', { name: 'Music volume' })).toHaveValue('45');
});

test('damaged preference storage falls back to safe defaults', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('plundrix-preferences-v3', '{damaged'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Game settings' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Game settings' });
  await expect(dialog.getByText(/damaged preference record was safely replaced/i)).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Mute sound effects' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Mute music' })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('client navigation keeps canonical and crawler metadata route-specific', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /plundrix-home\.jpg$/);
  await page.goto('/leaderboard');
  await expect(page).toHaveTitle(/Operator Ladder/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://game.plundrix.com/leaderboard');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index,follow/);

  await page.goto('/vault-run');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /plundrix-play\.jpg$/);
  await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/jpeg');

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
  await page.getByText('How a live table works', { exact: true }).click();
  const trigger = page.getByRole('button', { name: /field manual/i });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Plundrix field manual' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Plundrix field manual' })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('practice mode completes a deterministic match without setup', async ({ page }) => {
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
  await expect(page.getByText('First move / choose -> read -> commit')).toBeVisible();
  await expect(page.locator('.instant-action-option[data-action="pick"]')).toHaveAttribute('data-state', 'selected');
  await expect(page.locator('.instant-action-option[data-action="search"]')).toHaveAttribute('data-state', 'ready');
  await page.getByRole('button', { name: /^Search/i }).click();
  await expect(page.locator('.instant-action-option[data-action="pick"]')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.instant-action-option[data-action="search"]')).toHaveAttribute('data-state', 'selected');
  await expect(page.getByText(/chance to gain a tool/i).first()).toBeVisible();
  await page.getByRole('button', { name: 'Commit Search', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Round 2' })).toBeVisible();
  await expect(page.getByText('Last resolution')).toBeVisible();
  await expect(page.getByText('Because of that:', { exact: false })).toBeVisible();
  await expect(page.getByText('First move / choose -> read -> commit')).toBeHidden();
  await expectNoSeriousA11yIssues(page);
});

test('improvement events carry bounded experiment and acquisition context without player identifiers', async ({ page }) => {
  await page.addInitScript(() => {
    window.__plundrixEvents = [];
    window.addEventListener('plundrix:analytics', (event) => window.__plundrixEvents.push(event.detail));
  });
  await page.goto('/play?experiment=first-action-copy&variant=a&utm_source=press&utm_medium=referral&utm_campaign=launch-beta&utm_content=hero-link');
  await page.getByRole('button', { name: /breach the vault/i }).click();
  await page.getByRole('button', { name: 'Commit Pick', exact: true }).click();
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
  const journey = await page.evaluate(() => window.__plundrixEvents.find((item) => item.name === 'Journey Step' && item.props.step === 'first-action'));
  expect(journey.props).toMatchObject({ mode: 'instant', step: 'first-action' });
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
  await expect(page.locator('[data-gameplay-interface="unified"]')).toHaveAttribute('data-gameplay-mode', 'vault-run');
  await expect(page.getByText('Vault run / R1 / concealed move', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /double or nothing/i }).click();
  await page.getByRole('button', { name: 'Commit Pick' }).click();
  await expect(page.getByText('Last round')).toBeVisible();
  await expect(page.getByText('Because of that:', { exact: false })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('local career gathers progression and names the next objective', async ({ page }) => {
  await page.goto('/career');
  await expect(page.getByRole('heading', { name: 'Operator' })).toBeVisible();
  await expect(page.getByText('Next objectives')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Complete your first operation' })).toBeVisible();
  await expect(page.getByText('Local operator record / this device')).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('tactical art reinforces gadgets, actions, and rival identities', async ({ page }) => {
  await page.goto('/play?mode=tactical&seed=art-contract');
  await expect(page.locator('.gadget-visual')).toHaveCount(1);
  await expect(page.getByText('One build, one visible signature, one use per operation.')).toBeVisible();
  await page.getByRole('button', { name: /breach the vault/i }).click();
  await expect(page.getByRole('heading', { name: 'Round 1' })).toBeVisible();
  await expect(page.locator('[data-gameplay-interface="unified"]')).toHaveAttribute('data-gameplay-mode', 'tactical');
  await expect(page.locator('img[src$="-device.webp"]')).toHaveCount(3);
  expect(await page.locator('img[src="/images/parts/pick-tool.webp"]').count()).toBeGreaterThan(0);
  expect(await page.locator('img[src="/images/parts/search-kit.webp"]').count()).toBeGreaterThan(0);
  expect(await page.locator('img[src="/images/parts/sabotage-cable.webp"]').count()).toBeGreaterThan(0);
  await expectNoSeriousA11yIssues(page);
});

test('workshop exposes ten signature gadgets and a complete comparison loop', async ({ page }) => {
  await page.goto('/workshop');
  await expect(page.getByRole('heading', { name: 'Ten signature gadgets. Your build.' })).toBeVisible();
  await expect(page.getByText(/1,200 builds/i)).toBeVisible();
  await expect(page.locator('#families article')).toHaveCount(10);
  await page.getByRole('button', { name: 'Copper Weave', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Copper Weave Precision Kit/i })).toBeVisible();
  await page.getByRole('button', { name: 'Save favorite', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved favorite', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add to compare', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Compare what actually changes' })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  expect(await page.evaluate(() => document.body.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.body.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('hosted workshop opens a persistent collection without setup prompts', async ({ page }) => {
  await page.goto('/workshop');
  await expect(page.getByText('Synced collection', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('body')).not.toContainText(/wallet|sepolia|blockchain|on-?chain|transaction hash|gas fee/i);
  await expectNoSeriousA11yIssues(page);
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

test('instant play keeps the whole decision console in a laptop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/play?mode=tactical&seed=laptop-viewport-contract');
  await page.getByRole('button', { name: /breach the vault/i }).click();

  const controls = [
    page.locator('.instant-action-option[data-action="pick"]'),
    page.locator('.instant-action-option[data-action="search"]'),
    page.locator('.instant-action-option[data-action="sabotage"]'),
    page.getByRole('button', { name: 'Commit Pick', exact: true }),
  ];

  for (const control of controls) {
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box?.y).toBeGreaterThanOrEqual(0);
    expect((box?.y || 0) + (box?.height || 0)).toBeLessThanOrEqual(768);
  }

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    viewportHeight: window.innerHeight,
    decisionBottom: document.querySelector('#instant-actions')?.getBoundingClientRect().bottom,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.decisionBottom).toBeLessThanOrEqual(layout.viewportHeight);

  await page.getByRole('button', { name: 'Commit Pick', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Round 2', exact: true })).toBeVisible();
  await expect(page.getByText(/Last resolution/).first()).toBeVisible();
  const nextDecisionBottom = await page.locator('#instant-actions').evaluate((element) => element.getBoundingClientRect().bottom);
  expect(nextDecisionBottom).toBeLessThanOrEqual(768);
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
  await page.getByText('Replay tools', { exact: true }).click();
  const shareCard = page.getByRole('button', { name: 'Share replay card' });
  await expect(shareCard).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await shareCard.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^replay-[a-z0-9-]+\.png$/);
  await expect(page.getByRole('status')).toContainText('Replay card downloaded.');
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
  await expect(page.getByRole('heading', { level: 1, name: 'Plundrix Design System' })).toBeVisible({ timeout: 15_000 });
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

test('leaderboard renders sanitized hosted standings', async ({ page }) => {
  await page.goto('/leaderboard');
  await expect(page.getByRole('heading', { name: /Season \d+ \/ All Profiles/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Operator / }).first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/0x[a-f0-9]{40}|wallet|sepolia|blockchain|on-?chain/i);
});

test('sessions render a sanitized hosted match feed', async ({ page }) => {
  await page.goto('/sessions');
  await expect(page.getByRole('link', { name: 'Session #1' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Operator / }).first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/0x[a-f0-9]{40}|wallet|sepolia|blockchain|on-?chain/i);
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

test('hosted lobby renders a sanitized crew and lets the player join', async ({ page }) => {
  await page.goto('/game/1');
  await expect(page.getByRole('heading', { name: 'Operation 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assemble the crew' })).toBeVisible();
  await expect(page.getByText(/reopen this link in the same browser/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy invite' })).toBeVisible();
  await page.getByRole('button', { name: 'Join operation' }).click();
  await expect(page.getByText(/^You \/ /).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('body')).not.toContainText(/0x[a-f0-9]{40}|wallet|sepolia|blockchain|on-?chain|transaction hash|gas fee/i);
  await expectNoSeriousA11yIssues(page);
});

test('hosted active match renders as a spectator without infrastructure details', async ({ page }) => {
  await page.goto('/game/2');
  await expect(page.getByRole('heading', { name: 'Operation 2' })).toBeVisible();
  await expect(page.getByText('This operation is already active. You can watch the table resolve.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/0x[a-f0-9]{40}|wallet|sepolia|blockchain|on-?chain|transaction hash|gas fee/i);
  await expectNoSeriousA11yIssues(page);
});

test('mobile hosted play stays within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/game/1');
  await expect(page.getByRole('heading', { name: 'Assemble the crew' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join operation' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
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

test('hosted service issues only an opaque HttpOnly session', async ({ page }) => {
  await page.goto('/');
  const response = await page.request.post('/api/player/session');
  const payload = await response.json();
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name === 'plundrix_session');
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe('Lax');
  expect(payload).toEqual({ player: { displayName: expect.stringMatching(/^Operator [A-F0-9]{5}$/) } });
  expect(JSON.stringify(payload)).not.toMatch(/0x[a-f0-9]{40}|sepolia|blockchain|transaction/i);
});

test('two anonymous players can create, join, start, and commit a hosted operation', async ({ page, browser }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Create operation' }).click();
  await expect(page).toHaveURL(/\/game\/\d+$/, { timeout: 30_000 });
  await expect(page.getByText(/^You \/ /).first()).toBeVisible();
  const operationUrl = page.url();
  const operationId = operationUrl.match(/\/game\/(\d+)$/)?.[1];

  const secondContext = await browser.newContext({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const secondPlayer = await secondContext.newPage();
  try {
    await secondPlayer.goto(operationUrl);
    await secondPlayer.getByRole('button', { name: 'Join operation' }).click();
    await expect(secondPlayer.getByText(/^You \/ /).first()).toBeVisible({ timeout: 30_000 });

    await expect(page.getByRole('button', { name: 'Start operation' })).toBeVisible({ timeout: 15_000 });
    await page.route(`**/api/play/operations/${operationId}/start`, async (route) => {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 900));
      await route.continue();
    }, { times: 1 });
    await page.getByRole('button', { name: 'Start operation' }).click();
    await expect(page.getByText('Starting live operation', { exact: true })).toBeVisible();
    await expect(page.getByText('Preparing the operation', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Make the next move.' })).toBeVisible({ timeout: 30_000 });
    await expect(secondPlayer.getByRole('heading', { name: 'Make the next move.' })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-gameplay-interface="unified"]')).toHaveAttribute('data-gameplay-mode', 'live-table');
    await expect(page.getByText('Live table / R1 / concealed move', { exact: true })).toBeVisible();

    await page.locator('#live-table-actions .instant-action-option[data-action="search"]').click();
    await page.getByRole('button', { name: 'Commit Search' }).click();
    await expect(page.getByText(/action locked/i).first()).toBeVisible({ timeout: 30_000 });
    await secondPlayer.locator('#live-table-actions .instant-action-option[data-action="search"]').click();
    await secondPlayer.getByRole('button', { name: 'Commit Search' }).click();
    await expect(secondPlayer.getByText(/action locked|round/i).first()).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => {
      const response = await page.request.get(`/api/play/operations/${operationId}`);
      return (await response.json()).operation.currentRound;
    }, { timeout: 30_000 }).toBeGreaterThan(1);
    await expect(page.getByText('Because of that:', { exact: false })).toBeVisible({ timeout: 15_000 });

    await expect(page.locator('body')).not.toContainText(/0x[a-f0-9]{40}|wallet|sepolia|blockchain|on-?chain|transaction hash|gas fee/i);
    await expect(secondPlayer.locator('body')).not.toContainText(/0x[a-f0-9]{40}|wallet|sepolia|blockchain|on-?chain|transaction hash|gas fee/i);
  } finally {
    await secondContext.close();
  }
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

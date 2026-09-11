import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import manifest from '../../ui-review/manifest.json' with { type: 'json' };
import typeLayoutManifest from '../../ui-review/type-layout.json' with { type: 'json' };

const reportRoot = resolve(process.cwd(), 'reports', 'ui-review', 'latest');
const actualRoot = resolve(reportRoot, 'actual');
const resultRoot = resolve(reportRoot, 'results');

mkdirSync(actualRoot, { recursive: true });
mkdirSync(resultRoot, { recursive: true });

function locatorFor(page, definition) {
  if (definition.type === 'css') return page.locator(definition.selector).first();
  if (definition.type === 'text') return page.getByText(definition.name, { exact: true }).first();
  return page.getByRole(definition.role, { name: definition.name, exact: true }).first();
}

async function documentFontsReady(page) {
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
  });
}

async function beginInstantMatch(page) {
  await page.getByRole('button', { name: /breach the vault/i }).click();
  await expect(page.getByRole('heading', { name: 'Round 1', exact: true })).toBeVisible();
}

function instantCommitControl(page) {
  return page.locator('.instant-mobile-command__commit:visible, .instant-action-commit button:first-child:visible').first();
}

async function fixedLiveFixtureTime() {
  const response = await fetch('http://127.0.0.1:19655', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBlockByNumber', params: ['latest', false] }),
  });
  const payload = await response.json();
  if (!payload.result?.timestamp) throw new Error('Could not read the local-chain fixture timestamp');
  return Number(BigInt(payload.result.timestamp)) * 1000 + 60_000;
}

async function prepareSurface(page, surface) {
  if (surface.fixture === 'live-active') {
    const now = await fixedLiveFixtureTime();
    await page.addInitScript((fixedNow) => {
      Object.defineProperty(Date, 'now', { configurable: true, value: () => fixedNow });
    }, now);
  }
  await page.goto(surface.path, { waitUntil: 'domcontentloaded' });

  if (surface.fixture === 'settings-open') {
    await page.getByRole('button', { name: 'Game settings' }).first().click();
  } else if (surface.fixture === 'mobile-menu-open') {
    await page.getByRole('button', { name: 'Open menu' }).click();
  } else if (surface.fixture === 'instant-active') {
    await beginInstantMatch(page);
  } else if (surface.fixture === 'instant-resolution') {
    await beginInstantMatch(page);
    await page.getByRole('button', { name: /^Search/i }).click();
    await instantCommitControl(page).click();
    await expect(page.getByText('Last resolution', { exact: true })).toBeVisible();
  } else if (surface.fixture === 'instant-final') {
    await beginInstantMatch(page);
    const finalBriefing = page.getByText('Final briefing', { exact: true });
    for (let round = 0; round < 60 && !(await finalBriefing.isVisible().catch(() => false)); round += 1) {
      const commit = instantCommitControl(page);
      await expect(commit.or(finalBriefing)).toBeVisible({ timeout: 5_000 });
      if (await finalBriefing.isVisible().catch(() => false)) break;
      const currentRound = await page.getByRole('heading', { name: /^Round \d+$/ }).textContent();
      let advanced = false;
      for (let attempt = 0; attempt < 2 && !advanced; attempt += 1) {
        if (await finalBriefing.isVisible().catch(() => false)) {
          advanced = true;
          break;
        }
        await expect(commit).toBeEnabled();
        await commit.click();
        try {
          await expect.poll(async () => {
            if (await finalBriefing.isVisible().catch(() => false)) return 'complete';
            return page.getByRole('heading', { name: /^Round \d+$/ }).textContent();
          }, { timeout: 5_000 }).not.toBe(currentRound);
          advanced = true;
        } catch (error) {
          if (attempt === 1) throw error;
        }
      }
    }
    await expect(finalBriefing).toBeVisible();
  } else if (surface.fixture === 'vault-route' || surface.fixture === 'vault-active') {
    await page.evaluate(() => localStorage.removeItem('plundrix-vault-run-v1'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Begin vault run', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Every route leaves fingerprints.', exact: true })).toBeVisible();
    if (surface.fixture === 'vault-active') {
      await page.getByRole('button', { name: /kick the hinge/i }).click();
      await expect(page.getByRole('heading', { name: 'Outer Ring', exact: true })).toBeVisible();
    }
  }

  await expect(locatorFor(page, surface.ready)).toBeVisible({ timeout: 30_000 });
  if (surface.settle) await expect(locatorFor(page, surface.settle)).toBeVisible({ timeout: 10_000 });
  await page.addStyleTag({ content: `
    html, body {
      overflow-anchor: none !important;
    }
    *, *::before, *::after {
      animation-delay: 0s !important;
      animation-duration: 0s !important;
      caret-color: transparent !important;
      scroll-behavior: auto !important;
      transition-delay: 0s !important;
      transition-duration: 0s !important;
    }
  ` });
  await documentFontsReady(page);
  await page.waitForTimeout(150);
  if (surface.focus) {
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.dataset.uiReviewScrollSpacer = 'true';
      spacer.style.height = '100vh';
      spacer.setAttribute('aria-hidden', 'true');
      document.body.append(spacer);
    });
    await locatorFor(page, surface.focus).evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  } else {
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(50);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
  await page.waitForTimeout(100);
}

async function inspectPage(page) {
  const axe = await new AxeBuilder({ page }).analyze();
  const accessibility = axe.violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length }));
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowPixels: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    unloadedImages: [...document.images]
      .filter((image) => {
        const bounds = image.getBoundingClientRect();
        const visible = bounds.bottom > 0
          && bounds.right > 0
          && bounds.top < window.innerHeight
          && bounds.left < window.innerWidth
          && getComputedStyle(image).visibility !== 'hidden';
        return visible && (!image.complete || image.naturalWidth === 0);
      })
      .map((image) => image.currentSrc || image.src || image.alt || 'unknown'),
    clippedContainers: ['.game-action-dock', '.alive-action-card', '.game-opponent-chip']
      .flatMap((selector) => [...document.querySelectorAll(selector)].map((element, index) => ({
        selector,
        index,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      })))
      .filter((item) => item.clientWidth > 0 && item.scrollWidth > item.clientWidth + 1),
  }));
  const typography = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && bounds.width > 0 && bounds.height > 0;
    };
    const elements = [...document.querySelectorAll('[data-type-contract]')].filter(visible);
    const undersized = elements
      .map((element) => ({ text: element.textContent?.trim().slice(0, 80), pixels: Number.parseFloat(getComputedStyle(element).fontSize) }))
      .filter(({ pixels }) => pixels < 12);
    const overflowing = elements
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => element.textContent?.trim().slice(0, 80));
    const overlongMeasures = [...document.querySelectorAll('[data-measure]')]
      .filter(visible)
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
        return { text: element.textContent?.trim().slice(0, 80), ems: bounds.width / fontSize };
      })
      .filter(({ ems }) => ems > 42.1);
    return {
      fonts: ['Barlow', 'Barlow Condensed', 'JetBrains Mono'].map((family) => ({
        family,
        loaded: document.fonts?.check(`16px "${family}"`) ?? false,
      })),
      undersized,
      overflowing,
      overlongMeasures,
    };
  });
  return { accessibility, layout, typography };
}

test.describe('canonical UI review matrix', () => {
  for (const surface of manifest.surfaces) {
    for (const viewportName of surface.viewports || manifest.defaults.viewports) {
      const viewport = manifest.viewports[viewportName];
      test(`${surface.id} / ${viewportName}`, async ({ page }) => {
        test.setTimeout(surface.fixture === 'instant-final' ? 90_000 : 45_000);
        await page.setViewportSize(viewport);
        await prepareSurface(page, surface);

        const mask = [...manifest.defaults.maskSelectors, ...(surface.maskSelectors || [])]
          .map((selector) => page.locator(selector));
        const screenshotName = `${surface.id}-${viewportName}.png`;
        const actualPath = resolve(actualRoot, screenshotName);
        const screenshotOptions = {
          animations: 'disabled',
          caret: 'hide',
          fullPage: false,
          mask,
          maskColor: '#14141f',
          scale: 'css',
        };

        await page.screenshot({ path: actualPath, ...screenshotOptions });
        const inspection = await inspectPage(page);
        writeFileSync(resolve(resultRoot, `${surface.id}-${viewportName}.json`), `${JSON.stringify({
          surfaceId: surface.id,
          label: surface.label,
          priority: surface.priority,
          viewport: viewportName,
          dimensions: viewport,
          path: surface.path,
          reviewFocus: surface.reviewFocus,
          experimentIds: surface.experimentIds || [],
          ...inspection,
        }, null, 2)}\n`, 'utf8');

        await expect(page).toHaveScreenshot(screenshotName, {
          ...screenshotOptions,
          maxDiffPixelRatio: surface.maxDiffPixelRatio ?? manifest.defaults.maxDiffPixelRatio,
          threshold: surface.pixelThreshold ?? manifest.defaults.pixelThreshold,
        });
        expect(inspection.layout.overflowPixels, 'Page should not overflow horizontally').toBe(0);
        expect(inspection.layout.clippedContainers, 'Action controls should not clip their contents').toEqual([]);
        expect(inspection.layout.unloadedImages, 'Every visible image should load').toEqual([]);
        expect(inspection.accessibility, 'No serious or critical Axe violations').toEqual([]);
        expect(inspection.typography.fonts.filter(({ loaded }) => !loaded), 'Bundled interface fonts should load').toEqual([]);
        expect(inspection.typography.undersized, 'Contract text should remain at least 12px').toEqual([]);
        expect(inspection.typography.overflowing, 'Contract text should not clip').toEqual([]);
        expect(inspection.typography.overlongMeasures, 'Prose measure should remain readable').toEqual([]);
      });
    }
  }
});

test.describe('layout and typography stress matrix', () => {
  for (const [name, viewport] of Object.entries(typeLayoutManifest.viewports)) {
    test(`type-layout-stress / ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(typeLayoutManifest.path, { waitUntil: 'domcontentloaded' });
      if (viewport.readable) await page.evaluate(() => document.documentElement.classList.add('readable-ui'));
      await documentFontsReady(page);

      const specimen = page.locator('[data-layout-stress]');
      await expect(specimen).toBeVisible({ timeout: 30_000 });
      const screenshotName = `type-layout-stress-${name}.png`;
      await specimen.screenshot({ path: resolve(actualRoot, screenshotName), animations: 'disabled', caret: 'hide', scale: 'css' });
      await expect(specimen).toHaveScreenshot(screenshotName, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: manifest.defaults.maxDiffPixelRatio,
        threshold: manifest.defaults.pixelThreshold,
      });

      const inspection = await inspectPage(page);
      expect(inspection.layout.overflowPixels, 'Stress page should not overflow horizontally').toBe(0);
      expect(inspection.accessibility, 'Stress page should have no serious or critical Axe violations').toEqual([]);
      expect(inspection.typography.fonts.filter(({ loaded }) => !loaded), 'Bundled interface fonts should load').toEqual([]);
      expect(inspection.typography.undersized, 'Stress text should remain at least 12px').toEqual([]);
      expect(inspection.typography.overflowing, 'Stress text should not clip').toEqual([]);
      expect(inspection.typography.overlongMeasures, 'Stress prose measure should remain readable').toEqual([]);

      writeFileSync(resolve(resultRoot, `${screenshotName.replace('.png', '')}.json`), `${JSON.stringify({ name, viewport, ...inspection }, null, 2)}\n`, 'utf8');
    });
  }
});

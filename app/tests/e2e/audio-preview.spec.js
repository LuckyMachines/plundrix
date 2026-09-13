import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import library from '../../public/audio/sfx/library.json' with { type: 'json' };

test('sound locker exposes and plays the complete generated library', async ({ page, request }) => {
  await page.goto('/audio-preview.html', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Sound Locker' })).toBeVisible();
  await expect(page.locator('.sound-card')).toHaveCount(library.cues.length);
  await expect(page.locator('.variation')).toHaveCount(library.cues.length * library.variations.length);

  for (const cue of library.cues) {
    for (const file of cue.files) {
      const response = await request.get(`/audio/sfx/${file}`);
      expect(response.ok(), `Missing preview file ${file}`).toBe(true);
    }
  }

  await page.getByRole('button', { name: 'Sabotage' }).click();
  await expect(page.locator('.sound-card:visible')).toHaveCount(library.cues.filter((cue) => cue.family === 'sabotage').length);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByLabel('Filter sounds').fill('transaction');
  await expect(page.locator('.sound-card:visible')).toHaveCount(library.cues.filter((cue) => cue.family === 'transaction').length);
  await page.getByLabel('Filter sounds').fill('');

  await page.locator('.variation').first().click();
  await expect(page.locator('#status')).toContainText(/Playing Intent Pick|Intent Pick complete/);

  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact))).toEqual([]);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

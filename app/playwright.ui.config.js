import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.js';

export default defineConfig({
  ...baseConfig,
  testMatch: 'ui-review.spec.js',
  retries: 0,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  use: {
    ...baseConfig.use,
    colorScheme: 'dark',
    locale: 'en-US',
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  },
});

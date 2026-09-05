import { defineConfig } from '@playwright/test';
import { site } from './fixtures/siteProfile';

/**
 * BASE_URL is env-driven so the same framework runs against:
 *  - the site profile's production URL (local, headed, exploratory runs)
 *  - a staging/demo environment      (CI — production sites block bots)
 */
export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }], // Jira/Xray-importable
  ],
  use: {
    baseURL: process.env.BASE_URL || site.baseUrl, // empty/unset → site profile
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    // A realistic UA and viewport reduce (but don't eliminate) bot challenges.
    viewport: { width: 1440, height: 900 },
    locale: site.locale,
  },
  projects: [
    {
      // Plain Chromium at a true desktop viewport. NB: the emulated
      // "Desktop Chrome" device descriptor makes FlySafair serve a
      // mobile-style fare accordion whose controls behave differently, so
      // we deliberately don't use it — just the viewport from `use` above.
      name: 'chromium',
    },
  ],
});

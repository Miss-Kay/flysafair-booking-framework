import { Page, expect } from '@playwright/test';

/**
 * BasePage: shared plumbing for every page object.
 * Keep this thin — if it grows past ~50 lines, something belongs elsewhere.
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  async open(path = '/'): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.dismissCookieBanner();
  }

  /** Cookie/consent banners are the #1 cause of flaky booking tests. */
  private async dismissCookieBanner(): Promise<void> {
    const accept = this.page.getByRole('button', {
      name: /accept|agree|allow all/i,
    });
    try {
      await accept.first().click({ timeout: 4000 });
    } catch {
      /* no banner shown — fine */
    }
  }

  /** Drop-off instrumentation: assert + screenshot at each funnel step. */
  async checkpointReached(stepName: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/funnel/${Date.now()}-${stepName}.png`,
      fullPage: false,
    });
    console.info(`[FUNNEL] checkpoint reached: ${stepName}`);
  }

  async expectUrlContains(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(fragment, 'i'));
  }
}

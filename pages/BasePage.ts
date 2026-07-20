import { Page, expect, test } from '@playwright/test';
import { site } from '../fixtures/siteProfile';

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

  /**
   * Drop-off instrumentation: screenshot at each funnel step, attached to
   * the test so it appears in the HTML report (and therefore on the S3
   * report site) instead of dying on the CI runner's disk.
   */
  async checkpointReached(stepName: string): Promise<void> {
    const screenshot = await this.page.screenshot({ fullPage: false });
    await test.info().attach(stepName, {
      body: screenshot,
      contentType: 'image/png',
    });
    console.info(`[FUNNEL] checkpoint reached: ${stepName}`);
  }

  async expectUrlContains(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(fragment, 'i'));
  }

  /**
   * True when the site served its bot-protection interstitial instead of
   * the real page — common when the request comes from a datacenter IP
   * (CI runners). The block page is static and present at load, so a
   * no-wait visibility check is enough and costs nothing on a normal run.
   */
  async isBotBlocked(): Promise<boolean> {
    if (site.botBlockUrlPattern.test(this.page.url())) return true;
    return this.page
      .getByText(site.botBlockPattern)
      .isVisible()
      .catch(() => false);
  }
}

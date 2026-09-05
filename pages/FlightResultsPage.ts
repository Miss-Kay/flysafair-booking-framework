import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { site } from '../fixtures/siteProfile';

/**
 * FlySafair flight-selection page (/flight/select).
 * Asserts results render, then selects the first bookable flight and
 * continues toward passenger details.
 */
export class FlightResultsPage extends BasePage {
  /** SLA assertion: the results page must actually render, not hang blank. */
  async assertResultsLoaded(slaMs = 20_000): Promise<void> {
    const start = Date.now();
    await this.page.waitForURL(site.resultsUrlPattern, { timeout: slaMs });
    await this.page
      .locator('.day-flight-pricing__button')
      .first()
      .waitFor({ state: 'visible', timeout: slaMs });
    console.info(`[PERF] results rendered in ${Date.now() - start}ms (SLA ${slaMs}ms)`);
    await this.checkpointReached('02-results-loaded');
  }

  /**
   * Select the first bookable flight. Clicking the "From R…" button expands
   * that flight's fare families, each shown as a button whose name is a bare
   * price (e.g. "R 1,929.69"). Choosing the cheapest enables Continue, which
   * is aria-disabled until a fare is picked.
   */
  async selectFirstFlight(): Promise<void> {
    // Expand the first flight's fare families (they are collapsed on load).
    await this.page.locator('.day-flight-pricing__button').first().click();
    const fareButton = this.page.locator('.day-flight__fares.show .fare__price-lowest').first();
    await fareButton.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(1000); // let the expand animation settle
    await this.checkpointReached('03a-fare-expanded');

    // Each fare family is a "R 1,929.69" button; choosing the first (cheapest)
    // enables the Continue button, which is aria-disabled until then.
    await fareButton.click();

    const continueBtn = this.page
      .locator('button.btn:not([aria-disabled="true"])')
      .filter({ hasText: /^Continue$/ })
      .first();
    await continueBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await continueBtn.click();
    await this.checkpointReached('03b-flight-selected');
  }

  async assertLowestFareVisible(): Promise<void> {
    await expect(this.page.getByText(/lowest fare/i).first()).toBeVisible();
  }
}

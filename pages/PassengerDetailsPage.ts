import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * FlySafair passenger / customer-details step — the HARD STOP for this suite.
 * We assert the customer-details form is displayed (proving the funnel is
 * passable up to data capture), but NEVER enter personal data or proceed to
 * payment against the production site.
 */
export class PassengerDetailsPage extends BasePage {
  /**
   * Assert-only: prove the customer-details capture page is displayed
   * (heading + the passenger name/email inputs), then STOP. We never fill
   * personal data or proceed to payment against the production site.
   */
  async assertCustomerDetailsDisplayed(): Promise<void> {
    await this.page.waitForURL(/\/flight\/passengers/i, { timeout: 20_000 });
    await expect(
      this.page.getByRole('heading', { name: /personalise your flight/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('input[name$="firstName"]').first()).toBeVisible();
    await expect(this.page.locator('input[name$="lastName"]').first()).toBeVisible();
    await expect(this.page.locator('input[name$="email"]').first()).toBeVisible();
    await this.checkpointReached('04-customer-details-displayed');
    console.info('[FUNNEL] Customer-details page reached. Stopping here by design.');
  }
}

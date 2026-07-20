import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { searchMatrix } from '../fixtures/testData';
import { site } from '../fixtures/siteProfile';
import { mockBookingEngine } from '../fixtures/mockBookingEngine';

/**
 * BOOKING FUNNEL — SEARCH STEP
 * One test per entry in the search matrix. Each drives the real homepage
 * search widget (autocomplete, calendar, submit) and asserts the handoff
 * lands on a results page. The booking engine itself is served from local
 * fixtures (see mockBookingEngine) so the run never hits the bot-protected
 * production engine.
 *
 * If the homepage itself serves the site's bot-protection page (typical
 * from CI datacenter IPs), the test SKIPS rather than fails — that is an
 * external block, not a code regression. Run locally or against an
 * allowlisted/staging BASE_URL for a guaranteed real execution.
 */
test.describe(`${site.name} booking funnel`, () => {
  for (const criteria of searchMatrix) {
    test(
      `customer can search ${criteria.from} → ${criteria.to} (${criteria.tripType}) @funnel @smoke`,
      async ({ page }) => {
        const home = new HomePage(page);

        await mockBookingEngine(page);

        await test.step('Step 1 — search for a flight', async () => {
          await home.open(site.entryPath);
          test.skip(
            await home.isBotBlocked(),
            `${site.name} served its bot-protection page to this runner IP — skipping (not a code failure)`,
          );
          await home.searchFlights(criteria);
        });

        await test.step('Step 2 — search lands on a results page', async () => {
          await expect(
            page.getByRole('heading', { name: site.resultsHeading }),
          ).toBeVisible();
        });
      },
    );
  }
});

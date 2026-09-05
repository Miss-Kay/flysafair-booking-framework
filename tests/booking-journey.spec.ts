import { test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { FlightResultsPage } from '../pages/FlightResultsPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { searchMatrix } from '../fixtures/testData';
import { site } from '../fixtures/siteProfile';

/**
 * BOOKING FUNNEL — FlySafair
 * One test per entry in the search matrix. Each drives the real homepage
 * search widget (autocomplete, v-calendar, submit), confirms flight
 * results render, selects a flight, and confirms the customer-details
 * page is displayed — stopping there by design, before any personal data
 * or payment. FlySafair permits automation, so the whole flow runs live.
 *
 * If the site ever serves a bot-protection page, the test SKIPS rather
 * than fails (see BasePage.isBotBlocked) — that is an external block, not
 * a code regression.
 */
test.describe(`${site.name} booking funnel`, () => {
  for (const criteria of searchMatrix) {
    const label = `${criteria.from} → ${criteria.to} (${criteria.tripType})`;
    test(`customer can search, select a flight and reach details — ${label} @funnel @smoke`, async ({ page }) => {
      const home = new HomePage(page);
      const results = new FlightResultsPage(page);
      const paxDetails = new PassengerDetailsPage(page);

      await test.step('Step 1 — search for a flight', async () => {
        await home.open(site.entryPath);
        test.skip(
          await home.isBotBlocked(),
          `${site.name} served its bot-protection page to this runner IP — skipping (not a code failure)`,
        );
        await home.searchFlights(criteria);
      });

      await test.step('Step 2 — flight results render', async () => {
        await results.assertResultsLoaded();
      });

      await test.step('Step 3 — select a flight', async () => {
        await results.selectFirstFlight();
      });

      await test.step('Step 4 — customer details page is displayed', async () => {
        await paxDetails.assertCustomerDetailsDisplayed();
      });
    });
  }
});

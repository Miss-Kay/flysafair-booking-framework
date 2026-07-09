import { test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { defaultSearch } from '../fixtures/testData';
import { mockBookingEngine } from '../fixtures/mockBookingEngine';

/**
 * BOOKING FUNNEL — SEARCH STEP ONLY
 * Runs the flight search (Johannesburg → Dubai) against the real homepage
 * and stops once the search is submitted. The booking-engine handoff is
 * served from local fixtures (see mockBookingEngine) so the run never
 * hits the bot-protected production booking engine.
 */
test.describe('Emirates booking funnel', () => {
  test('customer can search for a flight to Dubai @funnel @smoke', async ({ page }) => {
    const home = new HomePage(page);

    await mockBookingEngine(page);

    await test.step('Step 1 — search for a flight', async () => {
      await home.open('/za/english/');
      await home.searchFlights(defaultSearch);
    });
  });
});

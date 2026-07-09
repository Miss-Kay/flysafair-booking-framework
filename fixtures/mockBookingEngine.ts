import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MOCK BOOKING ENGINE
 * -------------------
 * The real Emirates booking engine (www.emirates.com/booking/* and the
 * fly*.emirates.com hosts) sits behind bot protection and blocks automated
 * sessions. The search step executes against the real homepage, and the
 * handoff to the booking engine after submit is fulfilled from
 * fixtures/html/flight-results.html instead, so the run never touches
 * production inventory or trips the bot defence.
 */
const BOOKING_ENGINE = /fly\d*\.emirates\.com|emirates\.com\/booking\//;
const RESULTS_FIXTURE = path.join(__dirname, 'html', 'flight-results.html');

export async function mockBookingEngine(page: Page): Promise<void> {
  await page.route(BOOKING_ENGINE, route =>
    route.fulfill({
      contentType: 'text/html',
      body: fs.readFileSync(RESULTS_FIXTURE, 'utf-8'),
    }),
  );
}

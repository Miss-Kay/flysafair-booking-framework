import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { healing } from '../utils/selfHealing';
import { SearchCriteria } from '../fixtures/testData';

/**
 * Emirates home page — flight search widget.
 * Every interactive element uses a self-healing locator chain:
 *   1. test id / stable attribute   (most stable)
 *   2. accessible role + name       (survives CSS refactors)
 *   3. visible text / placeholder   (last resort)
 */
export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private departureField = healing(this.page, 'Departure airport', [
    { name: 'data-testid', build: p => p.locator('[data-testid="origin-input"]') },
    { name: 'role=textbox Departure', build: p => p.getByRole('textbox', { name: /departure|from/i }) },
    { name: 'label', build: p => p.getByLabel(/departure|from/i) },
  ]);

  private arrivalField = healing(this.page, 'Arrival airport', [
    { name: 'data-testid', build: p => p.locator('[data-testid="destination-input"]') },
    { name: 'role=textbox Arrival', build: p => p.getByRole('textbox', { name: /arrival|to/i }) },
    { name: 'label', build: p => p.getByLabel(/arrival|to/i) },
  ]);

  private searchButton = healing(this.page, 'Search flights button', [
    { name: 'data-testid', build: p => p.locator('[data-testid="search-flights"]') },
    { name: 'role=button', build: p => p.getByRole('button', { name: /search flights?/i }) },
    { name: 'text', build: p => p.getByText(/search flights?/i) },
  ]);

  async searchFlights(criteria: SearchCriteria): Promise<void> {
    await this.departureField.type(criteria.from);
    await this.selectSuggestion(criteria.from);
    await this.checkpointReached('01a-departure-selected');

    await this.arrivalField.type(criteria.to);
    await this.selectSuggestion(criteria.to);
    await this.checkpointReached('01b-arrival-selected');

    await this.pickDates(criteria);
    await this.checkpointReached('01c-dates-selected');

    await this.searchButton.click();
    await this.checkpointReached('01d-search-submitted');
  }

  /**
   * Airport fields are autocomplete widgets. The suggestion list is not
   * always filtered by the typed text (it can still show every destination
   * alphabetically), so we must click the option matching the requested
   * city — blindly taking the first option selects e.g. Abidjan.
   */
  private async selectSuggestion(city: string): Promise<void> {
    const suggestion = this.page.getByRole('option', { name: new RegExp(city, 'i') }).first();
    try {
      await suggestion.click({ timeout: 10_000 });
    } catch {
      await this.page.keyboard.press('Enter'); // fallback: accept typed value
    }
  }

  private async pickDates(criteria: SearchCriteria): Promise<void> {
    // The calendar opens automatically after the arrival airport is chosen.
    // The widget defaults to a return trip, so one-way must be set explicitly;
    // for return trips the calendar stays open for the second date.
    if (criteria.tripType === 'oneway') {
      const oneWay = this.page.getByRole('checkbox', { name: /one way/i });
      try {
        await oneWay.check({ timeout: 5000 });
      } catch {
        await this.page.getByText(/one way/i).first().click(); // hidden input — click the label
      }
    }

    await this.clickDateCell(criteria.departDate);
    if (criteria.tripType === 'return') {
      if (!criteria.returnDate) {
        throw new Error('[SEARCH] tripType is "return" but no returnDate was provided');
      }
      await this.clickDateCell(criteria.returnDate);
    }
  }

  /** Date cells are buttons named e.g. "Saturday, 08 August 2026". */
  private async clickDateCell(isoDate: string): Promise<void> {
    const [year, month, day] = isoDate.split('-').map(Number);
    const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-GB', {
      month: 'long',
      timeZone: 'UTC',
    });
    const cellName = new RegExp(`${String(day).padStart(2, '0')} ${monthName} ${year}`);
    await this.page.getByRole('button', { name: cellName }).first().click();
  }
}

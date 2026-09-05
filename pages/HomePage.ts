import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { healing } from '../utils/selfHealing';
import { SearchCriteria } from '../fixtures/testData';
import { site } from '../fixtures/siteProfile';

/**
 * FlySafair home page — flight search widget.
 * Interactive elements use self-healing locator chains:
 *   1. test id / stable attribute   (most stable)
 *   2. accessible role + name       (survives CSS refactors)
 *   3. visible text / placeholder   (last resort)
 */
export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private oneWayToggle = healing(this.page, 'One-way trip type', [
    { name: 'role=radio oneWay', build: p => p.getByRole('radio', { name: /one.?way/i }) },
    { name: 'label One-way', build: p => p.getByText(/^one-way$/i) },
  ]);

  private originField = healing(this.page, 'Origin airport', [
    { name: 'placeholder origin', build: p => p.getByPlaceholder(/select origin/i) },
    { name: 'role=searchbox origin', build: p => p.getByRole('searchbox', { name: /origin/i }) },
  ]);

  private destinationField = healing(this.page, 'Destination airport', [
    { name: 'placeholder destination', build: p => p.getByPlaceholder(/select destination/i) },
    { name: 'role=searchbox destination', build: p => p.getByRole('searchbox', { name: /destination/i }) },
  ]);

  private searchButton = healing(this.page, "Let's go (search) button", [
    { name: 'role=button', build: p => p.getByRole('button', { name: /let.?s go/i }) },
    { name: 'text', build: p => p.getByText(/let.?s go/i) },
  ]);

  async searchFlights(criteria: SearchCriteria): Promise<void> {
    // Wait for the search widget to be interactive before touching the trip
    // type — clicking too early doesn't register and the search stays a
    // round-trip, which would strand the funnel at return-flight selection.
    await this.originField.resolve();

    if (criteria.tripType === 'oneway') {
      await this.ensureOneWay();
    }

    await this.selectAirport(this.originField, criteria.from, criteria.fromCode);
    await this.checkpointReached('01a-origin-selected');

    await this.selectAirport(this.destinationField, criteria.to, criteria.toCode);
    await this.checkpointReached('01b-destination-selected');

    await this.pickDepartureDate(criteria.departDate);
    await this.setAdults(criteria.adults);
    await this.checkpointReached('01c-date-and-pax-selected');

    await this.searchButton.click();
    await this.checkpointReached('01d-search-submitted');
  }

  /**
   * Selecting one-way is racy in this SPA — a single click sometimes doesn't
   * register, leaving a round-trip search that strands the funnel at
   * return-flight selection. Poll-click until the radio actually reports
   * checked, so the trip type is deterministic.
   */
  private async ensureOneWay(): Promise<void> {
    const oneWayRadio = this.page.getByRole('radio', { name: /one.?way/i });
    for (let attempt = 0; attempt < 5; attempt++) {
      if (await oneWayRadio.isChecked().catch(() => false)) return;
      await this.oneWayToggle.click().catch(() => {});
      await this.page.waitForTimeout(400);
    }
    if (!(await oneWayRadio.isChecked().catch(() => false))) {
      throw new Error('[SEARCH] Could not select the one-way trip type');
    }
  }

  /**
   * Airport fields are autocomplete widgets whose list is built from real
   * keystrokes. Type the city, then click the suggestion carrying the IATA
   * code so we pick the intended airport (e.g. JNB, not a partner route).
   */
  private async selectAirport(
    field: ReturnType<typeof healing>,
    city: string,
    code: string,
  ): Promise<void> {
    await field.type(city);
    await this.page
      .getByRole('option')
      .filter({ hasText: new RegExp(`\\b${code}\\b`) })
      .first()
      .click({ timeout: 10_000 });
  }

  /**
   * The date field is a v-calendar popover. Open it, advance by the number
   * of months between today and the target, then click the day whose
   * accessible label matches — scoped to the open popover and to the
   * in-month cell so the twin (return) calendar and faded adjacent-month
   * days can't be hit by mistake.
   */
  private async pickDepartureDate(isoDate: string): Promise<void> {
    const target = new Date(`${isoDate}T00:00:00Z`);
    const aria = target.toLocaleDateString(site.dateLabelLocale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const now = new Date();
    const monthDelta =
      (target.getUTCFullYear() - now.getFullYear()) * 12 +
      (target.getUTCMonth() - now.getMonth());

    await this.page.locator('.datepicker-trigger').first().click();
    const popover = this.page.locator('.vc-popover-content').first();
    await popover.waitFor({ state: 'visible' });

    for (let i = 0; i < Math.max(0, monthDelta); i++) {
      await popover.locator('.vc-arrow.is-right').click();
      await this.page.waitForTimeout(300); // let the month transition settle
    }

    await popover
      .locator(`.vc-day:not(.is-not-in-month) .vc-day-content[aria-label="${aria}"]`)
      .first()
      .click();
  }

  /** Passenger counts default to 1 adult; only act when a higher count is asked. */
  private async setAdults(adults: number): Promise<void> {
    if (adults <= 1) return;
    if (adults <= 3) {
      await this.page
        .locator('.passenger-select-buttons__button')
        .filter({ hasText: new RegExp(`^${adults}$`) })
        .first()
        .click();
    } else {
      await this.page.getByRole('combobox', { name: /more/i }).selectOption(String(adults));
    }
  }
}

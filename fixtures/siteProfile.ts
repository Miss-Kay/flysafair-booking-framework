/**
 * SITE PROFILE — every site-specific value lives in this one object.
 *
 * Adopting the framework for another airline means writing a new profile
 * (plus page objects for that airline's widgets); nothing else in the
 * framework references the airline directly.
 */
export interface SiteProfile {
  /** Human name — used in logs, reports, and test titles. */
  name: string;
  /** Default base URL; the BASE_URL env var overrides it. */
  baseUrl: string;
  /** Market/language entry path for the homepage. */
  entryPath: string;
  /** Browser locale for the test context. */
  locale: string;
  /** Locale of the month names in the calendar's accessible labels. */
  dateLabelLocale: string;
  /** URL fragment the search handoff lands on when results render. */
  resultsUrlPattern: RegExp;
  /** Heading/text that proves the search landed on a results page. */
  resultsHeading: RegExp;
  /**
   * Signatures of the site's bot-protection / "access restricted"
   * interstitial — the URL it redirects to, and text unique to the page.
   * When a request is served this page, the test skips rather than
   * false-failing. See BasePage.isBotBlocked(). Optional: sites that
   * permit automation (e.g. FlySafair) can omit these.
   */
  botBlockUrlPattern?: RegExp;
  botBlockPattern?: RegExp;
}

/**
 * FlySafair — the active target. Its whole search flow (autocomplete,
 * v-calendar, fare selection) is automatable end-to-end: it does not
 * block automated browsers, so no booking-engine mock is needed.
 */
export const flysafair: SiteProfile = {
  name: 'FlySafair',
  baseUrl: 'https://www.flysafair.co.za',
  entryPath: '/',
  locale: 'en-ZA',
  dateLabelLocale: 'en-GB', // calendar aria-labels: "Monday, 5 October 2026"
  resultsUrlPattern: /\/flight\/select/i,
  resultsHeading: /select flights/i,
};

/** The profile the suite runs against. */
export const site: SiteProfile = flysafair;

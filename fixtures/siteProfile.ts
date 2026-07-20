/**
 * SITE PROFILE — every site-specific value lives in this one object.
 *
 * Adopting the framework for another airline means writing a new profile
 * (plus a page object and fixture HTML for that airline's widgets);
 * nothing else in the framework references the airline directly.
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
  /** URLs owned by the bot-protected booking engine — served from fixtures. */
  bookingEnginePattern: RegExp;
  /** Heading that proves the search handoff landed on a results page. */
  resultsHeading: RegExp;
  /**
   * Signatures of the site's bot-protection / "access restricted"
   * interstitial — the URL it redirects to, and text unique to the page.
   * When a request is served this page (common from datacenter IPs, and
   * from any IP the site has flagged), the test skips rather than
   * false-failing: it is not a code regression. See BasePage.isBotBlocked().
   */
  botBlockUrlPattern: RegExp;
  botBlockPattern: RegExp;
}

export const emirates: SiteProfile = {
  name: 'Emirates',
  baseUrl: 'https://www.emirates.com',
  entryPath: '/za/english/',
  locale: 'en-ZA',
  dateLabelLocale: 'en-GB',
  bookingEnginePattern: /fly\d*\.emirates\.com|emirates\.com\/booking\//,
  resultsHeading: /choose your outbound flight/i,
  botBlockUrlPattern: /\/error\/accessrestricted/i,
  botBlockPattern: /the page you.?re trying to access is restricted/i,
};

/** The profile the suite runs against. */
export const site: SiteProfile = emirates;

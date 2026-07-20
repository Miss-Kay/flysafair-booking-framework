# Emirates Booking Funnel — Test Automation Framework

Playwright + TypeScript framework that monitors the flight-booking journey to
detect **customer drop-off points** before customers do. Built to be simple,
maintainable, and self-healing, with CI/CD via GitHub Actions publishing
reports to AWS S3.

## The problem it solves

Booking funnels lose customers silently, starting with the search widget on
the homepage. This suite currently covers **the search step**: a data-driven
matrix of searches (see `fixtures/testData.ts`) drives the real emirates.com
homepage through the airport autocomplete, calendar, and submit, attaches a
screenshot at every sub-step, and asserts the handoff lands on a results
page.

> The handoff to the booking engine after submit is **served from local
> fixture HTML** (`fixtures/mockBookingEngine.ts`): the production booking
> engine sits behind bot protection and blocks automated sessions, so no
> request past the search ever reaches it — no inventory holds, no
> bot-defence evasion.

## Architecture (deliberately simple)

```
tests/       one spec per journey, readable as a funnel narrative
pages/       page objects — locators + actions only, no assertions logic
utils/       selfHealing.ts — ordered locator fallback chains
fixtures/    siteProfile.ts (all site-specific values), typed test data,
             booking-engine mock + fixture HTML
.github/     CI workflow + Dependabot: run suite, publish report to S3
```

**Adopting for another airline:** write a new `SiteProfile` (URLs, locale,
booking-engine pattern), a page object for that airline's search widget, and
fixture HTML for its booking-engine pages. Nothing else references the
airline.

Three design rules keep it maintainable:
1. **Selectors live only in page objects** — a UI change touches one file.
2. **Self-healing chains, not magic** — each element has 2–3 ordered
   strategies (test-id → role → text). Fallback use is logged loudly so the
   primary selector gets fixed instead of rotting.
3. **Tests read like the customer journey** — `test.step` per funnel stage.

## Run locally

```bash
npm ci
npx playwright install
npm run test:headed        # watch it drive the funnel
npm run report             # open the HTML report
```

Run against a different environment:

```bash
BASE_URL=https://staging.example.com npm test
```

## CI/CD

`.github/workflows/playwright.yml` typechecks, runs the suite, and publishes
reports on push, PR, a weekly schedule (Mondays 06:00 SAST), and manual
dispatch. Reports upload as a GitHub artifact **and** sync to S3 — both a
per-run URL and a stable `reports/latest/` link, served over HTTPS via
CloudFront (`REPORT_BASE_URL` repo variable). Old reports expire from S3
after 90 days via a lifecycle rule. Set an optional `SLACK_WEBHOOK_URL`
repo secret to get a Slack ping when a run fails. Dependabot keeps npm
packages and GitHub Actions current with weekly PRs.

### One-time AWS setup

Run the bootstrap script with admin AWS credentials — it creates the report
bucket (static website hosting), the GitHub OIDC provider, and a repo-scoped
IAM role, then prints the `gh` commands that wire the repo to AWS:

```bash
./scripts/setup-aws-reports.sh <bucket-name> <aws-region> <github-org/repo>
```

The S3 publish steps in the workflow are skipped automatically until the
`REPORT_BUCKET` variable exists, so CI is green before AWS is configured.
Optionally also set a `BASE_URL` repo variable to run CI against staging.

### Note on production bot protection

emirates.com (like all airline sites) uses bot detection. A flagged request
is redirected to `/error/accessrestricted.html` instead of the homepage —
datacenter IPs (CI runners) are challenged most often, but a residential IP
that has generated repeated automated traffic gets flagged too.

**The suite skips rather than fails when it sees that page.** An external
block is not a code regression, so a blocked run reports `skipped` with the
reason attached (see `BasePage.isBotBlocked()` and the `botBlock*` patterns
in `fixtures/siteProfile.ts`). A red pipeline is reserved for real defects.

Consequence worth understanding: **a skipped run verifies nothing.** If runs
skip persistently, the monitor has stopped monitoring. Options, in order of
preference:
- Point `BASE_URL` at a **staging environment** without bot protection.
- Get the monitor's egress IP **allowlisted** in the site's bot manager
  (the standard arrangement for authorized synthetic monitoring).
- Run **locally from a clean network** for exploratory validation.

The framework deliberately does **not** attempt to evade bot protection —
no fingerprint spoofing, no stealth plugins. That would be both fragile and
inappropriate against a production site.

## Roadmap

- API-level funnel checks (Playwright `request`) — faster drop-off signal
- Data-driven passenger matrices (adult/child/infant)
- Lighthouse perf budget on the results page
- Restore results/fare/passenger funnel steps against fixture pages

# Emirates Booking Funnel — Test Automation Framework

Playwright + TypeScript framework that monitors the flight-booking journey to
detect **customer drop-off points** before customers do. Built to be simple,
maintainable, and self-healing, with CI/CD via GitHub Actions publishing
reports to AWS S3.

## The problem it solves

Booking funnels lose customers silently, starting with the search widget on
the homepage. This suite currently covers **the search step**: it drives the
real emirates.com homepage (Johannesburg → Dubai, return) through the
airport autocomplete, calendar, and submit, capturing a checkpoint
screenshot along the way.

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
fixtures/    typed test data, booking-engine mock + fixture HTML
.github/     CI workflow: run suite, publish HTML report to S3
```

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

`.github/workflows/playwright.yml` runs on push, PR, a daily 06:00 SAST
schedule, and manual dispatch. Reports upload as a GitHub artifact **and**
sync to an S3 static-website bucket, so stakeholders get a link, not a zip.

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

emirates.com (like all airline sites) uses bot detection; datacenter IPs in
CI will often be challenged. Recommended usage:
- **Local headed runs** against emirates.com for exploratory validation.
- **CI runs** against a staging env or a demo booking site — the framework
  is identical, only `BASE_URL` changes.

## Roadmap

- API-level funnel checks (Playwright `request`) — faster drop-off signal
- Data-driven passenger matrices (adult/child/infant)
- Slack webhook on funnel checkpoint failure
- Lighthouse perf budget on the results page

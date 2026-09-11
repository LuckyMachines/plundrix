# SEO and Marketing Improvement Checklist

Date: 2026-09-11
Operating mode: one maintainer, one active experiment, 30-minute weekly review

## Baseline report card

Overall: **B** under the stricter growth bar.

| Area | Baseline | Evidence |
| --- | ---: | --- |
| Crawlability | C+ | Route-specific metadata existed, but production game pages returned an empty application root to non-JavaScript clients. |
| Search integrity | B- | Sitemaps, robots, canonicals, and AI references existed, but dates were hard-coded and `llms.txt` linked to a production 404. |
| Domain architecture | B | Marketing and game roles were described, but comparison intent lived on the game subdomain and split acquisition authority. |
| Attribution | C | Product events existed, but first-touch source, campaign, creative, landing page, and site identity were not preserved. |
| Marketing production | B+ | Trailer, social-card, replay, and proof systems existed, but the campaign handoff remained manual and unmeasured. |
| Solo operating loop | C+ | The product improvement loop was strong, but search health and marketing funnel data were absent from its weekly decision surface. |

## Implemented top to bottom

- [x] Ship semantic pre-rendered fallback content with one H1, useful copy, and crawlable links for every public game route.
- [x] Remove ungrounded FAQ schema from the Player Hub and align organization identity with the marketing domain.
- [x] Replace the hard-coded game sitemap date with a content-aware build date.
- [x] Remove the private `/simulator` route from the public AI reference.
- [x] Move eight comparison pages to static marketing-owned routes with distinct metadata, useful copy, sources, FAQs, breadcrumbs, and tracked CTAs.
- [x] Redirect old production game comparison URLs permanently to their marketing canonicals.
- [x] Generate the marketing sitemap and robots policy from application code.
- [x] Add privacy-safe first-touch attribution for source, medium, campaign, creative, landing page, and referrer hostname.
- [x] Add site identity to marketing and game custom analytics events.
- [x] Create a single audience, intent, metric, route, and campaign registry for growth work.
- [x] Add deterministic tracked-link generation.
- [x] Upgrade replay marketing bundles with tracked links, channel-ready captions, alt text, and an asset checklist.
- [x] Add optional Search Console and Plausible API adapters that produce aggregate-only metric snapshots.
- [x] Add a cross-domain production crawler and weekly growth report with one recommended next action.
- [x] Add automated growth, crawlability, sitemap, redirect, schema, and marketing-export tests.

## External evidence still required

- [x] Deploy both repositories and pass the production audit at 237/237 checks across 25 public pages.
- [ ] Supply short-lived Search Console access and a read-only Plausible API key when production measurement is desired.
- [ ] Collect at least four complete weekly snapshots before changing targets.
- [ ] Run only the single active experiment selected by the shared improvement ledger.

## A bar, stricter

- Every indexable URL returns meaningful semantic HTML before JavaScript.
- Every public URL has one owner, intent, promise, proof asset, CTA, and canonical.
- The production crawler has zero failures across both domains.
- Search Console and Plausible aggregates connect discovery to match completion without collecting player identity.
- One weekly command produces one prioritized action and one evidence-backed campaign package.
- No testimonial, traction claim, or player story is published without genuine evidence and explicit approval.

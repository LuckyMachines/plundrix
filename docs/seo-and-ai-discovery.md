# SEO and AI discovery

Status: implemented for the production build on 2026-08-16.

## Canonical discovery surface

- Canonical origin: `https://game.plundrix.com`
- Public sitemap: `/sitemap.xml`
- Crawler policy: `/robots.txt`
- Concise AI reference: `/llms.txt`
- Extended factual AI reference: `/llms-full.txt`

The AI references state only product facts already supported by the game, deployment records, terms, and public contract. They do not publish analytics, testimonials, or invented player stories.

## Static route metadata

The production build writes route-specific HTML for every public sitemap route. Clean requests such as `/play`, `/trailer`, and comparison pages resolve to those files instead of the generic SPA shell. Each public route receives one canonical URL, description, robots directive, Open Graph set, Twitter card set, and JSON-LD payload.

Internal operator tools are excluded from the sitemap and crawler policy. The production server also returns `X-Robots-Tag: noindex, nofollow` for internal and player-specific routes.

## Structured data

- Home: `WebSite`, `Organization`, `VideoGame`, and visible `FAQPage` facts.
- Trailer: `WebPage` plus `VideoObject` with duration, thumbnail, content URL, and upload date.
- Comparison pages: `WebPage` plus visible `FAQPage` content.
- Other public routes: route-specific `WebPage` or `CollectionPage` data.

Client-side navigation replaces the static JSON-LD block, preventing duplicate or stale route schema.

## Social cards

- `/images/og/plundrix-home.jpg`
- `/images/og/plundrix-play.jpg`
- `/images/og/plundrix-trailer.jpg`

All cards are 1200x630 JPEGs. Their text-free scene masters were created with Azure-hosted GPT Image 2 using existing Plundrix art as identity references; the checked-in build script adds exact typography deterministically. Source masters live under `app/assets/social-source/`. Rebuild the delivery assets with `npm run build:social` from `app/`.

## Verification

From `app/`:

```powershell
npm run build
npm run test:seo
npm run test:e2e
```

The SEO test validates generated metadata, JSON-LD parsing, clean-route serving, synchronized sitemaps, AI reference delivery, social assets, internal-route noindex headers, and MP4 byte-range responses.

The production game process also hosts the read-only competition index on an internal port and proxies `/api/*` through the canonical game origin. This keeps leaderboard requests same-origin while preserving the friendly unavailable state for local builds without `VITE_AGENT_SERVICE_URL`.

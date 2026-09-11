import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createAcquisitionSnapshot, readAcquisitionSnapshot } from '../src/lib/acquisition.js';
import { buildGrowthSnapshot, buildTrackedUrl, normalizeGrowthMetrics, validateGrowthStrategy } from '../src/lib/growthSystem.js';
import { indexCoverageFromSitemaps, nonBrandClicksFromSearchRows, plausibleMetricValue } from '../src/lib/growthAdapters.js';
import { auditHtml, extractAbsoluteUrls, extractHtmlFacts, extractSitemapEntries } from '../src/lib/seoAudit.js';

const strategy = JSON.parse(await readFile(resolve('growth', 'strategy.json'), 'utf8'));
const campaigns = JSON.parse(await readFile(resolve('growth', 'campaigns.json'), 'utf8'));
assert.deepEqual(validateGrowthStrategy(strategy, campaigns), { ok: true, errors: [] });
assert.equal(strategy.routeIntents.length, 25);
assert.equal(new Set(strategy.routeIntents.map((route) => route.url)).size, 25);
assert.ok(strategy.routeIntents.some((route) => route.url === 'https://plundrix.com/terms'));
assert.ok(strategy.routeIntents.some((route) => route.url === 'https://game.plundrix.com/career'));

const tracked = buildTrackedUrl(campaigns.campaigns[0]);
assert.match(tracked, /utm_source=plundrix/);
assert.match(tracked, /utm_campaign=player-hub/);

const acquisition = createAcquisitionSnapshot({
  href: 'https://game.plundrix.com/play?utm_source=youtube&utm_medium=social&utm_campaign=vault-race&utm_content=short-01',
  referrer: 'https://youtube.com/watch?v=private',
});
assert.deepEqual(acquisition, {
  version: 1,
  channel: 'social',
  medium: 'social',
  campaign: 'vault-race',
  creative: 'short-01',
  source: 'youtube',
  landing: 'play',
  referrer: 'youtube.com',
});
const memory = new Map();
const storage = { getItem: (key) => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
const firstTouch = readAcquisitionSnapshot({ location: { href: 'https://game.plundrix.com/?utm_source=press' }, referrer: '', storage });
const persisted = readAcquisitionSnapshot({ location: { href: 'https://game.plundrix.com/play?utm_source=other' }, referrer: '', storage });
assert.equal(firstTouch.source, 'press');
assert.equal(persisted.source, 'press');

const metrics = normalizeGrowthMetrics({
  searchConsole: { submittedPublicUrls: 20, validIndexedUrls: 19, nonBrandClicks: 31 },
  plausible: { marketingVisitors: 100, playerHubHandoffs: 24, attributedPlayerHubLandings: 24, instantMatchStarts: 14, instantMatchCompletions: 10, challengeShares: 2 },
});
assert.equal(metrics['valid-index-rate'].value, 95);
assert.equal(metrics['marketing-handoff-rate'].value, 24);
assert.equal(metrics['source-match-completion-rate'].value, 71.4);
const snapshot = buildGrowthSnapshot({ strategy, campaigns, metrics: {
  searchConsole: { submittedPublicUrls: 20, validIndexedUrls: 19, nonBrandClicks: 31 },
  plausible: { marketingVisitors: 100, playerHubHandoffs: 24, attributedPlayerHubLandings: 24, instantMatchStarts: 14, instantMatchCompletions: 10, challengeShares: 2 },
} });
assert.equal(snapshot.scorecard.find((item) => item.id === 'valid-index-rate').state, 'pass');

const html = '<!doctype html><html><head><title>Useful Plundrix page</title><meta name="description" content="A complete and useful description of this Plundrix page for players and search engines." /><meta name="robots" content="index,follow" /><link rel="canonical" href="https://plundrix.com/test" /><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script></head><body><main><h1>Useful page</h1><p>' + 'Readable crawlable game information. '.repeat(8) + '</p><a href="/play">Play</a><a href="/rules">Rules</a></main></body></html>';
assert.equal(extractHtmlFacts(html).h1Count, 1);
assert.equal(auditHtml({ requestedUrl: 'https://plundrix.com/test', status: 200, html }).ok, true);
assert.deepEqual(extractSitemapEntries('<urlset><url><loc>https://plundrix.com/</loc><lastmod>2026-09-11</lastmod></url></urlset>'), [{ url: 'https://plundrix.com/', lastModified: '2026-09-11' }]);
assert.deepEqual(extractAbsoluteUrls('See https://plundrix.com/play and https://plundrix.com/play.'), ['https://plundrix.com/play']);
assert.equal(nonBrandClicksFromSearchRows([{ keys: ['plundrix'], clicks: 8 }, { keys: ['vault strategy game'], clicks: 4 }]), 4);
assert.deepEqual(indexCoverageFromSitemaps([{ contents: [{ type: 'web', submitted: '12', indexed: '10' }] }]), { submittedPublicUrls: 12, validIndexedUrls: 10 });
assert.equal(plausibleMetricValue({ results: [{ metrics: [7] }] }), 7);

console.log('Growth and SEO-system tests passed');

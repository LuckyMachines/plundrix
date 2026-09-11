import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { indexCoverageFromSitemaps, nonBrandClicksFromSearchRows, plausibleMetricValue } from '../src/lib/growthAdapters.js';

function date(value) {
  return value.toISOString().slice(0, 10);
}

function period() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return { start: date(start), end: date(end) };
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${response.status} ${url}: ${(await response.text()).slice(0, 300)}`);
  return response.json();
}

async function fetchSearchConsole(range) {
  const token = process.env.GSC_ACCESS_TOKEN;
  if (!token) return { status: 'missing-credentials', metrics: {} };
  const sites = String(process.env.GSC_SITE_URLS || 'https://plundrix.com/,https://game.plundrix.com/').split(',').map((item) => item.trim()).filter(Boolean);
  const sitemapUrls = String(process.env.GSC_SITEMAP_URLS || 'https://plundrix.com/sitemap.xml,https://game.plundrix.com/sitemap.xml').split(',').map((item) => item.trim());
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const rows = [];
  const sitemapPayloads = [];
  for (let index = 0; index < sites.length; index += 1) {
    const site = encodeURIComponent(sites[index]);
    const query = await jsonFetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ startDate: range.start, endDate: range.end, dimensions: ['query'], rowLimit: 25000 }),
    });
    rows.push(...(query.rows || []));
    const feedpath = encodeURIComponent(sitemapUrls[index] || `${sites[index].replace(/\/$/, '')}/sitemap.xml`);
    sitemapPayloads.push(await jsonFetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/sitemaps/${feedpath}`, { headers }));
  }
  return {
    status: 'connected',
    metrics: {
      ...indexCoverageFromSitemaps(sitemapPayloads),
      nonBrandClicks: nonBrandClicksFromSearchRows(rows),
    },
  };
}

async function plausibleEventCount(eventNames, range, extraFilters = []) {
  const names = Array.isArray(eventNames) ? eventNames : [eventNames];
  const endpoint = `${String(process.env.PLAUSIBLE_API_URL || 'https://plausible.racerverse.com').replace(/\/$/, '')}/api/v2/query`;
  const payload = await jsonFetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      site_id: process.env.PLAUSIBLE_SITE_ID || 'plundrix.com',
      date_range: [range.start, range.end],
      metrics: ['visitors'],
      filters: ['and', ['is', 'event:name', names], ...extraFilters],
    }),
  });
  return plausibleMetricValue(payload) || 0;
}

async function fetchPlausible(range) {
  if (!process.env.PLAUSIBLE_API_KEY) return { status: 'missing-credentials', metrics: {} };
  const [marketingVisitors, playerHubHandoffs, attributedPlayerHubLandings, instantMatchStarts, instantMatchCompletions, challengeShares] = await Promise.all([
    plausibleEventCount('marketing_page_view', range),
    plausibleEventCount(['primary_cta_click', 'secondary_cta_click', 'game_handoff_click'], range),
    plausibleEventCount('Page Viewed', range, [['is', 'event:props:landing', ['player-hub']]]),
    plausibleEventCount('Instant Match Started', range),
    plausibleEventCount('Instant Match Completed', range),
    plausibleEventCount('Challenge Shared', range),
  ]);
  return {
    status: 'connected',
    metrics: {
      marketingVisitors,
      playerHubHandoffs,
      attributedPlayerHubLandings,
      instantMatchStarts,
      instantMatchCompletions,
      challengeShares,
    },
  };
}

const range = period();
const [searchConsole, plausible] = await Promise.all([
  fetchSearchConsole(range).catch((error) => ({ status: 'error', error: error.message, metrics: {} })),
  fetchPlausible(range).catch((error) => ({ status: 'error', error: error.message, metrics: {} })),
]);
const snapshot = {
  schemaVersion: 1,
  capturedAt: new Date().toISOString(),
  period: range,
  production: true,
  sources: { searchConsole: searchConsole.status, plausible: plausible.status },
  searchConsole: searchConsole.metrics,
  plausible: plausible.metrics,
  errors: [searchConsole.error, plausible.error].filter(Boolean),
};
const reportDir = resolve('reports', 'growth');
await mkdir(reportDir, { recursive: true });
await writeFile(resolve(reportDir, 'metrics-latest.json'), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(`Growth metrics: Search Console ${searchConsole.status}; Plausible ${plausible.status}.`);
console.log(`Snapshot: ${resolve(reportDir, 'metrics-latest.json')}`);

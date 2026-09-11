import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { auditHtml, extractAbsoluteUrls, extractSitemapEntries } from '../src/lib/seoAudit.js';

function argsFrom(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const next = argv[index + 1];
    args[token.slice(2)] = !next || next.startsWith('--') ? true : next;
    if (args[token.slice(2)] !== true) index += 1;
  }
  return args;
}

function normalizeOrigin(value) {
  return String(value).replace(/\/$/, '');
}

function normalizeReportName(value) {
  const reportName = String(value || 'latest-audit').replace(/[^a-z0-9-]/gi, '');
  return reportName || 'latest-audit';
}

function normalizeCrawlUrl(value) {
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  return url.toString();
}

function isoAgeDays(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.floor((Date.now() - timestamp) / 86_400_000) : Infinity;
}

async function fetchText(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20_000) });
    return {
      requestedUrl: url,
      finalUrl: response.url,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return { requestedUrl: url, finalUrl: url, status: 0, headers: {}, body: '', durationMs: Date.now() - started, error: error.message };
  }
}

async function auditSite({ owner, origin, canonicalOrigin, intentUrls, maxPages }) {
  const systemUrls = [`${origin}/robots.txt`, `${origin}/sitemap.xml`, `${origin}/llms.txt`];
  const [robots, sitemapResponse, llms] = await Promise.all(systemUrls.map(fetchText));
  const sitemapEntries = extractSitemapEntries(sitemapResponse.body);
  const sourceOrigin = new URL(canonicalOrigin).origin;
  const linkedUrls = extractAbsoluteUrls(llms.body).filter((url) => {
    try { return new URL(url).origin === sourceOrigin; } catch { return false; }
  }).map(normalizeCrawlUrl);
  const canonicalUrls = [...new Set([...sitemapEntries.map((entry) => entry.url), ...intentUrls, ...linkedUrls].map(normalizeCrawlUrl))]
    .filter((url) => !/\.(txt|xml|png|jpg|jpeg|webp|mp4)$/i.test(new URL(url).pathname))
    .slice(0, maxPages);
  const documents = [];
  for (const canonicalUrl of canonicalUrls) {
    const canonical = new URL(canonicalUrl);
    const fetchUrl = `${origin}${canonical.pathname}`;
    const response = await fetchText(fetchUrl);
    const contentType = response.headers['content-type'] || '';
    documents.push(contentType.includes('text/html')
      ? auditHtml({ ...response, html: response.body, expectedCanonical: canonicalUrl, expectedIndexable: true })
      : {
          requestedUrl: fetchUrl,
          finalUrl: response.finalUrl,
          status: response.status,
          ok: false,
          checks: [{ id: 'html-response', ok: false, detail: contentType || response.error || 'no content type' }],
        });
  }

  const systemChecks = [
    { id: 'robots-status', ok: robots.status === 200, detail: `HTTP ${robots.status}` },
    { id: 'robots-sitemap', ok: robots.body.includes(`${canonicalOrigin}/sitemap.xml`), detail: `${canonicalOrigin}/sitemap.xml` },
    { id: 'sitemap-status', ok: sitemapResponse.status === 200, detail: `HTTP ${sitemapResponse.status}` },
    { id: 'sitemap-populated', ok: sitemapEntries.length >= 3, detail: `${sitemapEntries.length} URLs` },
    { id: 'sitemap-freshness', ok: sitemapEntries.every((entry) => entry.lastModified && isoAgeDays(entry.lastModified) <= 120), detail: `${sitemapEntries.filter((entry) => !entry.lastModified || isoAgeDays(entry.lastModified) > 120).length} stale URLs` },
    { id: 'llms-status', ok: llms.status === 200, detail: `HTTP ${llms.status}` },
  ];
  return { owner, origin, canonicalOrigin, systemChecks, sitemapEntries, linkedUrls, documents };
}

function markdown(report) {
  const lines = [
    `# Plundrix ${report.environment === 'production' ? 'Production' : 'Local Preview'} Growth Audit`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `**${report.summary.passed}/${report.summary.total} checks passed; ${report.summary.failures} failed.**`,
    '',
  ];
  for (const site of report.sites) {
    lines.push(`## ${site.owner}: ${site.origin}`, '');
    for (const check of site.systemChecks) lines.push(`- ${check.ok ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
    for (const document of site.documents) {
      const failures = document.checks.filter((check) => !check.ok);
      lines.push(`- ${document.ok ? 'PASS' : 'FAIL'} ${document.requestedUrl}${failures.length ? ` - ${failures.map((item) => `${item.id}: ${item.detail}`).join('; ')}` : ''}`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

const args = argsFrom(process.argv.slice(2));
const strategy = JSON.parse(await readFile(resolve('growth', 'strategy.json'), 'utf8'));
const marketingOrigin = normalizeOrigin(args['marketing-origin'] || strategy.canonicalDomains.marketing);
const gameOrigin = normalizeOrigin(args['game-origin'] || strategy.canonicalDomains.game);
const reportName = normalizeReportName(args['report-name']);
const originMap = { marketing: marketingOrigin, game: gameOrigin };
const maxPages = Math.max(1, Math.min(80, Number(args['max-pages'] || 60)));
const sites = [];
for (const owner of ['marketing', 'game']) {
  const configuredOrigin = strategy.canonicalDomains[owner];
  const intentUrls = strategy.routeIntents.filter((route) => route.owner === owner).map((route) => route.url);
  sites.push(await auditSite({ owner, origin: originMap[owner], canonicalOrigin: configuredOrigin, intentUrls, maxPages }));
}

const checks = sites.flatMap((site) => [
  ...site.systemChecks,
  ...site.documents.flatMap((document) => document.checks),
]);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: sites.every((site) => site.origin === site.canonicalOrigin) ? 'production' : 'local-preview',
  sites,
  summary: {
    total: checks.length,
    passed: checks.filter((check) => check.ok).length,
    failures: checks.filter((check) => !check.ok).length,
    pages: sites.reduce((sum, site) => sum + site.documents.length, 0),
  },
};

const reportDir = resolve('reports', 'growth');
await mkdir(reportDir, { recursive: true });
await writeFile(resolve(reportDir, `${reportName}.json`), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await writeFile(resolve(reportDir, `${reportName}.md`), markdown(report), 'utf8');
console.log(`Growth audit: ${report.summary.passed}/${report.summary.total} checks passed across ${report.summary.pages} pages.`);
console.log(`Report: ${resolve(reportDir, `${reportName}.md`)}`);
if (args.check && report.summary.failures) process.exitCode = 1;

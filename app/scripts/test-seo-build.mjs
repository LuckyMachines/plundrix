import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { publicStaticRoutes } from '../src/data/productSpine.js';
import { extractHtmlFacts, extractSitemapEntries } from '../src/lib/seoAudit.js';

const appDir = process.cwd();
const port = 5512;
const origin = `http://127.0.0.1:${port}`;

function expectIncludes(source, value, label) {
  assert.ok(source.includes(value), `${label} should include ${value}`);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error('Timed out waiting for SEO verification server');
}

const homeHtml = await readFile(resolve(appDir, 'dist', 'index.html'), 'utf8');
const playHtml = await readFile(resolve(appDir, 'dist', 'play', 'index.html'), 'utf8');
const trailerHtml = await readFile(resolve(appDir, 'dist', 'trailer', 'index.html'), 'utf8');
const sitemap = await readFile(resolve(appDir, 'dist', 'sitemap.xml'), 'utf8');
const publicSitemap = await readFile(resolve(appDir, 'public', 'sitemap.xml'), 'utf8');
const llms = await readFile(resolve(appDir, 'dist', 'llms.txt'), 'utf8');
const productionDockerfile = await readFile(resolve(appDir, '..', 'Dockerfile'), 'utf8');
const socialCards = ['plundrix-home.jpg', 'plundrix-play.jpg', 'plundrix-trailer.jpg'];

expectIncludes(productionDockerfile, 'COPY app/src/lib ./app/src/lib', 'production runtime');
expectIncludes(productionDockerfile, 'COPY app/src/data ./app/src/data', 'production runtime');

for (const [label, source] of [['home', homeHtml], ['play', playHtml], ['trailer', trailerHtml]]) {
  const structuredData = source.match(/<script id="plundrix-static-jsonld" type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(structuredData, `${label} should include static JSON-LD`);
  assert.doesNotThrow(() => JSON.parse(structuredData[1]), `${label} JSON-LD should parse`);
  assert.equal((source.match(/<link rel="canonical"/g) || []).length, 1, `${label} should have one canonical`);
  assert.equal((source.match(/<meta name="robots"/g) || []).length, 1, `${label} should have one robots tag`);
}

for (const route of publicStaticRoutes()) {
  const routeHtml = await readFile(resolve(appDir, 'dist', ...route.split('/').filter(Boolean), 'index.html'), 'utf8');
  const facts = extractHtmlFacts(routeHtml);
  assert.equal(facts.h1Count, 1, `${route} should ship one crawlable h1 before JavaScript`);
  assert.ok(facts.textLength >= 160, `${route} should ship useful crawlable body copy`);
  assert.ok(facts.linkCount >= 2, `${route} should ship crawlable internal links`);
  expectIncludes(routeHtml, 'data-static-discovery="true"', `${route} static discovery body`);
}

for (const filename of socialCards) {
  const data = await readFile(resolve(appDir, 'dist', 'images', 'og', filename));
  assert.ok(data.length > 50_000, `${filename} should be a substantial social image`);
  assert.equal(data[0], 0xff, `${filename} should be JPEG`);
  assert.equal(data[1], 0xd8, `${filename} should be JPEG`);
}

expectIncludes(homeHtml, 'images/og/plundrix-home.jpg', 'home HTML');
expectIncludes(homeHtml, '"@type":"VideoGame"', 'home structured data');
assert.ok(!homeHtml.includes('"@type":"FAQPage"'), 'game home must not claim FAQ content that only exists on marketing');
expectIncludes(playHtml, 'https://game.plundrix.com/play', 'play canonical');
expectIncludes(playHtml, 'images/og/plundrix-play.jpg', 'play social image');
expectIncludes(trailerHtml, '"@type":"VideoObject"', 'trailer structured data');
expectIncludes(trailerHtml, 'property="og:video"', 'trailer Open Graph tags');
expectIncludes(sitemap, '<loc>https://game.plundrix.com/play</loc>', 'sitemap');
expectIncludes(sitemap, '<loc>https://game.plundrix.com/workshop</loc>', 'sitemap');
expectIncludes(sitemap, '<loc>https://game.plundrix.com/trailer</loc>', 'sitemap');
assert.ok(!sitemap.includes('/ops</loc>'), 'sitemap should exclude operator tools');
assert.ok(!sitemap.includes('/compare'), 'marketing comparison routes should not compete in the game sitemap');
assert.equal(sitemap, publicSitemap, 'public and production sitemaps should stay synchronized');
expectIncludes(llms, '## Authoritative facts', 'llms.txt');
expectIncludes(llms, 'https://plundrix.com/compare', 'llms.txt comparison ownership');
assert.ok(!llms.includes('/simulator'), 'llms.txt should not link to a private production route');
const sitemapEntries = extractSitemapEntries(sitemap);
assert.equal(sitemapEntries.length, publicStaticRoutes().length, 'sitemap should match the public static route registry');
assert.ok(sitemapEntries.every((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.lastModified)), 'every sitemap entry should have a valid lastmod');
assert.equal(
  (playHtml.match(/rel="modulepreload"/g) || []).length,
  1,
  'no-wallet routes should preload only the React runtime, not wallet or query clients',
);
const productionAssets = await readdir(resolve(appDir, 'dist', 'assets'));
assert.equal(productionAssets.some((filename) => filename.endsWith('.map')), false, 'production source maps should not ship');

const server = spawn(process.execPath, ['scripts/serve-dist.mjs'], {
  cwd: appDir,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

try {
  await waitForServer();
  const playResponse = await fetch(`${origin}/play`);
  const servedPlay = await playResponse.text();
  assert.equal(playResponse.status, 200);
  expectIncludes(servedPlay, 'https://game.plundrix.com/play', 'served /play HTML');
  expectIncludes(servedPlay, 'images/og/plundrix-play.jpg', 'served /play HTML');
  expectIncludes(servedPlay, '<h1>', 'served /play crawlable body');

  const comparisonResponse = await fetch(`${origin}/compare/coin-master-alternative`, { redirect: 'manual' });
  assert.equal(comparisonResponse.status, 308);
  assert.equal(comparisonResponse.headers.get('location'), 'https://plundrix.com/compare/coin-master-alternative');

  const llmsResponse = await fetch(`${origin}/llms.txt`);
  assert.match(llmsResponse.headers.get('content-type') || '', /^text\/plain/);

  const privateResponse = await fetch(`${origin}/ops`);
  assert.equal(privateResponse.headers.get('x-robots-tag'), 'noindex, nofollow');

  const videoResponse = await fetch(`${origin}/video/plundrix-gameplay-trailer.mp4`, {
    headers: { Range: 'bytes=0-99' },
  });
  assert.equal(videoResponse.status, 206);
  assert.equal(videoResponse.headers.get('content-type'), 'video/mp4');
  assert.match(videoResponse.headers.get('content-range') || '', /^bytes 0-99\//);
  assert.equal((await videoResponse.arrayBuffer()).byteLength, 100);
} finally {
  server.kill();
}

console.log('SEO build, clean routes, AI reference, and video range checks passed.');

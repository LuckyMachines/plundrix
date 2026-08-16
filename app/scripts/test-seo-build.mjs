import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

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
const comparisonHtml = await readFile(resolve(appDir, 'dist', 'compare', 'coin-master-alternative', 'index.html'), 'utf8');
const sitemap = await readFile(resolve(appDir, 'dist', 'sitemap.xml'), 'utf8');
const publicSitemap = await readFile(resolve(appDir, 'public', 'sitemap.xml'), 'utf8');
const llms = await readFile(resolve(appDir, 'dist', 'llms.txt'), 'utf8');
const socialCards = ['plundrix-home.jpg', 'plundrix-play.jpg', 'plundrix-trailer.jpg'];

for (const [label, source] of [['home', homeHtml], ['play', playHtml], ['trailer', trailerHtml], ['comparison', comparisonHtml]]) {
  const structuredData = source.match(/<script id="plundrix-static-jsonld" type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(structuredData, `${label} should include static JSON-LD`);
  assert.doesNotThrow(() => JSON.parse(structuredData[1]), `${label} JSON-LD should parse`);
  assert.equal((source.match(/<link rel="canonical"/g) || []).length, 1, `${label} should have one canonical`);
  assert.equal((source.match(/<meta name="robots"/g) || []).length, 1, `${label} should have one robots tag`);
}

for (const filename of socialCards) {
  const data = await readFile(resolve(appDir, 'dist', 'images', 'og', filename));
  assert.ok(data.length > 50_000, `${filename} should be a substantial social image`);
  assert.equal(data[0], 0xff, `${filename} should be JPEG`);
  assert.equal(data[1], 0xd8, `${filename} should be JPEG`);
}

expectIncludes(homeHtml, 'images/og/plundrix-home.jpg', 'home HTML');
expectIncludes(homeHtml, '"@type":"VideoGame"', 'home structured data');
expectIncludes(homeHtml, '"@type":"FAQPage"', 'home structured data');
expectIncludes(playHtml, 'https://game.plundrix.com/play', 'play canonical');
expectIncludes(playHtml, 'images/og/plundrix-play.jpg', 'play social image');
expectIncludes(trailerHtml, '"@type":"VideoObject"', 'trailer structured data');
expectIncludes(trailerHtml, 'property="og:video"', 'trailer Open Graph tags');
expectIncludes(comparisonHtml, 'images/og/plundrix-home.jpg', 'comparison social image');
expectIncludes(sitemap, '<loc>https://game.plundrix.com/play</loc>', 'sitemap');
expectIncludes(sitemap, '<loc>https://game.plundrix.com/trailer</loc>', 'sitemap');
assert.ok(!sitemap.includes('/ops</loc>'), 'sitemap should exclude operator tools');
assert.equal(sitemap, publicSitemap, 'public and production sitemaps should stay synchronized');
expectIncludes(llms, '## Authoritative facts', 'llms.txt');

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

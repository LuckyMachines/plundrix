import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { COMPARISON_PAGES, comparisonUrl } from '../src/data/comparisonPages.js';
import {
  CANONICAL_TERMS,
  CTA_VERBS,
  PRODUCT_LOOP,
  ROUTE_META,
  publicStaticRoutes,
  routesForLoopStep,
} from '../src/data/productSpine.js';

const root = resolve(process.cwd(), '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

for (const [path, meta] of Object.entries(ROUTE_META)) {
  assert(meta.label, `${path} missing label`);
  assert(meta.purpose, `${path} missing purpose`);
  assert(meta.title, `${path} missing title`);
  assert(meta.description && meta.description.length >= 30, `${path} missing useful description`);
  assert(meta.routeClass, `${path} missing route class`);
  assert(meta.primaryCta && CTA_VERBS.includes(meta.primaryCta), `${path} has noncanonical CTA: ${meta.primaryCta}`);
}

for (const step of PRODUCT_LOOP) {
  assert(routesForLoopStep(step.id).length > 0, `Loop step has no route: ${step.id}`);
}

for (const [term, definition] of CANONICAL_TERMS) {
  assert(term && definition && definition.endsWith('.'), `Canonical term needs sentence definition: ${term}`);
}

for (const page of COMPARISON_PAGES) {
  assert(page.slug, 'Comparison page missing slug');
  assert(page.metaTitle?.includes('Plundrix'), `${page.slug} title should include Plundrix`);
  assert(page.metaDescription?.length >= 100, `${page.slug} description is too thin`);
  assert(page.faq?.length >= 3, `${page.slug} needs at least three FAQ items`);
}

const sitemapPath = join(root, 'app', 'public', 'sitemap.xml');
assert(existsSync(sitemapPath), 'app/public/sitemap.xml missing');
const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf8') : '';
for (const path of publicStaticRoutes()) {
  const url = `https://game.plundrix.com${path === '/' ? '/' : path}`;
  assert(sitemap.includes(url), `Sitemap missing ${url}`);
}
for (const page of COMPARISON_PAGES) {
  const url = `https://game.plundrix.com${comparisonUrl(page.slug)}`;
  assert(sitemap.includes(url), `Sitemap missing ${url}`);
}

const requiredFiles = [
  'docs/product-cohesion-implementation-plan.md',
  'app/src/data/productSpine.js',
  'app/src/components/cohesion/CohesionLayout.jsx',
  'app/src/components/cohesion/CohesionCards.jsx',
  'app/src/pages/GlossaryPage.jsx',
  'app/src/pages/ProductMapPage.jsx',
  'app/scripts/postbuild-seo-pages.mjs',
];
for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Required cohesion file missing: ${file}`);
}

const markerFiles = requiredFiles.concat([
  'app/src/pages/ReplaysPage.jsx',
  'app/src/pages/GhostsPage.jsx',
  'app/src/pages/OpsPage.jsx',
  'app/src/pages/LaunchPage.jsx',
  'app/src/pages/DesignTowerPage.jsx',
  'app/src/pages/PlaytestPage.jsx',
  'app/src/pages/MutationsPage.jsx',
  'app/src/pages/CompareIndexPage.jsx',
]);
for (const file of markerFiles) {
  const full = join(root, file);
  if (!existsSync(full)) continue;
  const text = readFileSync(full, 'utf8');
  const blockedMarkers = ['TO' + 'DO', 'FIX' + 'ME', 'X' + 'XX', 'HA' + 'CK'];
  const match = blockedMarkers.find((marker) => new RegExp(`\\b${marker}\\b`).test(text));
  assert(!match, `${file} contains placeholder marker ${match}`);
}

if (failures.length) {
  console.error('Product cohesion check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Product cohesion check passed');

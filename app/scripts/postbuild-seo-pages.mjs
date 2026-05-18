import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  COMPARISON_PAGES,
  SITE_ORIGIN,
  absoluteComparisonUrl,
  comparisonUrl,
} from '../src/data/comparisonPages.js';
import { ROUTE_META, publicStaticRoutes } from '../src/data/productSpine.js';

const distRoot = join(process.cwd(), 'dist');
const indexPath = join(distRoot, 'index.html');
const html = await readFile(indexPath, 'utf8');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function pageJsonLd(page) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: page.metaTitle,
        description: page.metaDescription,
        url: absoluteComparisonUrl(page.slug),
        isPartOf: {
          '@type': 'WebSite',
          name: 'Plundrix',
          url: SITE_ORIGIN,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faq.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
        })),
      },
    ],
  };
}

function injectSeo(shell, { title, description, canonical, jsonLd }) {
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Plundrix" />',
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<script id="plundrix-static-jsonld" type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ].join('\n    ');

  return shell
    .replace(/<title>.*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*\/?>/g, '')
    .replace(/<meta property="og:[^"]+"[^>]*\/?>/g, '')
    .replace(/<meta name="twitter:[^"]+"[^>]*\/?>/g, '')
    .replace(/<link rel="canonical"[^>]*\/?>/g, '')
    .replace('</head>', `    ${tags}\n  </head>`);
}

async function writeRouteHtml(routePath, pageHtml) {
  const target = routePath === '/compare'
    ? join(distRoot, 'compare', 'index.html')
    : join(distRoot, ...routePath.split('/').filter(Boolean), 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, pageHtml, 'utf8');
}

const indexJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Plundrix game comparisons',
  description: 'Comparison pages for players looking for Plundrix alternatives to raid games, online board games, sabotage games, and onchain games.',
  url: `${SITE_ORIGIN}/compare`,
  hasPart: COMPARISON_PAGES.map((page) => ({
    '@type': 'WebPage',
    name: page.metaTitle,
    url: absoluteComparisonUrl(page.slug),
    description: page.metaDescription,
  })),
};

for (const route of publicStaticRoutes()) {
  const meta = ROUTE_META[route];
  const jsonLd = route === '/compare'
    ? indexJsonLd
    : {
      '@context': 'https://schema.org',
      '@type': route === '/map' || route === '/glossary' ? 'CollectionPage' : 'WebPage',
      name: meta.title,
      description: meta.description,
      url: `${SITE_ORIGIN}${route === '/' ? '/' : route}`,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Plundrix',
        url: SITE_ORIGIN,
      },
    };
  await writeRouteHtml(route, injectSeo(html, {
    title: meta.title,
    description: meta.description,
    canonical: `${SITE_ORIGIN}${route === '/' ? '/' : route}`,
    jsonLd,
  }));
}

for (const page of COMPARISON_PAGES) {
  await writeRouteHtml(comparisonUrl(page.slug), injectSeo(html, {
    title: page.metaTitle,
    description: page.metaDescription,
    canonical: absoluteComparisonUrl(page.slug),
    jsonLd: pageJsonLd(page),
  }));
}

const staticRoutes = [...new Set([
  ...publicStaticRoutes(),
  ...COMPARISON_PAGES.map((page) => comparisonUrl(page.slug)),
])];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...staticRoutes.map((route) => [
    '  <url>',
    `    <loc>${SITE_ORIGIN}${route === '/' ? '/' : route}</loc>`,
    `    <changefreq>${route === '/' ? 'weekly' : 'monthly'}</changefreq>`,
    `    <priority>${route === '/' ? '1.0' : route === '/compare' ? '0.9' : '0.8'}</priority>`,
    '  </url>',
  ].join('\n')),
  '</urlset>',
].join('\n');

await writeFile(join(distRoot, 'sitemap.xml'), sitemap, 'utf8');

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
const publicRoot = join(process.cwd(), 'public');
const indexPath = join(distRoot, 'index.html');
const html = await readFile(indexPath, 'utf8');
const defaultImage = `${SITE_ORIGIN}/images/og/plundrix-home.jpg`;
const defaultImageAlt = 'Plundrix - Crack the Vault. Break the Table.';
const lastModified = '2026-08-16';

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

function injectSeo(shell, {
  title,
  description,
  canonical,
  jsonLd,
  image = defaultImage,
  imageAlt = defaultImageAlt,
  video,
}) {
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Plundrix" />',
    '<meta property="og:locale" content="en_US" />',
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:secure_url" content="${escapeHtml(image)}" />`,
    '<meta property="og:image:type" content="image/jpeg" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}" />`,
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />',
    ...(video ? [
      `<meta property="og:video" content="${escapeHtml(video)}" />`,
      `<meta property="og:video:secure_url" content="${escapeHtml(video)}" />`,
      '<meta property="og:video:type" content="video/mp4" />',
    ] : []),
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<script id="plundrix-static-jsonld" type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ].join('\n    ');

  return shell
    .replace(/<title>.*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*\/?>/g, '')
    .replace(/<meta property="og:[^"]+"[^>]*\/?>/g, '')
    .replace(/<meta name="twitter:[^"]+"[^>]*\/?>/g, '')
    .replace(/<meta name="robots"[^>]*\/?>/g, '')
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

const homeFaq = [
  ['Can I play without a wallet?', 'Yes. Instant Play starts a four-operator match against three clearly labeled agents in your browser. No signup, wallet, or test ETH is required.'],
  ['What is actually onchain?', 'The live multiplayer beta runs through the published Plundrix contract on Ethereum Sepolia. Instant Play is a fast local version of the same Pick, Search, and Sabotage decision loop.'],
  ['Does the beta cost money?', 'Plundrix has no cash prizes or paid public mode. Instant Play is free. Live Sepolia games may require free test ETH for network gas.'],
  ['Are bots hidden as players?', 'No. Agents and bots are labeled wherever they participate. Live session state, outcomes, and the verified contract can be inspected publicly.'],
];

function sharedNodes() {
  return [
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      name: 'Plundrix',
      url: `${SITE_ORIGIN}/`,
      inLanguage: 'en',
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: 'Lucky Machines, LLC',
      url: `${SITE_ORIGIN}/`,
      sameAs: ['https://github.com/LuckyMachines/plundrix'],
    },
  ];
}

function routeJsonLd(route, meta) {
  const url = `${SITE_ORIGIN}${route === '/' ? '/' : route}`;
  const webPage = {
    '@type': route === '/map' || route === '/glossary' ? 'CollectionPage' : 'WebPage',
    '@id': `${url}#webpage`,
    name: meta.title,
    description: meta.description,
    url,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    about: { '@id': `${SITE_ORIGIN}/#game` },
    inLanguage: 'en',
    dateModified: lastModified,
  };

  const graph = [...sharedNodes(), webPage];
  if (route === '/') {
    graph.push(
      {
        '@type': 'VideoGame',
        '@id': `${SITE_ORIGIN}/#game`,
        name: 'Plundrix',
        description: 'A simultaneous-action vault-heist strategy game for 2-4 players.',
        url: `${SITE_ORIGIN}/`,
        image: defaultImage,
        gamePlatform: 'Web browser',
        playMode: ['SinglePlayer', 'MultiPlayer'],
        numberOfPlayers: '2-4',
        operatingSystem: 'Any modern web browser',
        applicationCategory: 'Game',
        isAccessibleForFree: true,
        author: { '@id': `${SITE_ORIGIN}/#organization` },
        potentialAction: { '@type': 'PlayAction', target: `${SITE_ORIGIN}/play` },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_ORIGIN}/#faq`,
        mainEntity: homeFaq.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    );
  }
  if (route === '/trailer') {
    graph.push({
      '@type': 'VideoObject',
      '@id': `${SITE_ORIGIN}/trailer#video`,
      name: 'Plundrix Gameplay Trailer',
      description: 'A 32-second gameplay trailer assembled from real Plundrix product captures and original game art.',
      thumbnailUrl: `${SITE_ORIGIN}/images/og/plundrix-trailer.jpg`,
      contentUrl: `${SITE_ORIGIN}/video/plundrix-gameplay-trailer.mp4`,
      embedUrl: `${SITE_ORIGIN}/trailer`,
      uploadDate: '2026-08-15',
      duration: 'PT32S',
      inLanguage: 'en',
      isFamilyFriendly: true,
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

for (const route of publicStaticRoutes()) {
  const meta = ROUTE_META[route];
  const jsonLd = route === '/compare'
    ? indexJsonLd
    : routeJsonLd(route, meta);
  const image = meta.image ? `${SITE_ORIGIN}${meta.image}` : defaultImage;
  await writeRouteHtml(route, injectSeo(html, {
    title: meta.title,
    description: meta.description,
    canonical: `${SITE_ORIGIN}${route === '/' ? '/' : route}`,
    jsonLd,
    image,
    imageAlt: route === '/play'
      ? 'Plundrix instant play - Your table is ready. No wallet required.'
      : route === '/trailer'
        ? 'Plundrix gameplay trailer - One vault. No safe turn.'
        : defaultImageAlt,
    video: route === '/trailer' ? `${SITE_ORIGIN}/video/plundrix-gameplay-trailer.mp4` : undefined,
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

function sitemapFrequency(route) {
  if (route === '/terms' || route === '/privacy') return 'yearly';
  if (['/', '/play', '/leaderboard', '/sessions', '/simulator', '/replays'].includes(route)) return 'weekly';
  return 'monthly';
}

function sitemapPriority(route) {
  if (route === '/') return '1.0';
  if (route === '/play' || route === '/compare') return '0.9';
  if (route === '/terms' || route === '/privacy') return '0.4';
  return '0.8';
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...staticRoutes.map((route) => [
    '  <url>',
    `    <loc>${SITE_ORIGIN}${route === '/' ? '/' : route}</loc>`,
    `    <lastmod>${lastModified}</lastmod>`,
    `    <changefreq>${sitemapFrequency(route)}</changefreq>`,
    `    <priority>${sitemapPriority(route)}</priority>`,
    '  </url>',
  ].join('\n')),
  '</urlset>',
].join('\n');

await writeFile(join(distRoot, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(join(publicRoot, 'sitemap.xml'), sitemap, 'utf8');

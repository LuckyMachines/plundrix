import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { SITE_ORIGIN } from '../src/data/comparisonPages.js';
import { ROUTE_META, publicStaticRoutes } from '../src/data/productSpine.js';

const distRoot = join(process.cwd(), 'dist');
const publicRoot = join(process.cwd(), 'public');
const indexPath = join(distRoot, 'index.html');
const html = await readFile(indexPath, 'utf8');
const defaultImage = `${SITE_ORIGIN}/images/og/plundrix-home.jpg`;
const defaultImageAlt = 'Plundrix - Crack the Vault. Break the Table.';
const marketingOrigin = 'https://plundrix.com';

function command(args) {
  return spawnSync('git', args, { cwd: process.cwd(), encoding: 'utf8', windowsHide: true });
}

function contentLastModified() {
  if (process.env.SEO_BUILD_DATE) return process.env.SEO_BUILD_DATE;
  const dirty = command(['status', '--porcelain', '--', 'src', 'public', 'scripts/postbuild-seo-pages.mjs']);
  if (dirty.status === 0 && dirty.stdout.trim()) return new Date().toISOString().slice(0, 10);
  const committed = command(['log', '-1', '--format=%cs', '--', 'src', 'public', 'scripts/postbuild-seo-pages.mjs']);
  return committed.status === 0 && /^\d{4}-\d{2}-\d{2}$/.test(committed.stdout.trim())
    ? committed.stdout.trim()
    : new Date().toISOString().slice(0, 10);
}

const lastModified = contentLastModified();

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
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

function publicNextRoutes(meta) {
  return (meta.nextRoutes || [])
    .filter((path) => ROUTE_META[path] && ROUTE_META[path].public !== false)
    .slice(0, 2);
}

function staticRouteBody(route, meta) {
  const links = publicNextRoutes(meta);
  if (!links.includes('/play') && route !== '/play') links.unshift('/play');
  const linkHtml = links.slice(0, 2).map((path) => {
    const destination = ROUTE_META[path];
    return `<a href="${escapeHtml(path)}">${escapeHtml(destination?.title || 'Play Plundrix')}</a>`;
  }).join('\n        ');
  const context = route === '/'
    ? 'Choose a complete no-wallet match against three labeled agents or enter a live multiplayer table on Ethereum Sepolia. Every round resolves Pick, Search, and Sabotage together.'
    : 'Plundrix is a free-play simultaneous-action vault race. Players read the table, build tools, pressure rivals, and try to crack five locks first.';
  return `<main data-static-discovery="true">
      <nav aria-label="Discovery"><a href="${marketingOrigin}">About Plundrix</a> <a href="${SITE_ORIGIN}/">Player Hub</a></nav>
      <p>${escapeHtml(meta.label)}</p>
      <h1>${escapeHtml(meta.title)}</h1>
      <p>${escapeHtml(meta.description)}</p>
      <p>${escapeHtml(context)}</p>
      <div>${linkHtml}</div>
    </main>`;
}

function injectStaticBody(shell, content) {
  return shell.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

async function writeRouteHtml(routePath, pageHtml) {
  const target = routePath === '/compare'
    ? join(distRoot, 'compare', 'index.html')
    : join(distRoot, ...routePath.split('/').filter(Boolean), 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, pageHtml, 'utf8');
}

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
      url: `${marketingOrigin}/`,
      sameAs: [`${SITE_ORIGIN}/`, 'https://github.com/LuckyMachines/plundrix'],
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
    graph.push({
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
      });
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
  const jsonLd = routeJsonLd(route, meta);
  const image = meta.image ? `${SITE_ORIGIN}${meta.image}` : defaultImage;
  const pageHtml = injectSeo(html, {
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
  });
  await writeRouteHtml(route, injectStaticBody(pageHtml, staticRouteBody(route, meta)));
}

const staticRoutes = [...new Set([
  ...publicStaticRoutes(),
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

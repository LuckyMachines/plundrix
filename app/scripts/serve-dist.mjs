import { createServer, request as requestHttp } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 8080);
const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const mimeByExt = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
};

const publicClientRoutes = new Set([
  '/',
  '/play',
  '/trailer',
  '/leaderboard',
  '/sessions',
  '/terms',
  '/privacy',
  '/replays',
  '/glossary',
]);

function isKnownClientPath(pathname) {
  return publicClientRoutes.has(pathname) ||
    /^\/game\/\d+$/.test(pathname) ||
    /^\/profile\/0x[a-fA-F0-9]{40}$/.test(pathname) ||
    /^\/replay\/[a-zA-Z0-9-]+$/.test(pathname);
}

function isSafePath(pathname) {
  return !pathname.includes('..');
}

function isNoIndexPath(pathname) {
  return [
    '/compare',
    '/design',
    '/design-system',
    '/game/',
    '/ghosts',
    '/launch',
    '/mutations',
    '/ops',
    '/playtest',
    '/profile/',
    '/snapshot',
  ].some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

async function serveFile(req, res, filePath, fallbackContentType = 'application/octet-stream', statusCode = 200) {
  const data = await readFile(filePath);
  const ext = extname(filePath).toLowerCase();
  const cacheControl = ['.html', '.json', '.txt', '.xml'].includes(ext)
    ? 'no-cache'
    : 'public, max-age=31536000, immutable';
  const headers = {
    'Content-Type': mimeByExt[ext] || fallbackContentType,
    'Cache-Control': cacheControl,
    'Content-Security-Policy': "default-src 'self'; connect-src 'self' https: wss:; img-src 'self' data:; media-src 'self'; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' https://plausible.racerverse.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  if (ext === '.mp4') {
    headers['Accept-Ranges'] = 'bytes';
    const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (range) {
      const suffixLength = !range[1] && range[2] ? Number(range[2]) : null;
      const start = suffixLength === null
        ? Number(range[1] || 0)
        : Math.max(0, data.length - suffixLength);
      const end = suffixLength === null && range[2]
        ? Math.min(Number(range[2]), data.length - 1)
        : data.length - 1;
      if (start > end || start >= data.length) {
        res.writeHead(416, { 'Content-Range': `bytes */${data.length}` });
        res.end();
        return;
      }
      const chunk = data.subarray(start, end + 1);
      res.writeHead(206, {
        ...headers,
        'Content-Range': `bytes ${start}-${end}/${data.length}`,
        'Content-Length': chunk.length,
      });
      res.end(req.method === 'HEAD' ? undefined : chunk);
      return;
    }
  }

  res.writeHead(statusCode, { ...headers, 'Content-Length': data.length });
  res.end(req.method === 'HEAD' ? undefined : data);
}

const server = createServer(async (req, res) => {
  try {
    const rawUrl = req.url || '/';
    const pathname = decodeURIComponent(rawUrl.split('?')[0]);
    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, service: 'plundrix-web' }));
      return;
    }
    if (pathname.startsWith('/api/')) {
      const upstream = requestHttp({
        hostname: '127.0.0.1',
        port: Number(process.env.AGENT_PORT || 8787),
        path: rawUrl,
        method: req.method,
        headers: { ...req.headers, host: '127.0.0.1' },
      }, (upstreamResponse) => {
        res.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
        upstreamResponse.pipe(res);
      });
      upstream.on('error', () => {
        if (res.headersSent) return res.end();
        res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Live competition feed unavailable' }));
      });
      req.pipe(upstream);
      return;
    }
    if (pathname === '/compare' || pathname.startsWith('/compare/')) {
      res.writeHead(308, {
        Location: `https://plundrix.com${pathname}`,
        'Cache-Control': 'public, max-age=86400',
      });
      res.end();
      return;
    }
    if (!isSafePath(pathname)) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad request');
      return;
    }
    if (isNoIndexPath(pathname)) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }

    const normalized = normalize(pathname).replace(/^\\+|^\/+/, '');
    const targets = normalized === ''
      ? ['index.html']
      : [normalized, join(normalized, 'index.html')];

    for (const target of targets) {
      try {
        await serveFile(req, res, join(distDir, target));
        return;
      } catch {}
    }

    const knownClientPath = isKnownClientPath(pathname);
    if (!knownClientPath) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    await serveFile(
      req,
      res,
      join(distDir, 'index.html'),
      'text/html; charset=utf-8',
      knownClientPath ? 200 : 404,
    );
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving dist on 0.0.0.0:${port}`);
});


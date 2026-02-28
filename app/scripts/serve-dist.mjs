import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 8080);
const distDir = join(process.cwd(), 'dist');

const mimeByExt = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function isSafePath(pathname) {
  return !pathname.includes('..');
}

async function serveFile(res, filePath, fallbackContentType = 'application/octet-stream') {
  const data = await readFile(filePath);
  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': mimeByExt[ext] || fallbackContentType,
    'Cache-Control':
      ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  res.end(data);
}

const server = createServer(async (req, res) => {
  try {
    const rawUrl = req.url || '/';
    const pathname = decodeURIComponent(rawUrl.split('?')[0]);
    if (!isSafePath(pathname)) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad request');
      return;
    }

    const normalized = normalize(pathname).replace(/^\\+|^\/+/, '');
    const target = normalized === '' ? 'index.html' : normalized;
    const targetPath = join(distDir, target);

    try {
      await serveFile(res, targetPath);
      return;
    } catch {}

    await serveFile(res, join(distDir, 'index.html'), 'text/html; charset=utf-8');
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving dist on 0.0.0.0:${port}`);
});


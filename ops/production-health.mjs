import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const origin = String(process.env.PLUNDRIX_HEALTH_ORIGIN || 'https://game.plundrix.com').replace(/\/$/, '');
const outputPath = resolve(process.env.PLUNDRIX_HEALTH_OUTPUT || 'reports/ops/production-health-latest.json');
const timeoutMs = Math.max(2_000, Number(process.env.PLUNDRIX_HEALTH_TIMEOUT_MS) || 20_000);
const maxLatencyMs = Math.max(500, Number(process.env.PLUNDRIX_HEALTH_MAX_LATENCY_MS) || 5_000);

async function probe(id, path, validate, { contentType, headers, status = 200 } = {}) {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: contentType || '*/*', ...headers } });
    const type = response.headers.get('content-type') || '';
    const body = type.includes('json')
      ? await response.json()
      : type.startsWith('image/') || type.startsWith('audio/') ? new Uint8Array(await response.arrayBuffer()) : await response.text();
    const latencyMs = Date.now() - startedAt;
    const valid = response.status === status && (!contentType || type.includes(contentType)) && validate(body, response);
    return { id, path, status: response.status, latencyMs, latencyBudgetMs: maxLatencyMs, pass: Boolean(valid) && latencyMs <= maxLatencyMs };
  } catch (error) {
    return { id, path, status: 0, latencyMs: Date.now() - startedAt, latencyBudgetMs: maxLatencyMs, pass: false, error: String(error?.message || error).slice(0, 160) };
  }
}

const checks = await Promise.all([
  probe('web', '/health', (body) => body?.ok === true && body?.service === 'plundrix-web', { contentType: 'json' }),
  probe('weekly-storage', '/api/weekly-vault', (body) => body?.durability === 'service-file' && Array.isArray(body?.scores), { contentType: 'json' }),
  probe('leaderboard', '/api/competition/leaderboard?queue=all&limit=3', (body) => Array.isArray(body?.entries), { contentType: 'json' }),
  probe('discovery', '/sitemap.xml', (body) => body.includes('<urlset'), { contentType: 'xml' }),
  probe('social-image', '/images/og/plundrix-play.jpg', (body) => body.byteLength > 50_000, { contentType: 'image/jpeg' }),
  probe('music-stream', '/audio/music/caper-in-motion.mp3', (body, response) => body.byteLength === 100 && /^bytes 0-99\//.test(response.headers.get('content-range') || ''), { contentType: 'audio/mpeg', headers: { Range: 'bytes=0-99' }, status: 206 }),
]);

const slow = checks.filter((check) => check.latencyMs > maxLatencyMs).map((check) => check.id);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  origin,
  latencyBudgetMs: maxLatencyMs,
  pass: checks.every((check) => check.pass),
  slow,
  checks,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`${report.pass ? 'PASS' : 'FAIL'} production health / ${checks.filter((check) => check.pass).length}/${checks.length} checks / ${slow.length} slow`);
for (const check of checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id} ${check.status} ${check.latencyMs}ms`);
if (!report.pass) process.exitCode = 1;

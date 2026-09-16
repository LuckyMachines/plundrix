import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const origin = String(process.env.PLUNDRIX_HEALTH_ORIGIN || 'https://game.plundrix.com').replace(/\/$/, '');
const outputPath = resolve(process.env.PLUNDRIX_HEALTH_OUTPUT || 'reports/ops/production-health-latest.json');
const timeoutMs = Math.max(2_000, Number(process.env.PLUNDRIX_HEALTH_TIMEOUT_MS) || 20_000);

async function probe(id, path, validate, { contentType } = {}) {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: contentType || '*/*' } });
    const type = response.headers.get('content-type') || '';
    const body = type.includes('json')
      ? await response.json()
      : type.startsWith('image/') ? new Uint8Array(await response.arrayBuffer()) : await response.text();
    const valid = response.ok && (!contentType || type.includes(contentType)) && validate(body, response);
    return { id, path, status: response.status, latencyMs: Date.now() - startedAt, pass: Boolean(valid) };
  } catch (error) {
    return { id, path, status: 0, latencyMs: Date.now() - startedAt, pass: false, error: String(error?.message || error).slice(0, 160) };
  }
}

const checks = await Promise.all([
  probe('web', '/health', (body) => body?.ok === true && body?.service === 'plundrix-web', { contentType: 'json' }),
  probe('weekly-storage', '/api/weekly-vault', (body) => body?.durability === 'service-file' && Array.isArray(body?.scores), { contentType: 'json' }),
  probe('leaderboard', '/api/competition/leaderboard?queue=all&limit=3', (body) => Array.isArray(body?.entries), { contentType: 'json' }),
  probe('discovery', '/sitemap.xml', (body) => body.includes('<urlset'), { contentType: 'xml' }),
  probe('social-image', '/images/og/plundrix-play.jpg', (body) => body.byteLength > 50_000, { contentType: 'image/jpeg' }),
]);

const slow = checks.filter((check) => check.latencyMs > 5_000).map((check) => check.id);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  origin,
  pass: checks.every((check) => check.pass),
  slow,
  checks,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`${report.pass ? 'PASS' : 'FAIL'} production health / ${checks.filter((check) => check.pass).length}/${checks.length} checks / ${slow.length} slow`);
for (const check of checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id} ${check.status} ${check.latencyMs}ms`);
if (!report.pass) process.exitCode = 1;

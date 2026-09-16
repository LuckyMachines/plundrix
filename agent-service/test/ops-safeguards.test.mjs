import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const run = promisify(execFile);

test('competition backup validates, copies, and checksums the weekly store', async (context) => {
  const directory = mkdtempSync(join(tmpdir(), 'plundrix-ops-backup-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const source = join(directory, 'weekly.json');
  const output = join(directory, 'backup', 'weekly.json');
  writeFileSync(source, JSON.stringify({ schemaVersion: 1, challenges: { '2026-w37': [] } }), 'utf8');

  const { stdout } = await run(process.execPath, [resolve('ops/backup-competition.mjs')], {
    cwd: resolve('.'),
    windowsHide: true,
    env: { ...process.env, AGENT_WEEKLY_VAULT_SCORES_PATH: source, PLUNDRIX_BACKUP_OUTPUT: output },
  });
  const lines = stdout.split(/\r?\n/);
  const jsonStart = lines.findIndex((line) => line.trim() === '{');
  assert.notEqual(jsonStart, -1);
  const result = JSON.parse(lines.slice(jsonStart).join('\n'));
  assert.equal(result.challengeCount, 1);
  assert.deepEqual(JSON.parse(readFileSync(output, 'utf8')), { schemaVersion: 1, challenges: { '2026-w37': [] } });
  assert.match(readFileSync(`${output}.sha256`, 'utf8'), /^[a-f0-9]{64}  weekly\.json\n$/);
});

test('production health writes a passing machine-readable report', async (context) => {
  const directory = mkdtempSync(join(tmpdir(), 'plundrix-ops-health-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const output = join(directory, 'health.json');
  const image = Buffer.alloc(50_001);
  const server = createServer((request, response) => {
    if (request.url === '/health') { response.setHeader('content-type', 'application/json'); return response.end(JSON.stringify({ ok: true, service: 'plundrix-web' })); }
    if (request.url === '/api/weekly-vault') { response.setHeader('content-type', 'application/json'); return response.end(JSON.stringify({ durability: 'service-file', scores: [] })); }
    if (request.url?.startsWith('/api/competition/leaderboard')) { response.setHeader('content-type', 'application/json'); return response.end(JSON.stringify({ entries: [] })); }
    if (request.url === '/sitemap.xml') { response.setHeader('content-type', 'application/xml'); return response.end('<urlset></urlset>'); }
    if (request.url === '/images/og/plundrix-play.jpg') { response.setHeader('content-type', 'image/jpeg'); response.setHeader('content-length', image.length); return response.end(image); }
    response.statusCode = 404;
    return response.end('missing');
  });
  context.after(() => server.close());
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  const { stdout } = await run(process.execPath, [resolve('ops/production-health.mjs')], {
    cwd: resolve('.'),
    windowsHide: true,
    env: { ...process.env, PLUNDRIX_HEALTH_ORIGIN: `http://127.0.0.1:${address.port}`, PLUNDRIX_HEALTH_OUTPUT: output },
  });
  assert.match(stdout, /PASS production health \/ 5\/5 checks/);
  const report = JSON.parse(readFileSync(output, 'utf8'));
  assert.equal(report.pass, true);
  assert.equal(report.checks.length, 5);
});

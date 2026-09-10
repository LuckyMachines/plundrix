import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appDir = resolve(process.cwd());
const manifest = JSON.parse(readFileSync(resolve(appDir, 'ui-review', 'manifest.json'), 'utf8'));
const typeLayoutManifest = JSON.parse(readFileSync(resolve(appDir, 'ui-review', 'type-layout.json'), 'utf8'));
const packageJson = JSON.parse(readFileSync(resolve(appDir, 'package.json'), 'utf8'));
const ledger = JSON.parse(readFileSync(resolve(appDir, 'improvement', 'ledger.json'), 'utf8'));
const tokens = readFileSync(resolve(appDir, 'src', 'styles', 'tokens.css'), 'utf8');
const experimentIds = new Set(ledger.experiments.map((experiment) => experiment.id));

assert.equal(manifest.schemaVersion, 1);
assert.ok(manifest.surfaces.length >= 10 && manifest.surfaces.length <= 14, 'Keep the solo matrix between 10 and 14 surfaces');
assert.deepEqual(manifest.defaults.viewports, ['desktop', 'mobile']);
assert.ok(manifest.defaults.maxDiffPixelRatio <= 0.005, 'Default visual threshold must remain strict');

const ids = new Set();
for (const surface of manifest.surfaces) {
  assert.match(surface.id, /^[a-z0-9-]+$/);
  assert.ok(!ids.has(surface.id), `Duplicate surface id: ${surface.id}`);
  ids.add(surface.id);
  assert.ok(surface.path.startsWith('/'), `${surface.id} needs an application path`);
  assert.ok(['P0', 'P1'].includes(surface.priority), `${surface.id} needs P0 or P1 priority`);
  assert.ok(surface.ready?.type, `${surface.id} needs a deterministic ready condition`);
  assert.ok(surface.reviewFocus?.length >= 3, `${surface.id} needs three concrete review prompts`);
  for (const experimentId of surface.experimentIds || []) {
    assert.ok(experimentIds.has(experimentId), `${surface.id} references unknown experiment ${experimentId}`);
  }
  for (const viewport of manifest.defaults.viewports) {
    assert.ok(existsSync(resolve(appDir, 'tests', 'e2e', '__screenshots__', `${surface.id}-${viewport}.png`)),
      `Missing approved baseline: ${surface.id}-${viewport}.png`);
  }
}

assert.equal(ledger.experiments.filter((experiment) => experiment.status === 'active').length, 1,
  'The solo improvement system requires exactly one active experiment');

for (const viewport of Object.values(manifest.viewports)) {
  assert.ok(viewport.width >= 320 && viewport.height >= 600, 'Viewport is too small to represent a supported UI');
}

assert.deepEqual(Object.values(typeLayoutManifest.viewports).map(({ width }) => width), [320, 390, 768, 1440]);
assert.ok(typeLayoutManifest.rules.minimumFontPixels >= 12);
assert.ok(typeLayoutManifest.rules.maximumMeasureInEms <= 42);
for (const viewport of Object.keys(typeLayoutManifest.viewports)) {
  assert.ok(existsSync(resolve(appDir, 'tests', 'e2e', '__screenshots__', `type-layout-stress-${viewport}.png`)),
    `Missing layout/type stress baseline: type-layout-stress-${viewport}.png`);
}

for (const path of [
  'playwright.ui.config.js',
  'tests/e2e/ui-review.spec.js',
  'scripts/ui-review.mjs',
  'scripts/compose-ui-review.py',
  'ui-review/acceptance-checklist.md',
  '../docs/ui-improvement-system.md',
  'ui-review/type-layout.json',
  'scripts/style-contract.mjs',
  'src/styles/typography.css',
  'src/styles/layout.css',
  'src/components/layout/LayoutPrimitives.jsx',
]) assert.ok(existsSync(resolve(appDir, path)), `Missing UI-review system file: ${path}`);

assert.match(readFileSync(resolve(appDir, 'tests/e2e/ui-review.spec.js'), 'utf8'), /toHaveScreenshot/);
assert.match(readFileSync(resolve(appDir, 'tests/e2e/ui-review.spec.js'), 'utf8'), /at least 12px/);
assert.match(readFileSync(resolve(appDir, 'tests/e2e/ui-review.spec.js'), 'utf8'), /Stress prose measure should remain readable/);
assert.match(readFileSync(resolve(appDir, 'scripts/ui-review.mjs'), 'utf8'), /Baseline approval requires/);
assert.match(readFileSync(resolve(appDir, 'playwright.config.js'), 'utf8'), /snapshotPathTemplate/);
const approvals = readFileSync(resolve(appDir, 'ui-review', 'approvals.ndjson'), 'utf8')
  .trim()
  .split(/\r?\n/)
  .map((line) => JSON.parse(line));
assert.ok(approvals.length >= 1, 'At least one reasoned baseline approval is required');
assert.ok(approvals.every((approval) => approval.reason?.trim()), 'Every baseline approval needs a reason');
for (const token of [
  '--color-vault-dark',
  '--color-vault-text',
  '--color-tungsten',
  '--color-signal-red',
  '--color-oxide-green',
  '--color-blueprint',
  '--font-display',
  '--font-mono',
  '--space-md',
  '--radius-panel',
  '--motion-quick',
]) assert.ok(tokens.includes(token), `Missing canonical design token: ${token}`);
assert.equal(packageJson.scripts['ui:review'], 'node scripts/ui-review.mjs');
assert.equal(packageJson.scripts['ui:approve'], 'node scripts/ui-review.mjs --approve');

console.log(`UI review system passed: ${manifest.surfaces.length} surfaces x ${manifest.defaults.viewports.length} viewports`);

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const appDir = resolve(process.cwd());
const sourceDir = resolve(appDir, 'src');
const fix = process.argv.includes('--fix');

const replacements = new Map([
  ['text-[8px]', 'text-micro'],
  ['text-[9px]', 'text-micro'],
  ['text-[10px]', 'text-micro'],
  ['text-[11px]', 'text-micro'],
  ['text-[clamp(3.6rem,8vw,7.4rem)]', 'type-hero'],
  ['leading-[0.82]', 'leading-display'],
  ['leading-[0.88]', 'leading-display'],
  ['leading-[0.9]', 'leading-display'],
  ['leading-[0.92]', 'leading-display'],
  ['leading-[0.95]', 'leading-heading'],
  ['tracking-[-0.035em]', 'tracking-display'],
  ['tracking-[0.01em]', 'tracking-display'],
  ['tracking-[0.03em]', 'tracking-display'],
  ['tracking-[0.04em]', 'tracking-heading'],
  ['tracking-[0.06em]', 'tracking-heading'],
  ['tracking-[0.08em]', 'tracking-heading'],
  ['tracking-[.1em]', 'tracking-interface'],
  ['tracking-[0.1em]', 'tracking-interface'],
  ['tracking-[.12em]', 'tracking-interface'],
  ['tracking-[0.12em]', 'tracking-interface'],
  ['tracking-[0.13em]', 'tracking-label'],
  ['tracking-[.14em]', 'tracking-label'],
  ['tracking-[0.14em]', 'tracking-label'],
  ['tracking-[0.15em]', 'tracking-label'],
  ['tracking-[.16em]', 'tracking-label'],
  ['tracking-[0.16em]', 'tracking-label'],
  ['tracking-[.18em]', 'tracking-brand'],
  ['tracking-[0.18em]', 'tracking-brand'],
  ['tracking-[.2em]', 'tracking-brand'],
  ['tracking-[0.2em]', 'tracking-brand'],
  ['tracking-[.22em]', 'tracking-beacon'],
  ['tracking-[0.22em]', 'tracking-beacon'],
  ['tracking-[0.24em]', 'tracking-beacon'],
  ['tracking-[0.25em]', 'tracking-beacon'],
  ['tracking-[0.28em]', 'tracking-beacon'],
  ['tracking-[0.3em]', 'tracking-beacon'],
  ['tracking-[0.35em]', 'tracking-beacon'],
  ['tracking-[0.4em]', 'tracking-beacon'],
]);

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return ['.js', '.jsx', '.css'].includes(extname(entry.name)) ? [path] : [];
  });
}

const files = sourceFiles(sourceDir);
if (fix) {
  let changed = 0;
  for (const file of files.filter((path) => ['.js', '.jsx'].includes(extname(path)))) {
    const before = readFileSync(file, 'utf8');
    let after = before;
    for (const [from, to] of replacements) after = after.split(from).join(to);
    if (after !== before) {
      writeFileSync(file, after, 'utf8');
      changed += 1;
    }
  }
  console.log(`Typography migration updated ${changed} source files.`);
}

const violations = [];
for (const file of files.filter((path) => ['.js', '.jsx'].includes(extname(path)))) {
  const source = readFileSync(file, 'utf8');
  for (const pattern of [
    /text-\[(?:\d+(?:\.\d+)?px|clamp\([^\]]+\))\]/g,
    /tracking-\[[^\]]+\]/g,
    /leading-\[[^\]]+\]/g,
  ]) {
    for (const match of source.matchAll(pattern)) violations.push(`${file.slice(appDir.length + 1)}: ${match[0]}`);
  }
}

assert.deepEqual(violations, [], `Arbitrary typography bypasses the semantic contract:\n${violations.join('\n')}`);

const cssViolations = [];
for (const file of files.filter((path) => extname(path) === '.css' && !path.endsWith('tokens.css'))) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/font-size:\s*([0-9.]+)(px|rem)/g)) {
    const pixels = match[2] === 'rem' ? Number(match[1]) * 16 : Number(match[1]);
    if (pixels < 12) cssViolations.push(`${file.slice(appDir.length + 1)}: ${match[0]}`);
  }
  for (const line of source.split(/\r?\n/).filter((item) => item.includes('letter-spacing:'))) {
    if (!line.includes('var(--tracking-')) cssViolations.push(`${file.slice(appDir.length + 1)}: ${line.trim()}`);
  }
  for (const match of source.matchAll(/font:\s*[^;]*\s([0-9.]+)px\//g)) {
    if (Number(match[1]) < 12) cssViolations.push(`${file.slice(appDir.length + 1)}: ${match[0]}`);
  }
}
assert.deepEqual(cssViolations, [], `CSS bypasses the readable type floor or tracking tokens:\n${cssViolations.join('\n')}`);

const tokens = readFileSync(resolve(sourceDir, 'styles', 'tokens.css'), 'utf8');
const typography = readFileSync(resolve(sourceDir, 'styles', 'typography.css'), 'utf8');
const layout = readFileSync(resolve(sourceDir, 'styles', 'layout.css'), 'utf8');
const primitives = resolve(sourceDir, 'components', 'layout', 'LayoutPrimitives.jsx');

for (const token of [
  '--font-body', '--text-micro', '--tracking-interface', '--tracking-label', '--tracking-brand',
  '--leading-copy', '--measure-prose', '--layout-gutter', '--layout-section-gap', '--layout-content',
]) assert.ok(tokens.includes(token), `Missing semantic token: ${token}`);

for (const role of ['.type-hero', '.type-page', '.type-section', '.type-card', '.type-body', '.type-interface', '.type-label']) {
  assert.ok(typography.includes(role), `Missing semantic type role: ${role}`);
}

for (const primitive of ['.l-page', '.l-stack', '.l-cluster', '.l-grid', '.l-rail', '.l-decision']) {
  assert.ok(layout.includes(primitive), `Missing layout primitive: ${primitive}`);
}

assert.ok(existsSync(primitives), 'Missing React layout primitives');
console.log(`Style contract passed: ${files.length} files, zero arbitrary typography values, 12px minimum text.`);

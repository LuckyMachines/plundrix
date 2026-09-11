import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildGrowthSnapshot, exportGrowthMarkdown } from '../src/lib/growthSystem.js';

function argsFrom(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const next = argv[index + 1];
    args[token.slice(2)] = !next || next.startsWith('--') ? true : next;
    if (args[token.slice(2)] !== true) index += 1;
  }
  return args;
}

async function optionalJson(path) {
  if (!path) return null;
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return null; }
}

const args = argsFrom(process.argv.slice(2));
const strategy = JSON.parse(await readFile(resolve('growth', 'strategy.json'), 'utf8'));
const campaigns = JSON.parse(await readFile(resolve('growth', 'campaigns.json'), 'utf8'));
const metrics = await optionalJson(args.metrics ? resolve(String(args.metrics)) : resolve('reports', 'growth', 'metrics-latest.json'));
const audit = await optionalJson(resolve('reports', 'growth', 'latest-audit.json'));
const snapshot = buildGrowthSnapshot({ strategy, campaigns, metrics, audit });
if (!snapshot.validation.ok) throw new Error(snapshot.validation.errors.join('\n'));

const reportDir = resolve('reports', 'growth');
await mkdir(reportDir, { recursive: true });
await writeFile(resolve(reportDir, 'latest.json'), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
await writeFile(resolve(reportDir, 'latest.md'), exportGrowthMarkdown(snapshot), 'utf8');

console.log(`Growth review: ${snapshot.nextAction}`);
console.log(`Report: ${resolve(reportDir, 'latest.md')}`);

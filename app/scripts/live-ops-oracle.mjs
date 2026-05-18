import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  exportOracleJson,
  exportOracleMarkdown,
  exportRecommendationsCsv,
  generateOracleReport,
} from '../src/lib/liveOpsOracle.js';

const ROOT = resolve(process.cwd(), '..');
const FILES = [
  '.gitignore',
  '.github/workflows/balance-autopilot-smoke.yml',
  'docs/balance-autopilot-latest.md',
  'docs/replay-director-latest.md',
  'docs/simulator-improvement-report.md',
  'docs/go-live-checklist.md',
  'docs/mainnet-runbook.md',
  'docs/dev/balance-autopilot.mdx',
  'docs/dev/replay-director.mdx',
  'docs/dev/deployment.mdx',
  'docs/dev/local-dev.mdx',
  'docs/dev/mechanics.mdx',
  'docs/dev/live-events.mdx',
];

function readArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

async function readFiles() {
  const entries = await Promise.all(
    FILES.map(async (path) => {
      const full = join(ROOT, path);
      if (!existsSync(full)) return [path, ''];
      return [path, await readFile(full, 'utf8')];
    }),
  );
  return Object.fromEntries(entries);
}

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

function printSummary(report) {
  console.log('Plundrix Live Ops Oracle');
  console.log(`generatedAt: ${report.generatedAt}`);
  console.log(`health: ${report.health.score}/100 ${report.health.status}`);
  console.log(report.health.explanation);
  console.log('');
  console.log('Next best actions:');
  for (const item of report.recommendations.slice(0, 5)) {
    console.log(`#${item.rank} ${item.category}: ${item.title}`);
    if (item.commands[0]) console.log(`  ${item.commands[0]}`);
  }
  console.log('');
  console.log('Risks:');
  for (const risk of report.risks.slice(0, 5)) {
    console.log(`- ${risk.severity}: ${risk.title}`);
  }
}

const args = readArgs(process.argv.slice(2));
const files = await readFiles();
const packageJson = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf8'));
const liveEvents = args['live-events']
  ? JSON.parse(await readFile(join(process.cwd(), args['live-events']), 'utf8'))
  : [];
const report = generateOracleReport({
  seed: args.seed || 'oracle-cli',
  heavy: Boolean(args.heavy),
  horizon: args.horizon || 'daily',
  files,
  packageJson,
  liveEvents,
});

if (args.out) {
  const format = args.format || (args.json ? 'json' : args.csv ? 'csv' : args['release-notes'] ? 'release-notes' : args['marketing-bundle'] ? 'marketing-bundle' : 'markdown');
  const content =
    format === 'json'
      ? exportOracleJson(report)
      : format === 'csv'
        ? exportRecommendationsCsv(report)
        : format === 'release-notes'
          ? report.releaseNotes
          : format === 'marketing-bundle'
            ? JSON.stringify(report.marketingBundle, null, 2)
            : exportOracleMarkdown(report);
  await writeOutput(join(process.cwd(), args.out), content);
}

if (args.report) {
  await writeOutput(
    join(process.cwd(), 'reports', 'live-ops', `live-ops-oracle-${Date.now()}.md`),
    exportOracleMarkdown(report),
  );
}

if (args.json) {
  console.log(exportOracleJson(report));
} else if (args.csv) {
  console.log(exportRecommendationsCsv(report));
} else if (args['release-notes']) {
  console.log(report.releaseNotes);
} else if (args['marketing-bundle']) {
  console.log(JSON.stringify(report.marketingBundle, null, 2));
} else if (args.markdown) {
  console.log(exportOracleMarkdown(report));
} else {
  printSummary(report);
}

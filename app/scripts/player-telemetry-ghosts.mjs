import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  exportGhostReportCsv,
  exportGhostReportJson,
  exportGhostReportMarkdown,
  exportGhostRosterJson,
  importGhostRosterJson,
  runGhostBatch,
} from '../src/lib/playerTelemetryGhosts.js';
import { SIM_DEFAULT_RULES } from '../src/lib/plundrixEngine.js';

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

function parseJsonArg(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    const repaired = String(value).replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    return JSON.parse(repaired);
  }
}

async function readRoster(path) {
  if (!path) return null;
  return importGhostRosterJson(await readFile(path, 'utf8'));
}

async function writeOutput(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

function printSummary(report) {
  console.log('Plundrix Player Telemetry Ghosts');
  console.log(`generatedAt: ${report.generatedAt}`);
  console.log(`scenario: ${report.scenario}`);
  console.log(`budget: ${report.budget}`);
  console.log(`games: ${report.games}`);
  console.log(`score: ${report.score.score}/100 ${report.score.grade}`);
  console.log('');
  console.log('Archetype health:');
  for (const item of report.archetypes) {
    console.log(`- ${item.label}: health ${item.healthScore}, win ${(item.winRate * 100).toFixed(1)}%, fun ${item.funContribution}, frustration ${item.frustrationRisk}`);
  }
  console.log('');
  console.log('Next recommendations:');
  for (const item of report.recommendations.slice(0, 4)) {
    console.log(`${item.rank}. ${item.title}`);
  }
}

const args = readArgs(process.argv.slice(2));
const roster = await readRoster(args.roster);
const report = runGhostBatch({
  scenario: args.scenario || 'balanced-cast',
  seed: args.seed || 'ghost-cli',
  budget: args.budget || 'smoke',
  games: args.games ? Number(args.games) : undefined,
  roster,
  rules: { ...SIM_DEFAULT_RULES, ...parseJsonArg(args.rules) },
  maxRounds: args['max-rounds'] ? Number(args['max-rounds']) : 40,
});

if (args.out) {
  const format = args.format || (args.json ? 'json' : args.csv ? 'csv' : args.roster ? 'roster' : 'markdown');
  const content =
    format === 'json'
      ? exportGhostReportJson(report)
      : format === 'csv'
        ? exportGhostReportCsv(report)
        : format === 'roster'
          ? exportGhostRosterJson(report.roster)
          : exportGhostReportMarkdown(report);
  await writeOutput(join(process.cwd(), args.out), content);
}

if (args.report) {
  await writeOutput(
    join(process.cwd(), 'reports', 'ghosts', `player-telemetry-ghosts-${Date.now()}.md`),
    exportGhostReportMarkdown(report),
  );
}

if (args.json) {
  console.log(exportGhostReportJson(report));
} else if (args.csv) {
  console.log(exportGhostReportCsv(report));
} else if (args['roster-json']) {
  console.log(exportGhostRosterJson(report.roster));
} else if (args.markdown) {
  console.log(exportGhostReportMarkdown(report));
} else {
  printSummary(report);
}
